'use strict'

const express = require('express')
const http = require('http')
const { WebSocketServer, WebSocket } = require('ws')
const path = require('path')
const fs = require('fs')
const pty = require('node-pty')
const { exec } = require('child_process')
const { ensureContainerForUser, stopAllContainers, onConnect, onDisconnect } = require('./lxd')
const sessions = require('./sessions')

const PORT = 3001
const TUTORIALS_DIR = path.join(__dirname, 'tutorials')

// ── Express app ──────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

// ── Session API ───────────────────────────────────────────────────────────────

app.get('/api/sessions', (_req, res) => {
  res.json(sessions.list())
})

app.get('/api/sessions/:id', (req, res) => {
  const s = sessions.get(req.params.id)
  if (!s) return res.status(404).json({ error: 'Session not found' })
  res.json(s)
})

app.post('/api/sessions', (req, res) => {
  try {
    const { username, tutorialId } = req.body || {}
    if (!username || !username.trim()) return res.status(400).json({ error: 'username required' })
    const session = sessions.create({ username: username.trim(), tutorialId })
    res.status(201).json(session)
  } catch (err) {
    console.error('[api] POST /api/sessions error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

app.patch('/api/sessions/:id', (req, res) => {
  const { currentStep } = req.body || {}
  const s = sessions.update(req.params.id, { currentStep })
  if (!s) return res.status(404).json({ error: 'Session not found' })
  res.json(s)
})

// ── Tutorial API ──────────────────────────────────────────────────────────────

app.get('/api/tutorials/:id/meta', (req, res) => {
  const metaPath = path.join(TUTORIALS_DIR, req.params.id, 'meta.json')
  if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'Not found' })
  res.json(JSON.parse(fs.readFileSync(metaPath, 'utf8')))
})

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

// ── LXC image export ─────────────────────────────────────────────────────────

app.get('/api/sessions/:id/export', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const { containerName } = session
  const tmpFile = `/tmp/${containerName}-${Date.now()}.tar.gz`
  const filename = `${containerName}.tar.gz`

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Type', 'application/gzip')
  // Inform the client that this may take a while
  res.setHeader('X-Content-Type-Options', 'nosniff')

  exec(`lxc export ${containerName} ${tmpFile}`, { timeout: 600_000 }, (err) => {
    if (err) {
      try { fs.unlinkSync(tmpFile) } catch {}
      if (!res.headersSent) return res.status(500).json({ error: err.message })
      return res.end()
    }
    const stat = fs.statSync(tmpFile)
    res.setHeader('Content-Length', stat.size)
    const stream = fs.createReadStream(tmpFile)
    stream.pipe(res)
    stream.on('close', () => { try { fs.unlinkSync(tmpFile) } catch {} })
    stream.on('error', () => { try { fs.unlinkSync(tmpFile) } catch {} })
  })
})



const server = http.createServer(app)

// Path: /ws/terminal/:sessionId  — we parse sessionId from the URL
const wss = new WebSocketServer({ server, path: '/ws/terminal' })

wss.on('connection', async (ws, req) => {
  // Extract sessionId from URL query param: /ws/terminal?session=<id>
  const url = new URL(req.url, `http://localhost`)
  const sessionId = url.searchParams.get('session')

  const session = sessionId ? sessions.get(sessionId) : null
  if (!session) {
    ws.close(4001, 'Invalid or missing session')
    return
  }

  const { containerName } = session
  console.log(`[ws] ${session.username} → container ${containerName}`)

  // Ensure the container is running
  try {
    await ensureContainerForUser(containerName)
  } catch (err) {
    console.error(`[ws] Failed to start container: ${err.message}`)
    ws.close(4002, 'Container failed to start')
    return
  }

  onConnect(containerName)

  const shell = pty.spawn('lxc', ['exec', containerName, '--', 'bash', '--login'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
  })

  shell.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data)
  })

  shell.onExit(({ exitCode }) => {
    console.log(`[ws] Shell for ${session.username} exited (${exitCode})`)
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
    console.log(`[ws] ${session.username} disconnected`)
    shell.kill()
    onDisconnect(containerName)
  })
})

// ── Boot ─────────────────────────────────────────────────────────────────────

console.log('[lxd] Stopping all sc101 containers on startup…')
stopAllContainers()

server.listen(PORT, () => {
  console.log(`[server] Backend listening on http://localhost:${PORT}`)
})
