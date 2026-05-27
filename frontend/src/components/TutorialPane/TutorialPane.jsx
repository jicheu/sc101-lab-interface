import { useState, useEffect } from 'react'
import { marked, Renderer } from 'marked'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism-tomorrow.css'

const TUTORIAL_ID = 'hello-snap'

marked.use({ breaks: true })

// Custom renderer: code blocks tagged with "run" get a ▶ Run button
function buildRenderer(onRunCommand) {
  const renderer = new Renderer()

  renderer.code = (code, infoString) => {
    const parts = (infoString || '').trim().split(/\s+/)
    const lang = parts[0] || ''
    const isRunnable = parts.includes('run')

    const highlighted = lang && Prism.languages[lang]
      ? Prism.highlight(code, Prism.languages[lang], lang)
      : escapeHtml(code)

    const runButton = isRunnable
      ? `<button class="run-btn" data-command="${escapeAttr(code)}">▶ Run</button>`
      : ''

    return `<div class="code-block-wrapper">
  <pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>
  ${runButton}
</div>`
  }

  return renderer
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s) {
  return s.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')
}

export default function TutorialPane({ onRunCommand }) {
  const [meta, setMeta] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load tutorial metadata once
  useEffect(() => {
    fetch(`/api/tutorials/${TUTORIAL_ID}/meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch((e) => setError(e.message))
  }, [])

  // Load step content whenever step changes
  useEffect(() => {
    if (!meta) return
    setLoading(true)
    setError(null)

    fetch(`/api/tutorials/${TUTORIAL_ID}/step/${stepIndex}`)
      .then((r) => r.json())
      .then(({ markdown }) => {
        const renderer = buildRenderer(onRunCommand)
        setHtml(marked.parse(markdown, { renderer }))
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [meta, stepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Delegate run-button clicks via event delegation on the content div
  const handleContentClick = (e) => {
    const btn = e.target.closest('.run-btn')
    if (btn && onRunCommand) {
      const command = btn.dataset.command
      onRunCommand(command)
    }
  }

  const totalSteps = meta?.steps?.length ?? 0
  const stepTitle = meta?.steps?.[stepIndex]?.title ?? ''

  return (
    <div className="tutorial-pane">
      <div className="tutorial-header">
        <h1>{meta?.title ?? 'Loading…'}</h1>
        {meta && (
          <div className="step-indicator">
            Step {stepIndex + 1} of {totalSteps} — {stepTitle}
          </div>
        )}
      </div>

      <div className="tutorial-content" onClick={handleContentClick}>
        {loading && <p style={{ color: '#7a9cc0' }}>Loading…</p>}
        {error && <p style={{ color: '#e94560' }}>Error: {error}</p>}
        {!loading && !error && (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>

      <div className="tutorial-nav">
        <button
          className="nav-btn"
          onClick={() => setStepIndex((i) => i - 1)}
          disabled={stepIndex === 0}
        >
          ← Previous
        </button>

        <div className="step-dots">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === stepIndex ? 'active' : ''}`}
              onClick={() => setStepIndex(i)}
            />
          ))}
        </div>

        <button
          className="nav-btn"
          onClick={() => setStepIndex((i) => i + 1)}
          disabled={stepIndex >= totalSteps - 1}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
