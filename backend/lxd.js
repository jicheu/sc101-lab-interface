'use strict'

const http = require('http')

// LXD Unix socket — accessible via the lxd interface
const LXD_SOCKET = '/var/snap/lxd/common/lxd/unix.socket'

// Grace period before stopping an idle container (ms)
const IDLE_STOP_DELAY = 5 * 60_000   // 5 minutes

// Sessions inactive longer than this are expired and their containers destroyed
const SESSION_EXPIRY_MS = 2 * 60 * 60_000  // 2 hours

// Track active WebSocket connections per container: containerName → count
const activeConnections = new Map()
// Pending stop timers: containerName → timeoutId
const stopTimers = new Map()

// ── LXD REST API helpers ──────────────────────────────────────────────────────

function lxdRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const options = {
      socketPath: LXD_SOCKET,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve({ statusCode: res.statusCode, raw: data }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// Wait for an async LXD operation to complete
async function waitOperation(opUrl, timeoutSec = 60) {
  const waitPath = `${opUrl}/wait?timeout=${timeoutSec}`
  const res = await lxdRequest('GET', waitPath)
  if (res.metadata && res.metadata.status === 'Failure') {
    throw new Error(`LXD operation failed: ${res.metadata.err}`)
  }
  return res
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Container state helpers ───────────────────────────────────────────────────

async function getContainerState(name) {
  const res = await lxdRequest('GET', `/1.0/instances/${name}/state`)
  if (res.error_code === 404 || res.status_code === 404) return null
  return res.metadata || null
}

async function containerRunning(name) {
  try {
    const state = await getContainerState(name)
    return state !== null && state.status === 'Running'
  } catch { return false }
}

async function containerExists(name) {
  try {
    const state = await getContainerState(name)
    return state !== null
  } catch { return false }
}

// ── Container lifecycle ───────────────────────────────────────────────────────

async function startContainer(name) {
  const res = await lxdRequest('PUT', `/1.0/instances/${name}/state`, {
    action: 'start', timeout: 30, force: false,
  })
  if (res.type === 'async') {
    await waitOperation(res.operation, 30)
  } else if (res.error_code && res.error_code !== 0) {
    throw new Error(res.error || 'start failed')
  }
}

async function stopContainerApi(name, force = true) {
  const res = await lxdRequest('PUT', `/1.0/instances/${name}/state`, {
    action: 'stop', timeout: 10, force,
  })
  if (res.type === 'async') {
    try { await waitOperation(res.operation, 15) } catch {}
  }
}

async function createContainer(name) {
  const res = await lxdRequest('POST', '/1.0/instances', {
    name,
    architecture: 'x86_64',
    profiles: ['default'],
    source: {
      type: 'image',
      protocol: 'simplestreams',
      server: 'https://cloud-images.ubuntu.com/releases',
      alias: '24.04',
    },
  })
  if (res.type === 'async') {
    await waitOperation(res.operation, 120)
  } else if (res.error_code && res.error_code !== 0) {
    throw new Error(res.error || 'create failed')
  }
}

// In-flight start promises: prevent concurrent starts for the same container
const startingContainers = new Map()

async function ensureContainerForUser(containerName) {
  if (startingContainers.has(containerName)) {
    await startingContainers.get(containerName)
    return
  }

  if (await containerRunning(containerName)) {
    console.log(`[lxd] Container ${containerName} already running.`)
    return
  }

  const startPromise = (async () => {
    console.log(`[lxd] Starting container ${containerName}…`)

    if (await containerExists(containerName)) {
      await startContainer(containerName)
    } else {
      console.log(`[lxd] Container ${containerName} not found, creating…`)
      await createContainer(containerName)
      console.log(`[lxd] Container ${containerName} created, starting…`)
      await startContainer(containerName)
    }

    // Poll up to 15s for exec-readiness after start
    for (let i = 0; i < 15; i++) {
      if (await containerRunning(containerName)) break
      await sleep(1000)
    }

    if (!(await containerRunning(containerName))) {
      throw new Error(`Container ${containerName} failed to reach RUNNING state`)
    }
    console.log(`[lxd] Container ${containerName} ready.`)
  })()

  startingContainers.set(containerName, startPromise)
  try {
    await startPromise
  } finally {
    startingContainers.delete(containerName)
  }
}

async function stopContainer(name) {
  if (await containerRunning(name)) {
    console.log(`[lxd] Stopping idle container ${name}…`)
    try { await stopContainerApi(name, true) } catch (e) {
      console.error(`[lxd] Stop failed: ${e.message}`)
    }
  }
}

async function destroyContainer(name) {
  if (!(await containerExists(name))) return
  console.log(`[lxd] Destroying container ${name}…`)
  try {
    if (await containerRunning(name)) await stopContainerApi(name, true)
    const res = await lxdRequest('DELETE', `/1.0/instances/${name}`)
    if (res.type === 'async') await waitOperation(res.operation, 30)
    console.log(`[lxd] Container ${name} destroyed.`)
  } catch (e) {
    console.error(`[lxd] Destroy failed: ${e.message}`)
  }
}

// Stop all sc101-* containers — called once at startup
async function stopAllContainers() {
  try {
    const res = await lxdRequest('GET', '/1.0/instances?recursion=1')
    const instances = res.metadata || []
    for (const inst of instances) {
      if (inst.name && inst.name.startsWith('sc101-') && inst.status === 'Running') {
        console.log(`[lxd] Stopping container ${inst.name} on startup…`)
        try { await stopContainerApi(inst.name, true) } catch {}
      }
    }
  } catch (e) {
    console.error(`[lxd] stopAllContainers error: ${e.message}`)
  }
}

// ── Connection tracking ───────────────────────────────────────────────────────

function onConnect(containerName) {
  if (stopTimers.has(containerName)) {
    clearTimeout(stopTimers.get(containerName))
    stopTimers.delete(containerName)
  }
  activeConnections.set(containerName, (activeConnections.get(containerName) || 0) + 1)
}

function onDisconnect(containerName) {
  const count = Math.max(0, (activeConnections.get(containerName) || 1) - 1)
  activeConnections.set(containerName, count)
  if (count === 0) {
    console.log(`[lxd] No active connections for ${containerName}, stopping in ${IDLE_STOP_DELAY / 1000}s…`)
    const timer = setTimeout(() => {
      stopTimers.delete(containerName)
      stopContainer(containerName)
    }, IDLE_STOP_DELAY)
    stopTimers.set(containerName, timer)
  }
}

module.exports = { ensureContainerForUser, stopAllContainers, stopContainer, destroyContainer, onConnect, onDisconnect, SESSION_EXPIRY_MS }

// ── Interactive exec via LXD WebSocket ────────────────────────────────────────
// Replaces pty.spawn('lxc', ['exec', name, '--', 'bash', '--login'])
// Returns an EventEmitter-like object with the same API as node-pty:
//   .onData(cb)   — cb(data: string)
//   .onExit(cb)   — cb({ exitCode })
//   .write(data)  — send input
//   .resize(cols, rows)
//   .kill()

const net = require('net')
const crypto = require('crypto')
const EventEmitter = require('events')

function lxdExecPty(containerName, { cols = 80, rows = 24 } = {}) {
  const emitter = new EventEmitter()
  let controlWs = null
  let ioWs = null
  let exited = false

  // POST to /1.0/instances/<name>/exec to get operation + secrets
  lxdRequest('POST', `/1.0/instances/${containerName}/exec`, {
    command: ['bash', '--login'],
    environment: { TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    'wait-for-websocket': true,
    interactive: true,
    width: cols,
    height: rows,
  }).then((res) => {
    if (!res.metadata || !res.metadata.metadata) {
      emitter.emit('exit-internal', 1)
      return
    }
    const opId   = res.operation          // e.g. /1.0/operations/<uuid>
    const fds    = res.metadata.metadata.fds  // { '0': secret, 'control': secret }
    const ioSecret  = fds['0']
    const ctlSecret = fds['control']

    const uuid = opId.replace('/1.0/operations/', '')

    // Connect the I/O websocket
    ioWs = connectLxdWs(uuid, ioSecret, (data) => {
      // data is a Buffer from the socket
      if (Buffer.isBuffer(data)) {
        emitter.emit('data', data.toString('binary'))
      }
    }, () => {
      if (!exited) { exited = true; emitter.emit('exit-internal', 0) }
    })

    // Connect the control websocket (for resize + signals)
    controlWs = connectLxdWs(uuid, ctlSecret, () => {}, () => {})

  }).catch((err) => {
    emitter.emit('error', err)
  })

  // Low-level raw socket WS connection to LXD unix socket
  function connectLxdWs(opUuid, secret, onMessage, onClose) {
    const path = `/1.0/operations/${opUuid}/websocket?secret=${secret}`
    const key  = crypto.randomBytes(16).toString('base64')
    const handshake = [
      `GET ${path} HTTP/1.1`,
      `Host: localhost`,
      `Upgrade: websocket`,
      `Connection: Upgrade`,
      `Sec-WebSocket-Key: ${key}`,
      `Sec-WebSocket-Version: 13`,
      '',
      '',
    ].join('\r\n')

    const sock = net.createConnection(LXD_SOCKET)
    let upgraded = false
    let buf = Buffer.alloc(0)

    sock.on('connect', () => sock.write(handshake))
    sock.on('data', (chunk) => {
      if (!upgraded) {
        buf = Buffer.concat([buf, chunk])
        const sep = buf.indexOf('\r\n\r\n')
        if (sep === -1) return
        upgraded = true
        buf = buf.slice(sep + 4)  // remaining bytes after headers
        if (buf.length) parseFrames(buf)
        buf = Buffer.alloc(0)
        return
      }
      parseFrames(chunk)
    })
    sock.on('close', onClose)
    sock.on('error', () => {})

    function parseFrames(data) {
      let offset = 0
      while (offset < data.length) {
        if (data.length - offset < 2) break
        const b0 = data[offset], b1 = data[offset + 1]
        const opcode = b0 & 0x0f
        const masked  = (b1 & 0x80) !== 0
        let payloadLen = b1 & 0x7f
        let headerLen = 2
        if (payloadLen === 126) { if (data.length - offset < 4) break; payloadLen = data.readUInt16BE(offset + 2); headerLen = 4 }
        else if (payloadLen === 127) { if (data.length - offset < 10) break; payloadLen = Number(data.readBigUInt64BE(offset + 2)); headerLen = 10 }
        if (masked) headerLen += 4
        if (data.length - offset < headerLen + payloadLen) break
        const payload = data.slice(offset + headerLen, offset + headerLen + payloadLen)
        offset += headerLen + payloadLen
        if (opcode === 0x8) { onClose(); return }  // close frame
        if (opcode === 0x1 || opcode === 0x2) onMessage(payload)
      }
    }

    function send(data) {
      if (!upgraded || sock.destroyed) return
      const payload = Buffer.isBuffer(data) ? data : Buffer.from(data, 'binary')
      const frame = encodeWsFrame(payload)
      sock.write(frame)
    }

    function close() { try { sock.destroy() } catch {} }

    return { send, close }
  }

  function encodeWsFrame(payload) {
    // Client frames must be masked
    const len = payload.length
    let headerLen = 2
    if (len > 65535) headerLen += 8
    else if (len > 125) headerLen += 2
    const mask = crypto.randomBytes(4)
    const header = Buffer.alloc(headerLen + 4)
    header[0] = 0x82  // FIN + binary frame
    let offset = 1
    if (len > 65535) { header[offset++] = 0x80 | 127; header.writeBigUInt64BE(BigInt(len), offset); offset += 8 }
    else if (len > 125) { header[offset++] = 0x80 | 126; header.writeUInt16BE(len, offset); offset += 2 }
    else { header[offset++] = 0x80 | len }
    mask.copy(header, offset)
    const masked = Buffer.alloc(len)
    for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4]
    return Buffer.concat([header, masked])
  }

  // Public node-pty-compatible API
  const handle = {
    onData: (cb) => { emitter.on('data', cb); return handle },
    onExit: (cb) => { emitter.on('exit-internal', (code) => cb({ exitCode: code })); return handle },
    write:  (data) => { if (ioWs) ioWs.send(data) },
    resize: (cols, rows) => {
      if (!controlWs) return
      const msg = JSON.stringify({ command: 'window-resize', args: { width: String(cols), height: String(rows) } })
      controlWs.send(msg)
    },
    kill:   () => {
      if (ioWs) ioWs.close()
      if (controlWs) controlWs.close()
    },
  }
  return handle
}

module.exports.lxdExecPty = lxdExecPty
