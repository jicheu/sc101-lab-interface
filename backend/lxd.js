'use strict'

const { spawnSync } = require('child_process')

// Grace period before stopping an idle container (ms)
const IDLE_STOP_DELAY = 5 * 60_000   // 5 minutes

// Sessions inactive longer than this are expired and their containers destroyed
const SESSION_EXPIRY_MS = 2 * 60 * 60_000  // 2 hours

// Track active WebSocket connections per container: containerName → count
const activeConnections = new Map()
// Pending stop timers: containerName → timeoutId
const stopTimers = new Map()

function run(args) {
  const result = spawnSync('lxc', args, { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const err = new Error((result.stderr || result.stdout || `lxc ${args.join(' ')} failed`).trim())
    err.status = result.status
    throw err
  }
  return result.stdout.trim()
}

function containerRunning(name) {
  // lxc list/info/query all return empty stdout from node (snap pipe/TTY bug).
  // lxc exec -- true: exit 0 = running, non-0 = stopped or non-existent.
  const r = spawnSync('lxc', ['exec', name, '--', 'true'], { encoding: 'utf8' })
  return r.status === 0
}

function containerExists(name) {
  // If running, it exists.
  if (containerRunning(name)) return true
  // Try to start it — exit 0 means it existed but was stopped.
  // Any failure means it doesn't exist (or some other error, treated as non-existent).
  const s = spawnSync('lxc', ['start', name], { encoding: 'utf8' })
  if (s.status === 0) {
    // Existed and we just started it — stop it so ensureContainerForUser controls the lifecycle
    spawnSync('lxc', ['stop', '--force', name], { encoding: 'utf8' })
    return true
  }
  return false
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// In-flight start promises: prevent concurrent starts for the same container
const startingContainers = new Map()

async function ensureContainerForUser(containerName) {
  // If already being started by another concurrent WS connection, wait for it
  if (startingContainers.has(containerName)) {
    await startingContainers.get(containerName)
    return
  }

  if (containerRunning(containerName)) {
    console.log(`[lxd] Container ${containerName} already running.`)
    return
  }

  const startPromise = (async () => {
    // Try lxc start first — succeeds if container exists but is stopped.
    // If it fails, assume the container doesn't exist yet and launch it.
    console.log(`[lxd] Starting container ${containerName}…`)
    const startR = spawnSync('lxc', ['start', containerName], { encoding: 'utf8' })
    if (startR.status !== 0) {
      // Container doesn't exist — create and start in one step
      console.log(`[lxd] Container ${containerName} not found, launching…`)
      run(['launch', 'ubuntu:24.04', containerName])
      await sleep(4000)
      console.log(`[lxd] Container ${containerName} created.`)
    } else {
      await sleep(2000)
    }
    // Final check
    if (!containerRunning(containerName)) {
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

function stopContainer(name) {
  if (containerRunning(name)) {
    console.log(`[lxd] Stopping idle container ${name}…`)
    try { run(['stop', '--force', name]) } catch (e) { console.error(`[lxd] Stop failed: ${e.message}`) }
  }
}

function destroyContainer(name) {
  if (!containerExists(name)) return
  console.log(`[lxd] Destroying container ${name}…`)
  try {
    if (containerRunning(name)) run(['stop', '--force', name])
    run(['delete', name])
    console.log(`[lxd] Container ${name} destroyed.`)
  } catch (e) {
    console.error(`[lxd] Destroy failed: ${e.message}`)
  }
}

// Stop all sc101-* containers — called once at startup so we start clean
function stopAllContainers() {
  try {
    const out = run(['list', '--format', 'csv', '-c', 'n,s'])
    for (const line of out.split('\n')) {
      const [name, state] = line.split(',')
      if (name && name.startsWith('sc101-') && state && state.trim() === 'RUNNING') {
        console.log(`[lxd] Stopping container ${name} on startup…`)
        try { run(['stop', '--force', name]) } catch {}
      }
    }
  } catch {}
}

// Called when a WebSocket connects to a container
function onConnect(containerName) {
  // Cancel any pending idle stop
  if (stopTimers.has(containerName)) {
    clearTimeout(stopTimers.get(containerName))
    stopTimers.delete(containerName)
  }
  activeConnections.set(containerName, (activeConnections.get(containerName) || 0) + 1)
}

// Called when a WebSocket disconnects from a container
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
