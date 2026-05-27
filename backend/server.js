'use strict'

const express = require('express')
const http = require('http')
const { WebSocketServer, WebSocket } = require('ws')
const path = require('path')
const fs = require('fs')
const pty = require('node-pty')
const { ensureContainer, getContainerName } = require('./lxd')

const PORT = 3001
const TUTORIALS_DIR = path.join(__dirname, 'tutorials')

// ── Express app ──────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

// Serve tutorial metadata
app.get('/api/tutorials/:id/meta', (req, res) => {
  const metaPath = path.join(TUTORIALS_DIR, req.params.id, 'meta.json')
  if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'Not found' })
  res.json(JSON.parse(fs.readFileSync(metaPath, 'utf8')))
})

// Serve a tutorial step as raw markdown
app.get('/api/tutorials/:id/step/:index', (req, res) => {
  const metaPath = path.join(TUTORIALS_DIR, req.params.id, 'meta.json')
  if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'Tutorial not found' })

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  const idx = parseInt(req.params.index, 10)
  if (isNaN(idx) || idx < 0 || idx >= meta.steps.length) {
    return res.status(404).json({ error: 'Step not found' })
  }

  const mdPath = path.join(TUTORIALS_DIR, req.params.id, meta.steps[idx].file)
  if (!fs.existsSync(mdPath)) return res.status(404).json({ error: 'Step file not found' })

  res.json({ markdown: fs.readFileSync(mdPath, 'utf8') })
})

// ── HTTP + WebSocket server ──────────────────────────────────────────────────

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws/terminal' })

wss.on('connection', (ws) => {
  const container = getContainerName()
  console.log(`[ws] New terminal session → lxc exec ${container}`)

  const shell = pty.spawn('lxc', ['exec', container, '--', 'bash', '--login'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
  })

  shell.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data)
  })

  shell.onExit(({ exitCode }) => {
    console.log(`[ws] Shell exited with code ${exitCode}`)
    if (ws.readyState === WebSocket.OPEN) ws.close()
  })

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    if (msg.type === 'input') {
      shell.write(msg.data)
    } else if (msg.type === 'resize') {
      shell.resize(Math.max(1, msg.cols), Math.max(1, msg.rows))
    }
  })

  ws.on('close', () => {
    console.log('[ws] Client disconnected')
    shell.kill()
  })
})

// ── Boot ─────────────────────────────────────────────────────────────────────

ensureContainer()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[server] Backend listening on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('[lxd] Failed to ensure container:', err.message)
    process.exit(1)
  })
