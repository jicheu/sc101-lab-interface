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

// ── KillerCoda format converter ───────────────────────────────────────────────
// Converts a KillerCoda tutorial folder (index.json + intro.md + stepN.md + finish.md)
// into SC101 format (index.md with YAML frontmatter + individual step files).
function convertKillercodaTutorial(srcDir, destDir, courseName) {
  const idxPath = path.join(srcDir, 'index.json')
  if (!fs.existsSync(idxPath)) return { ok: false, error: 'No index.json found' }

  let kc
  try { kc = JSON.parse(fs.readFileSync(idxPath, 'utf8')) } catch (e) {
    return { ok: false, error: `Failed to parse index.json: ${e.message}` }
  }

  const title       = kc.title || path.basename(srcDir)
  const description = kc.description || ''
  const details     = kc.details || {}
  const kcSteps     = details.steps || []
  const intro       = details.intro
  const finish      = details.finish

  // Build ordered step list: intro first, then numbered steps, then finish
  const stepFiles = []
  if (intro?.text && fs.existsSync(path.join(srcDir, intro.text))) {
    stepFiles.push({ file: intro.text, title: 'Introduction' })
  }
  for (const s of kcSteps) {
    if (s.text && fs.existsSync(path.join(srcDir, s.text))) {
      stepFiles.push({ file: s.text, title: s.title || s.text })
    }
  }
  if (finish?.text && fs.existsSync(path.join(srcDir, finish.text))) {
    stepFiles.push({ file: finish.text, title: 'Finish' })
  }

  if (stepFiles.length === 0) return { ok: false, error: 'No step files found' }

  // Derive a safe tutorial id from the folder name
  const folderId = path.basename(srcDir).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  // Build YAML frontmatter
  const stepsYaml = stepFiles.map((s) => `  - file: ${s.file}\n    title: "${s.title.replace(/"/g, "'")}"`).join('\n')
  const indexMd = `---
id: ${folderId}
title: "${title.replace(/"/g, "'")}"
description: >
  ${description.replace(/\n/g, '\n  ')}
difficulty: beginner
time: 30
section: "Imported"
tags: [imported, killercoda]

steps:
${stepsYaml}
---

${description}

> _Imported from KillerCoda format._
`

  // Copy files to destDir
  try { fs.mkdirSync(destDir, { recursive: true }) } catch (e) {
    return { ok: false, error: `Cannot create tutorial dir: ${e.message}` }
  }

  fs.writeFileSync(path.join(destDir, 'index.md'), indexMd, 'utf8')

  // Copy all .md files, converting {{execute}} → fenced run blocks
  for (const entry of fs.readdirSync(srcDir)) {
    if (!entry.endsWith('.md')) continue
    const src = fs.readFileSync(path.join(srcDir, entry), 'utf8')
    const converted = convertKillercodaMarkdown(src)
    fs.writeFileSync(path.join(destDir, entry), converted, 'utf8')
  }

  // Copy any other non-.json, non-.git, non-.sh files (assets etc.)
  for (const entry of fs.readdirSync(srcDir)) {
    if (entry.endsWith('.md') || entry.endsWith('.json') || entry.endsWith('.sh') || entry === '.git') continue
    const srcPath = path.join(srcDir, entry)
    const dstPath = path.join(destDir, entry)
    try {
      if (fs.statSync(srcPath).isFile()) fs.copyFileSync(srcPath, dstPath)
    } catch {}
  }

  return { ok: true, folderId, title, stepCount: stepFiles.length }
}

// Convert KillerCoda Markdown syntax to SC101 format:
//   `command`{{execute}}  →  ```bash run\ncommand\n```
//   `command`{{copy}}     →  ```bash\ncommand\n```
function convertKillercodaMarkdown(src) {
  // Inline backtick with {{execute}} — most common pattern
  let out = src.replace(/`([^`]+)`\{\{execute\}\}/g, (_, cmd) => `\`\`\`bash run\n${cmd}\n\`\`\``)
  // Inline backtick with {{copy}}
  out = out.replace(/`([^`]+)`\{\{copy\}\}/g, (_, cmd) => `\`\`\`bash\n${cmd}\n\`\`\``)
  // Fenced block with {{execute}} on same or next line
  out = out.replace(/```(\w*)\s*\{\{execute\}\}/g, '```$1 run')
  out = out.replace(/```(\w*)\s*\n\{\{execute\}\}/g, '```$1 run\n')
  // Strip remaining {{...}} markers
  out = out.replace(/\{\{[^}]+\}\}/g, '')
  return out
}

// Detect whether a cloned repo is KillerCoda format:
// A "multi-tutorial repo" has subdirectories each with index.json.
// A single-tutorial repo has index.json at the root.
// Returns: { type: 'sc101'|'killercoda-single'|'killercoda-multi'|'unknown', subDirs }
function detectRepoFormat(repoDir) {
  const hasIndexMd   = fs.existsSync(path.join(repoDir, 'index.md'))
  const hasIndexJson = fs.existsSync(path.join(repoDir, 'index.json'))

  if (hasIndexMd) return { type: 'sc101', subDirs: [] }
  if (hasIndexJson) return { type: 'killercoda-single', subDirs: [] }

  // Check for multi-tutorial repo: subdirs that each contain index.json
  const subDirs = fs.readdirSync(repoDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .filter((d) => fs.existsSync(path.join(repoDir, d.name, 'index.json')))
    .map((d) => d.name)

  if (subDirs.length > 0) return { type: 'killercoda-multi', subDirs }
  return { type: 'unknown', subDirs: [] }
}

// ── Import a tutorial from a GitHub URL ──────────────────────────────────────
app.post('/api/tutorials/import', (req, res) => {
  const { url, course } = req.body || {}
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url is required' })

  const ghMatch = url.trim().match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/)
  if (!ghMatch) return res.status(400).json({ error: 'Only GitHub repository URLs are supported (https://github.com/owner/repo)' })

  const repoSlug   = ghMatch[1]
  const repoName   = repoSlug.split('/')[1]
  const courseName = (typeof course === 'string' && course.trim())
    ? course.trim().replace(/\s+/g, '_')
    : 'Imported_Tutorials'

  const courseDir = safeResolve(TUTORIALS_DIR, courseName)
  if (!courseDir) return res.status(400).json({ error: 'Invalid course name' })

  try { fs.mkdirSync(courseDir, { recursive: true }) } catch (e) {
    return res.status(500).json({ error: `Failed to create course directory: ${e.message}` })
  }

  // Clone to a temp directory first so we can inspect before committing
  const { spawnSync: sp } = require('child_process')
  const tmpCloneDir = path.join(courseDir, `.tmp_import_${Date.now()}`)

  const cloneResult = sp('git', ['clone', '--depth', '1', '--', url.trim(), tmpCloneDir], {
    encoding: 'utf8', timeout: 60_000,
  })
  if (cloneResult.error || cloneResult.status !== 0) {
    try { fs.rmSync(tmpCloneDir, { recursive: true, force: true }) } catch {}
    const msg = (cloneResult.stderr || cloneResult.error?.message || 'git clone failed').trim()
    return res.status(422).json({ error: `Clone failed: ${msg}` })
  }
  try { fs.rmSync(path.join(tmpCloneDir, '.git'), { recursive: true, force: true }) } catch {}

  // Detect format
  const { type, subDirs } = detectRepoFormat(tmpCloneDir)
  const imported = []
  const allErrors = []
  const allWarnings = []

  if (type === 'sc101') {
    // Direct SC101 tutorial — validate and move into place
    const tutorialDir = safeResolve(courseDir, repoName)
    if (!tutorialDir) { allErrors.push('Invalid tutorial directory name'); }
    else if (fs.existsSync(tutorialDir)) {
      allErrors.push(`Tutorial "${repoName}" already exists in course "${courseName}". Delete it first.`)
    } else {
      const { errors, warnings } = validateSc101Tutorial(tmpCloneDir)
      if (errors.length > 0) {
        allErrors.push(...errors)
      } else {
        fs.renameSync(tmpCloneDir, tutorialDir)
        const meta = loadTutorialMeta(courseName, repoName)
        imported.push({ tutorial: repoName, uid: tutorialUid(courseName, repoName), meta })
        allWarnings.push(...warnings)
      }
    }
  } else if (type === 'killercoda-single') {
    // Single KillerCoda tutorial at repo root
    const tutorialDir = safeResolve(courseDir, repoName)
    if (!tutorialDir) { allErrors.push('Invalid tutorial directory name') }
    else if (fs.existsSync(tutorialDir)) {
      allErrors.push(`Tutorial "${repoName}" already exists. Delete it first.`)
    } else {
      const result = convertKillercodaTutorial(tmpCloneDir, tutorialDir, courseName)
      if (!result.ok) allErrors.push(result.error)
      else {
        const meta = loadTutorialMeta(courseName, repoName)
        imported.push({ tutorial: repoName, uid: tutorialUid(courseName, repoName), meta })
        allWarnings.push(`Converted from KillerCoda format (${result.stepCount} steps)`)
      }
    }
  } else if (type === 'killercoda-multi') {
    // Multi-tutorial KillerCoda repo: import each subdirectory as a separate tutorial
    for (const subDir of subDirs) {
      const tutorialDir = safeResolve(courseDir, subDir)
      if (!tutorialDir) { allWarnings.push(`Skipped "${subDir}": invalid name`); continue }
      if (fs.existsSync(tutorialDir)) {
        allWarnings.push(`Skipped "${subDir}": already exists in course "${courseName}"`)
        continue
      }
      const result = convertKillercodaTutorial(path.join(tmpCloneDir, subDir), tutorialDir, courseName)
      if (!result.ok) {
        allWarnings.push(`Skipped "${subDir}": ${result.error}`)
      } else {
        const meta = loadTutorialMeta(courseName, subDir)
        imported.push({ tutorial: subDir, uid: tutorialUid(courseName, subDir), meta })
        allWarnings.push(`"${subDir}" converted from KillerCoda format (${result.stepCount} steps)`)
      }
    }
    if (imported.length === 0 && allErrors.length === 0) {
      allErrors.push('No tutorials could be imported from this repository.')
    }
  } else {
    allErrors.push('Could not detect tutorial format. Expected either SC101 (index.md) or KillerCoda (index.json) format.')
  }

  // Clean up temp clone
  try { fs.rmSync(tmpCloneDir, { recursive: true, force: true }) } catch {}

  if (allErrors.length > 0 && imported.length === 0) {
    return res.status(422).json({ error: allErrors[0], errors: allErrors, warnings: allWarnings })
  }

  console.log(`[import] Imported ${imported.length} tutorial(s) from ${url} into course "${courseName}"`)
  res.json({
    ok: true,
    format: type,
    course: courseName,
    imported,
    warnings: allWarnings,
    errors: allErrors.length > 0 ? allErrors : undefined,
  })
})

function toTitleCase(str) {
  return str.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function autoDiscoverSteps(dir) {
  // Collect intro.md, stepN.md (sorted), finish.md — common KillerCoda/SC101 naming
  const candidates = ['intro.md']
  const stepFiles = fs.readdirSync(dir)
    .filter((f) => /^step\d+\.md$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0]), nb = parseInt(b.match(/\d+/)[0])
      return na - nb
    })
  candidates.push(...stepFiles)
  if (fs.existsSync(path.join(dir, 'finish.md'))) candidates.push('finish.md')
  return candidates
    .filter((f) => fs.existsSync(path.join(dir, f)))
    .map((f) => ({ file: f, title: toTitleCase(f.replace(/\.md$/, '')) }))
}

function validateSc101Tutorial(dir) {
  const errors = []
  const warnings = []
  const folderName = path.basename(dir)
  const indexPath = path.join(dir, 'index.md')

  if (!fs.existsSync(indexPath)) {
    errors.push('Missing index.md — every tutorial must have an index.md with YAML frontmatter (id, title, description, steps).')
    return { errors, warnings }
  }

  try {
    const raw = fs.readFileSync(indexPath, 'utf8')
    const { data, content } = matter(raw)
    let patched = false

    // Auto-fill missing id
    if (!data.id) {
      data.id = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      warnings.push(`Missing "id" in frontmatter — auto-filled as "${data.id}"`)
      patched = true
    }

    // Auto-fill missing title
    if (!data.title) {
      data.title = toTitleCase(folderName)
      warnings.push(`Missing "title" in frontmatter — auto-filled as "${data.title}"`)
      patched = true
    }

    if (!data.description) {
      warnings.push('Missing recommended field "description" in frontmatter')
    }

    // Auto-discover steps if missing or empty
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      const discovered = autoDiscoverSteps(dir)
      if (discovered.length === 0) {
        errors.push('No steps defined in frontmatter and no step files (intro.md, step1.md…) found in the tutorial directory')
      } else {
        data.steps = discovered
        warnings.push(`Missing "steps" in frontmatter — auto-discovered ${discovered.length} step file(s): ${discovered.map((s) => s.file).join(', ')}`)
        patched = true
      }
    } else {
      for (const step of data.steps) {
        if (!step.file) { errors.push(`Step entry missing "file" key: ${JSON.stringify(step)}`); continue }
        if (!fs.existsSync(path.join(dir, step.file))) errors.push(`Step file not found: ${step.file}`)
      }
    }

    if (!content.trim()) warnings.push('index.md has no body text')

    // Rewrite index.md with auto-filled fields so loadTutorialMeta picks them up
    if (patched && errors.length === 0) {
      const newContent = matter.stringify(content, data)
      fs.writeFileSync(indexPath, newContent, 'utf8')
    }
  } catch (e) {
    errors.push(`Failed to parse index.md: ${e.message}`)
  }
  return { errors, warnings }
}

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
        matter(fs.readFileSync(stepPath, 'utf8'))
        // Title comes from index.md steps array — no frontmatter required in step files
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
