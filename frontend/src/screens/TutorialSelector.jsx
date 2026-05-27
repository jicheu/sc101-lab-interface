import { useState, useEffect } from 'react'
import SettingsPanel from '../components/SettingsPanel/SettingsPanel.jsx'

const DIFFICULTY_COLOUR = {
  beginner:     '#0e8420',
  intermediate: '#f99b11',
  advanced:     '#c7162b',
}

const STATUS_LABEL = {
  'not-started': { text: 'Not started', cls: 'sc101-badge--muted' },
  'in-progress': { text: 'In progress', cls: 'sc101-badge--info'  },
  'completed':   { text: 'Completed ✓', cls: 'sc101-badge--ok'    },
}

export default function TutorialSelector({ session, onSelect, onLogout }) {
  const [tutorials, setTutorials] = useState([])
  const [validation, setValidation] = useState({})   // { [id]: { valid, errors } }
  const [expanded, setExpanded] = useState(null)     // id of card with errors open
  const [loading, setLoading] = useState(true)

  // Load tutorial list + run validation on each
  useEffect(() => {
    fetch('/api/tutorials')
      .then((r) => r.json())
      .then(async (list) => {
        setTutorials(list)
        // Validate all tutorials in parallel
        const results = await Promise.all(
          list.map((t) =>
            fetch(`/api/tutorials/${t.id}/validate`)
              .then((r) => r.json())
              .then((v) => [t.id, v])
              .catch(() => [t.id, { valid: false, errors: [{ file: 'index.md', message: 'Validation request failed' }] }])
          )
        )
        setValidation(Object.fromEntries(results))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getProgress = (tutorialId) => {
    const p = session?.progress?.[tutorialId]
    if (!p) return { status: 'not-started', currentStep: 0 }
    return p
  }

  // Check if all requirements are met for a tutorial
  const requirementsMet = (tut) => {
    if (!tut.requires?.length) return { met: true, unmet: [] }
    const unmet = tut.requires.filter((rid) => {
      const p = getProgress(rid)
      return p.status !== 'completed'
    })
    return { met: unmet.length === 0, unmet }
  }

  const handleSelect = async (tut) => {
    const v = validation[tut.id]
    if (v && !v.valid) return  // don't open broken tutorials

    // Update session's active tutorial
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutorialId: tut.id, currentStep: getProgress(tut.id).currentStep || 0 }),
    }).catch(() => {})

    onSelect({ ...session, tutorialId: tut.id, currentStep: getProgress(tut.id).currentStep || 0 })
  }

  return (
    <div className="sc101-selector">
      <nav className="sc101-nav">
        <span className="sc101-nav-brand">
          <span className="sc101-nav-logo">SC</span>
          SC101 Lab Interface
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsPanel session={session} />
          <button className="sc101-nav-text-btn" onClick={onLogout}>⎋ Exit</button>
        </div>
      </nav>

      <div className="sc101-selector-body">
        <div className="sc101-selector-header">
          <h1>Choose a tutorial</h1>
          <p>
            Hello, <strong>{session?.username}</strong>. Pick up where you left off or start something new.
          </p>
        </div>

        {loading ? (
          <div className="sc101-selector-empty">Loading tutorials…</div>
        ) : tutorials.length === 0 ? (
          <div className="sc101-selector-empty">No tutorials found in the tutorials/ folder.</div>
        ) : (
          <div className="sc101-tutorial-grid">
            {tutorials.map((tut) => {
              const v = validation[tut.id] ?? { valid: true, errors: [] }
              const progress = getProgress(tut.id)
              const statusInfo = STATUS_LABEL[progress.status] ?? STATUS_LABEL['not-started']
              const { met, unmet } = requirementsMet(tut)
              const isbroken = !v.valid
              const totalSteps = tut.steps?.length ?? 0
              const errOpen = expanded === tut.id

              // Find names of required tutorials
              const reqTutorials = (tut.requires || []).map((rid) => {
                const found = tutorials.find((t) => t.id === rid)
                return { id: rid, title: found?.title ?? rid, done: getProgress(rid).status === 'completed' }
              })

              return (
                <div
                  key={tut.id}
                  className={`sc101-tut-card${isbroken ? ' is-broken' : ''}${!met && !isbroken ? ' is-locked' : ''}`}
                >
                  {/* Header */}
                  <div className="sc101-tut-card-header">
                    <div className="sc101-tut-badges">
                      <span
                        className="sc101-badge"
                        style={{ backgroundColor: DIFFICULTY_COLOUR[tut.difficulty] ?? '#888', color: '#fff' }}
                      >
                        {tut.difficulty ?? 'unknown'}
                      </span>
                      <span className={`sc101-badge ${statusInfo.cls}`}>{statusInfo.text}</span>
                      {isbroken && (
                        <button
                          className="sc101-badge sc101-badge--broken"
                          onClick={() => setExpanded(errOpen ? null : tut.id)}
                          title="Show validation errors"
                        >
                          ⚠ broken {errOpen ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                    {tut.time && (
                      <span className="sc101-tut-time">⏱ {tut.time} min</span>
                    )}
                  </div>

                  {/* Error list (expandable) */}
                  {isbroken && errOpen && (
                    <div className="sc101-tut-errors">
                      <div className="sc101-tut-errors-title">Validation errors</div>
                      <ul>
                        {v.errors.map((e, i) => (
                          <li key={i}><code>{e.file}</code>: {e.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Title & description */}
                  <div className="sc101-tut-card-body">
                    <h3 className="sc101-tut-title">{tut.title}</h3>
                    <p className="sc101-tut-desc">{tut.description}</p>

                    {/* Tags */}
                    {tut.tags?.length > 0 && (
                      <div className="sc101-tut-tags">
                        {tut.tags.map((tag) => (
                          <span key={tag} className="sc101-tut-tag">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Dependencies */}
                    {reqTutorials.length > 0 && (
                      <div className="sc101-tut-requires">
                        <span className="sc101-tut-requires-label">Requires:</span>
                        {reqTutorials.map((r) => (
                          <span
                            key={r.id}
                            className={`sc101-badge sc101-badge--req${r.done ? ' is-done' : ' is-pending'}`}
                            title={r.done ? 'Completed' : 'Not yet completed'}
                          >
                            {r.done ? '✓' : '○'} {r.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress bar */}
                    {progress.status !== 'not-started' && totalSteps > 0 && (
                      <div className="sc101-tut-progress">
                        <div
                          className="sc101-progress-track"
                          title={`Step ${progress.currentStep + 1} of ${totalSteps}`}
                        >
                          <div
                            className="sc101-progress-fill"
                            style={{ width: `${Math.round(((progress.currentStep + 1) / totalSteps) * 100)}%` }}
                          />
                        </div>
                        <span className="sc101-settings-meta">
                          Step {progress.currentStep + 1} / {totalSteps}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="sc101-tut-card-footer">
                    {isbroken ? (
                      <span className="sc101-tut-cta-disabled">Fix errors to enable</span>
                    ) : !met ? (
                      <span className="sc101-tut-cta-disabled" title={`Complete first: ${unmet.join(', ')}`}>
                        🔒 Complete prerequisites first
                      </span>
                    ) : (
                      <button
                        className="p-button--positive sc101-tut-cta"
                        onClick={() => handleSelect(tut)}
                      >
                        {progress.status === 'not-started' ? '▶ Start' :
                         progress.status === 'completed'   ? '↺ Restart' :
                                                             '→ Resume'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
