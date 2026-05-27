'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_FILE = path.join(__dirname, 'data', 'sessions.json')

function load() {
  if (!fs.existsSync(DATA_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { return {} }
}

function save(sessions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2))
}

function list() {
  return Object.values(load())
}

function get(id) {
  return load()[id] || null
}

function create({ username, tutorialId = null }) {
  const sessions = load()
  const id = crypto.randomBytes(8).toString('hex')
  const containerName = sanitizeContainerName(username)
  const now = new Date().toISOString()
  const session = {
    id, username, containerName,
    tutorialId,          // active tutorial (null until selected)
    currentStep: 0,
    progress: {},        // { [tutorialId]: { status, currentStep } }
    createdAt: now, lastActiveAt: now
  }
  sessions[id] = session
  save(sessions)
  return session
}

function update(id, patch) {
  const sessions = load()
  if (!sessions[id]) return null
  const s = sessions[id]

  // Handle progress update: { tutorialId, currentStep, status }
  if (patch.tutorialId !== undefined || patch.currentStep !== undefined) {
    const tid = patch.tutorialId ?? s.tutorialId
    const step = patch.currentStep ?? s.currentStep
    const totalSteps = patch.totalSteps    // optional, sent by frontend
    let status = 'in-progress'
    if (patch.status) {
      status = patch.status
    } else if (totalSteps !== undefined && step >= totalSteps - 1) {
      status = 'completed'
    } else if (step === 0 && !s.progress?.[tid]) {
      status = 'in-progress'
    } else {
      status = s.progress?.[tid]?.status || 'in-progress'
      if (status === 'completed') status = 'completed' // keep completed
    }

    const progress = { ...(s.progress || {}) }
    progress[tid] = { currentStep: step, status }

    sessions[id] = {
      ...s,
      tutorialId: tid,
      currentStep: step,
      progress,
      lastActiveAt: new Date().toISOString(),
    }
  } else {
    sessions[id] = { ...s, ...patch, lastActiveAt: new Date().toISOString() }
  }

  save(sessions)
  return sessions[id]
}

function sanitizeContainerName(username) {
  // LXD names: lowercase alphanumeric + hyphens, start with letter, max 63 chars
  const safe = username.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
  const name = `sc101-${safe || 'user'}`
  return name
}

module.exports = { list, get, create, update, sanitizeContainerName }
