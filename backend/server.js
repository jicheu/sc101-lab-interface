'use strict'

const express = require('express')
const http = require('http')
const { WebSocketServer, WebSocket } = require('ws')
const path = require('path')
const fs = require('fs')
const pty = require('node-pty')
const { execFile } = require('child_process')
const { ensureContainerForUser, stopAllContainers, destroyContainer, onConnect, onDisconnect, SESSION_EXPIRY_MS } = require('./lxd')
const sessions = require('./sessions')

const matter = require('gray-matter')

const PORT = 3001
// Tutorials live in the top-level tutorials/ folder so contributors can
// add new ones without touching the backend source.
const TUTORIALS_DIR = path.join(__dirname, '..', 'tutorials')

// Parse a tutorial's index.md and return { id, title, description,
// difficulty, time, tags, environment, steps, body, course }
function courseDisplayName(dirName) {
  return dirName.replace(/_/g, ' ')
}

function tutorialUid(courseDir, tutorialDir) {
  return `${courseDir}/${tutorialDir}`
}

function safeResolve(baseDir, ...parts) {
  const base = path.resolve(baseDir)
  const resolved = path.resolve(base, ...parts)
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) return null
  return resolved
}

function loadTutorialMeta(courseDir, tutorialId) {
  const indexPath = path.join(TUTORIALS_DIR, courseDir, tutorialId, 'index.md')
  if (!fs.existsSync(indexPath)) return null
  try {
    const { data, content } = matter(fs.readFileSync(indexPath, 'utf8'))
    return { 
      ...data, 
      id: data.id || tutorialId,
      tutorialId: data.id || tutorialId,
      folderId: tutorialId,
      uid: tutorialUid(courseDir, tutorialId),
      courseId: courseDir,
      course: courseDisplayName(courseDir),
      body: content.trim() 
    }
  } catch (e) {
    console.error(`[tutorials] Failed to load ${courseDir}/${tutorialId}: ${e.message}`)
    return null
  }
}

// Find a tutorial by UID ("courseDir/tutorialDir") or by legacy tutorial ID.
function findTutorial(tutorialRef) {
  if (!fs.existsSync(TUTORIALS_DIR)) return null
  try {
    if (tutorialRef?.includes('/')) {
      const [courseDir, tutorialDir, ...extra] = tutorialRef.split('/')
      if (!courseDir || !tutorialDir || extra.length) return null
      const tutPath = safeResolve(TUTORIALS_DIR, courseDir, tutorialDir)
      if (!tutPath || !fs.existsSync(tutPath) || !fs.statSync(tutPath).isDirectory()) return null
      const meta = loadTutorialMeta(courseDir, tutorialDir)
      return meta ? { courseDir, tutorialDir, meta } : null
    }

    const courses = fs.readdirSync(TUTORIALS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const course of courses) {
      const courseFullPath = path.join(TUTORIALS_DIR, course.name)
      const tutorials = fs.readdirSync(courseFullPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
      for (const tut of tutorials) {
        const meta = loadTutorialMeta(course.name, tut.name)
        if (meta && (tut.name === tutorialRef || meta.id === tutorialRef)) {
          return { courseDir: course.name, tutorialDir: tut.name, meta }
        }
      }
    }
  } catch (e) {
    console.error(`[tutorials] findTutorial(${tutorialRef}) error: ${e.message}`)
  }
  return null
}

// List all tutorials from all courses that have a valid index.md
function listTutorials() {
  if (!fs.existsSync(TUTORIALS_DIR)) return []
  const results = []
  try {
    const courses = fs.readdirSync(TUTORIALS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const course of courses) {
      const courseFullPath = path.join(TUTORIALS_DIR, course.name)
      try {
        const tutorials = fs.readdirSync(courseFullPath, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .sort((a, b) => a.name.localeCompare(b.name))
        for (const tut of tutorials) {
          try {
            const meta = loadTutorialMeta(course.name, tut.name)
            if (meta) {
              const { body: _body, ...rest } = meta // omit body from list
              results.push(rest)
            }
          } catch (e) {
            console.error(`[tutorials] Skipping ${course.name}/${tut.name}: ${e.message}`)
          }
        }
      } catch (e) {
        console.error(`[tutorials] Skipping course ${course.name}: ${e.message}`)
      }
    }
  } catch (e) {
    console.error(`[tutorials] listTutorials error: ${e.message}`)
  }
  return results
}

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
  const { currentStep, tutorialId, totalSteps, status } = req.body || {}
  const s = sessions.update(req.params.id, { currentStep, tutorialId, totalSteps, status })
  if (!s) return res.status(404).json({ error: 'Session not found' })
  res.json(s)
})

app.delete('/api/sessions/:id', (req, res) => {
  const s = sessions.get(req.params.id)
  if (!s) return res.status(404).json({ error: 'Session not found' })
  sessions.remove(req.params.id)
  // Destroy the LXD container (non-blocking — don't fail the response if lxd is unavailable)
  try { destroyContainer(s.containerName) } catch (e) {
    console.error(`[api] DELETE session — container destroy failed: ${e.message}`)
  }
  res.json({ ok: true })
})

// ── Tutorial API ──────────────────────────────────────────────────────────────

// Setup prerequisites check
app.get('/api/setup/check', (_req, res) => {
  const { spawnSync: sp } = require('child_process')
  function check(cmd, args) {
    try {
      const r = sp(cmd, args, { encoding: 'utf8' })
      if (r.error || r.status !== 0) return null
      return (r.stdout || '').trim().split('\n')[0] || 'ok'
    } catch { return null }
  }

  const lxdVersion   = check('lxc', ['version'])
  const lxdInitDone  = check('lxc', ['network', 'list', '--format', 'csv'])
  const snapcraftVer = check('snapcraft', ['--version'])
  const nodeVer      = check('node', ['--version'])
  const npmVer       = check('npm', ['--version'])

  res.json({
    checks: [
      {
        id: 'lxd',
        label: 'LXD installed',
        ok: !!lxdVersion,
        version: lxdVersion,
        fix: 'sudo snap install lxd',
        docs: 'https://documentation.ubuntu.com/lxd/en/latest/installing/',
      },
      {
        id: 'lxd-init',
        label: 'LXD initialised (network + storage pool)',
        ok: lxdInitDone !== null,
        fix: 'lxd init --auto',
        docs: 'https://documentation.ubuntu.com/lxd/en/latest/getting_started/',
      },
      {
        id: 'snapcraft',
        label: 'Snapcraft installed',
        ok: !!snapcraftVer,
        version: snapcraftVer,
        fix: 'sudo snap install snapcraft --classic',
        docs: 'https://snapcraft.io/docs/snapcraft-overview',
      },
      {
        id: 'node',
        label: 'Node.js 18+ installed',
        ok: !!nodeVer,
        version: nodeVer,
        fix: 'sudo snap install node --classic --channel 20',
        docs: 'https://nodejs.org/',
      },
      {
        id: 'npm',
        label: 'npm installed',
        ok: !!npmVer,
        version: npmVer,
        fix: null,   // bundled with node
        docs: null,
      },
    ],
  })
})

// List all available tutorials
app.get('/api/tutorials', (_req, res) => {
  try {
    res.json(listTutorials())
  } catch (e) {
    console.error('[api] GET /api/tutorials error:', e)
    res.status(500).json({ error: 'Failed to load tutorials' })
  }
})

// Get metadata for a single tutorial (includes environment spec and steps list)
app.get('/api/tutorials/:id/meta', (req, res) => {
  const found = findTutorial(req.params.id)
  if (!found) return res.status(404).json({ error: 'Tutorial not found' })
  res.json(found.meta)
})

// Validate a tutorial — checks frontmatter, required fields, step files
app.get('/api/tutorials/:id/validate', (req, res) => {
  const errors = []
  const found = findTutorial(req.params.id)

  if (!found) return res.status(404).json({ valid: false, errors: [{ file: 'index.md', message: 'Tutorial folder not found' }] })

  const dir = path.join(TUTORIALS_DIR, found.courseDir, found.tutorialDir)
  const indexPath = path.join(dir, 'index.md')
  if (!fs.existsSync(indexPath)) {
    return res.json({ valid: false, errors: [{ file: 'index.md', message: 'index.md is missing' }] })
  }

  let meta
  try {
    const { data } = matter(fs.readFileSync(indexPath, 'utf8'))
    meta = data
  } catch (e) {
    return res.json({ valid: false, errors: [{ file: 'index.md', message: `YAML parse error: ${e.message}` }] })
  }

  for (const field of ['id', 'title', 'steps']) {
    if (!meta[field]) errors.push({ file: 'index.md', message: `Missing required field: "${field}"` })
  }

  if (!Array.isArray(meta.steps)) {
    errors.push({ file: 'index.md', message: '"steps" must be a list' })
  } else {
    meta.steps.forEach((step, i) => {
      if (!step.file) { errors.push({ file: 'index.md', message: `Step ${i + 1} is missing "file"` }); return }
      if (!step.title) errors.push({ file: step.file, message: 'Missing "title" in step entry' })
      const stepPath = safeResolve(dir, step.file)
      if (!stepPath) {
        errors.push({ file: step.file, message: 'Step file must stay inside the tutorial folder' })
        return
      }
      if (!fs.existsSync(stepPath)) {
        errors.push({ file: step.file, message: 'File not found' })
        return
      }
      try {
        const { data: sd } = matter(fs.readFileSync(stepPath, 'utf8'))
        if (!sd.title) errors.push({ file: step.file, message: 'Missing "title" in frontmatter' })
      } catch (e) {
        errors.push({ file: step.file, message: `YAML parse error: ${e.message}` })
      }
    })
  }

  res.json({ valid: errors.length === 0, errors })
})

// Get a single step's markdown (strips frontmatter before sending)
app.get('/api/tutorials/:id/step/:index', (req, res) => {
  const found = findTutorial(req.params.id)
  if (!found) return res.status(404).json({ error: 'Tutorial not found' })
  const meta = found.meta

  const idx = parseInt(req.params.index, 10)
  if (isNaN(idx) || idx < 0 || idx >= meta.steps.length) {
    return res.status(404).json({ error: 'Step not found' })
  }

  const stepFile = meta.steps[idx].file
  const tutorialDir = path.join(TUTORIALS_DIR, found.courseDir, found.tutorialDir)
  const mdPath = safeResolve(tutorialDir, stepFile)
  if (!mdPath) return res.status(400).json({ error: 'Step file must stay inside the tutorial folder' })
  if (!fs.existsSync(mdPath)) return res.status(404).json({ error: 'Step file not found' })

  try {
    // Strip frontmatter — only send the body to the frontend
    const { content } = matter(fs.readFileSync(mdPath, 'utf8'))
    res.json({ markdown: content.trim() })
  } catch (e) {
    res.status(500).json({ error: `Failed to read step: ${e.message}` })
  }
})

// ── LXC image export ─────────────────────────────────────────────────────────

app.get('/api/sessions/:id/export', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const { containerName } = session
  if (!/^sc101-[a-z0-9-]+$/.test(containerName)) {
    return res.status(400).json({ error: 'Invalid container name' })
  }
  const tmpFile = `/tmp/${containerName}-${Date.now()}.tar.gz`
  const filename = `${containerName}.tar.gz`

  // --instance-only: skip images, works on running containers
  execFile('lxc', ['export', containerName, tmpFile, '--instance-only'], { timeout: 600_000 }, (err) => {
    if (err) {
      try { fs.unlinkSync(tmpFile) } catch {}
      return res.status(500).json({ error: err.message || 'lxc export failed' })
    }
    let stat
    try { stat = fs.statSync(tmpFile) } catch (e) {
      return res.status(500).json({ error: 'Export file not found after export' })
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/gzip')
    res.setHeader('Content-Length', stat.size)
    const stream = fs.createReadStream(tmpFile)
    stream.pipe(res)
    stream.on('close', () => { try { fs.unlinkSync(tmpFile) } catch {} })
    stream.on('error', (e) => {
      console.error('[export] stream error:', e)
      try { fs.unlinkSync(tmpFile) } catch {}
      if (!res.headersSent) res.status(500).end()
    })
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

// Periodic session expiry: every 15 minutes, destroy containers and remove
// sessions that have been inactive for longer than SESSION_EXPIRY_MS (2 hours).
function runSessionExpiry() {
  const now = Date.now()
  const expired = sessions.list().filter((s) => {
    const idle = now - new Date(s.lastActiveAt).getTime()
    return idle > SESSION_EXPIRY_MS
  })
  for (const s of expired) {
    console.log(`[expiry] Session ${s.id} (${s.username}) inactive >2h — cleaning up…`)
    try { destroyContainer(s.containerName) } catch (e) { console.error(`[expiry] Container destroy failed: ${e.message}`) }
    sessions.remove(s.id)
    console.log(`[expiry] Session ${s.id} removed.`)
  }
}

const EXPIRY_CHECK_INTERVAL = 15 * 60_000  // every 15 minutes
setInterval(runSessionExpiry, EXPIRY_CHECK_INTERVAL).unref()

server.listen(PORT, () => {
  console.log(`[server] Backend listening on http://localhost:${PORT}`)
})
