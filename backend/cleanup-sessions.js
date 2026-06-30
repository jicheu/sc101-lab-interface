#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const dataFile = path.join(__dirname, 'data', 'sessions.json')

function deduplicateParticipants(session) {
  if (!session.participants || session.participants.length === 0) return session
  
  const seen = new Map()
  for (const p of session.participants) {
    const existing = seen.get(p.username)
    if (!existing || new Date(p.joinedAt) > new Date(existing.joinedAt)) {
      seen.set(p.username, p)
    }
  }
  
  return {
    ...session,
    participants: Array.from(seen.values())
  }
}

if (!fs.existsSync(dataFile)) {
  console.log('No sessions.json file found')
  process.exit(0)
}

const sessions = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
let cleaned = 0

for (const id in sessions) {
  // Initialize participants array if missing
  if (!sessions[id].participants) {
    sessions[id].participants = []
  }
  
  // Set owner if missing (for backwards compatibility)
  if (!sessions[id].owner && sessions[id].username) {
    sessions[id].owner = {
      username: sessions[id].username,
      role: 'student',
      connectedAt: sessions[id].createdAt || new Date().toISOString()
    }
    console.log(`Set owner for session ${id}: ${sessions[id].username}`)
    cleaned++
  }
  
  const before = sessions[id].participants.length
  sessions[id] = deduplicateParticipants(sessions[id])
  const after = sessions[id].participants.length
  if (before !== after) {
    console.log(`Cleaned session ${id}: ${before} -> ${after} participants`)
    cleaned++
  }
}

fs.writeFileSync(dataFile, JSON.stringify(sessions, null, 2))
console.log(`\nCleaned ${cleaned} session(s) with duplicates`)
