'use strict'

const { execSync, exec } = require('child_process')

const CONTAINER_NAME = 'sc101-dev'
const CONTAINER_IMAGE = 'ubuntu:24.04'

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function containerExists() {
  try {
    run(`lxc info ${CONTAINER_NAME}`)
    return true
  } catch {
    return false
  }
}

function containerRunning() {
  try {
    const out = run(`lxc list ${CONTAINER_NAME} --format csv -c s`)
    return out.trim() === 'RUNNING'
  } catch {
    return false
  }
}

async function ensureContainer() {
  if (!containerExists()) {
    console.log(`[lxd] Creating container ${CONTAINER_NAME} from ${CONTAINER_IMAGE}…`)
    run(`lxc launch ${CONTAINER_IMAGE} ${CONTAINER_NAME}`)
    // Give the container a moment to boot
    await sleep(3000)
    console.log(`[lxd] Container created.`)
  } else if (!containerRunning()) {
    console.log(`[lxd] Starting container ${CONTAINER_NAME}…`)
    run(`lxc start ${CONTAINER_NAME}`)
    await sleep(2000)
  } else {
    console.log(`[lxd] Container ${CONTAINER_NAME} already running.`)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getContainerName() {
  return CONTAINER_NAME
}

module.exports = { ensureContainer, getContainerName }
