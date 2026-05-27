'use strict'

const { execSync } = require('child_process')

// Grace period before stopping an idle container (ms)
const IDLE_STOP_DELAY = 60_000

// Track active WebSocket connections per container: containerName → count
const activeConnections = new Map()
// Pending stop timers: containerName → timeoutId
const stopTimers = new Map()

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function containerExists(name) {
  try { run(`lxc info ${name}`); return true } catch { return false }
}

function containerRunning(name) {
  try {
    const out = run(`lxc list ${name} --format csv -c s`)
    return out.trim() === 'RUNNING'
  } catch { return false }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureContainerForUser(containerName) {
  if (!containerExists(containerName)) {
    console.log(`[lxd] Creating container ${containerName}…`)
    run(`lxc launch ubuntu:24.04 ${containerName}`)
    await sleep(3000)
    console.log(`[lxd] Container ${containerName} created.`)
  } else if (!containerRunning(containerName)) {
    console.log(`[lxd] Starting container ${containerName}…`)
    run(`lxc start ${containerName}`)
    await sleep(2000)
  } else {
    console.log(`[lxd] Container ${containerName} already running.`)
  }
}

function stopContainer(name) {
  if (containerRunning(name)) {
    console.log(`[lxd] Stopping idle container ${name}…`)
    try { run(`lxc stop --force ${name}`) } catch (e) { console.error(`[lxd] Stop failed: ${e.message}`) }
  }
}

function destroyContainer(name) {
  if (!containerExists(name)) return
  console.log(`[lxd] Destroying container ${name}…`)
  try {
    if (containerRunning(name)) run(`lxc stop --force ${name}`)
    run(`lxc delete ${name}`)
    console.log(`[lxd] Container ${name} destroyed.`)
  } catch (e) {
    console.error(`[lxd] Destroy failed: ${e.message}`)
  }
}

// Stop all sc101-* containers — called once at startup so we start clean
function stopAllContainers() {
  try {
    const out = run(`lxc list --format csv -c n,s`)
    for (const line of out.split('\n')) {
      const [name, state] = line.split(',')
      if (name && name.startsWith('sc101-') && state && state.trim() === 'RUNNING') {
        console.log(`[lxd] Stopping container ${name} on startup…`)
        try { run(`lxc stop --force ${name}`) } catch {}
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

module.exports = { ensureContainerForUser, stopAllContainers, destroyContainer, onConnect, onDisconnect }
