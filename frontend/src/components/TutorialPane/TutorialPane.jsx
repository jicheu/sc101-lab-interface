import { useState, useEffect, useRef } from 'react'
import { marked, Renderer } from 'marked'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism-tomorrow.css'

marked.use({ breaks: true })

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
      ? `<button class="sc101-run-btn" data-command="${escapeAttr(code)}">▶ Run</button>`
      : ''

    return `<div class="sc101-code-block">
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

export default function TutorialPane({ tutorialId: tutorialIdProp, session, onRunCommand, onProgress }) {
  const tutorialId = tutorialIdProp ?? session?.tutorialId ?? 'hello-snap'
  const [meta, setMeta] = useState(null)
  const [stepIndex, setStepIndex] = useState(session?.currentStep ?? 0)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const contentRef = useRef(null)

  useEffect(() => {
    fetch(`/api/tutorials/${tutorialId}/meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch((e) => setError(e.message))
  }, [tutorialId])

  useEffect(() => {
    if (!meta) return
    setLoading(true)
    setError(null)
    // Scroll content pane to top whenever the step changes
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    fetch(`/api/tutorials/${tutorialId}/step/${stepIndex}`)
      .then((r) => r.json())
      .then(({ markdown }) => {
        const renderer = buildRenderer(onRunCommand)
        setHtml(marked.parse(markdown, { renderer }))
        setLoading(false)
      })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [meta, stepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session?.id || !meta) return
    const total = meta?.steps?.length ?? 0
    const isLast = stepIndex >= total - 1
    fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorialId: session.tutorialId,
        currentStep: stepIndex,
        totalSteps: total,
        status: isLast ? 'completed' : 'in-progress',
      }),
    }).catch(() => {})
  }, [stepIndex, session?.id, meta]) // eslint-disable-line react-hooks/exhaustive-deps

  // Report progress upward whenever step or meta changes
  useEffect(() => {
    onProgress?.({ step: stepIndex, meta })
  }, [stepIndex, meta]) // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = (i) => {
    const total = meta?.steps?.length ?? 0
    if (i >= 0 && i < total) setStepIndex(i)
  }

  const handleContentClick = (e) => {
    const btn = e.target.closest('.sc101-run-btn')
    if (btn && onRunCommand) onRunCommand(btn.dataset.command)
  }

  const totalSteps = meta?.steps?.length ?? 0
  const stepTitle = meta?.steps?.[stepIndex]?.title ?? ''

  return (
    <div className="sc101-tutorial-pane">
      <div className="sc101-tutorial-header">
        <h3>{meta?.title ?? 'Loading…'}</h3>
        <span className="sc101-step-indicator">
          Step {stepIndex + 1} / {totalSteps}
        </span>
      </div>

      <div className="sc101-tutorial-content" ref={contentRef} onClick={handleContentClick}>
        {stepTitle && <h1>{stepTitle}</h1>}
        {loading && <p style={{ color: 'var(--sc101-fg-muted)' }}>Loading…</p>}
        {error && <p style={{ color: '#c7162b' }}>Error: {error}</p>}
        {!loading && !error && (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>

      <div className="sc101-step-nav">
        <button
          className="p-button"
          onClick={() => navigateTo(stepIndex - 1)}
          disabled={stepIndex === 0}
        >
          ← Previous
        </button>

        <span className="sc101-step-indicator">{stepTitle}</span>

        <button
          className="p-button"
          onClick={() => navigateTo(stepIndex + 1)}
          disabled={stepIndex >= totalSteps - 1}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
