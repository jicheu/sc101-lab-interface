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

function ProgressBar({ pct, label, size = 'md' }) {
  return (
    <div className={`sc101-progress-row sc101-progress-row--${size}`}>
      <div className="sc101-progress-track">
        <div className="sc101-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="sc101-progress-pct">{pct}%</span>
      {label && <span className="sc101-settings-meta">{label}</span>}
    </div>
  )
}

export default function TutorialSelector({ session, onSelect, onLogout, activeTutorialId }) {
  const [tutorials, setTutorials] = useState([])
  const [validation, setValidation] = useState({})
  const [collapsedCourses, setCollapsedCourses] = useState({})
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    fetch('/api/tutorials')
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(async (list) => {
        if (!Array.isArray(list)) throw new Error('Unexpected response from server')
        setTutorials(list)

        // Build initial collapsed state: all folded except the course of the active tutorial
        const activeCourse = activeTutorialId
          ? list.find((t) => t.id === activeTutorialId)?.course ?? null
          : null
        const courseNames = [...new Set(list.map((t) => t.course))]
        const initial = {}
        for (const c of courseNames) initial[c] = (c !== activeCourse)
        setCollapsedCourses(initial)

        const results = await Promise.all(
          list.map((t) =>
            fetch(`/api/tutorials/${t.id}/validate`)
              .then((r) => r.json())
              .then((v) => [t.id, v])
              .catch(() => [t.id, { valid: true, errors: [] }])
          )
        )
        setValidation(Object.fromEntries(results))
        setLoading(false)
      })
      .catch((e) => { setFetchError(e.message); setLoading(false) })
  }, [])

  const getProgress = (tutorialId) => {
    const p = session?.progress?.[tutorialId]
    if (!p) return { status: 'not-started', currentStep: 0 }
    return p
  }

  const requirementsMet = (tut) => {
    if (!tut.requires?.length) return { met: true, unmet: [] }
    const unmet = tut.requires.filter((rid) => getProgress(rid).status !== 'completed')
    return { met: unmet.length === 0, unmet }
  }

  // ── Progress calculations ────────────────────────────────────────────────
  const totalCount = tutorials.length
  const completedCount = tutorials.filter((t) => getProgress(t.id).status === 'completed').length
  const globalPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  // Group tutorials by course, then by section within each course
  const courses = []
  const courseMap = {}
  for (const t of tutorials) {
    const courseName = t.course || 'Uncategorised'
    if (!courseMap[courseName]) { courseMap[courseName] = { sections: [], sectionMap: {} }; courses.push(courseName) }
    const sec = t.section || 'Uncategorised'
    if (!courseMap[courseName].sectionMap[sec]) {
      courseMap[courseName].sectionMap[sec] = []
      courseMap[courseName].sections.push(sec)
    }
    courseMap[courseName].sectionMap[sec].push(t)
  }

  const courseProgress = (courseName) => {
    const cData = courseMap[courseName]
    if (!cData) return 0
    const list = Object.values(cData.sectionMap).flat()
    const total = list.length
    const done = list.filter((t) => getProgress(t.id).status === 'completed').length
    return total ? Math.round((done / total) * 100) : 0
  }

  const sectionProgress = (courseName, secName) => {
    const list = courseMap[courseName]?.sectionMap[secName] || []
    const total = list.length
    const done = list.filter((t) => getProgress(t.id).status === 'completed').length
    return total ? Math.round((done / total) * 100) : 0
  }

  // ── Dependency tree layout per section ──────────────────────────────────
  // Returns array of "groups": { root: tut|null, children: tut[] }
  // - root=null means these are standalone tutorials with no parent in this section
  // - root=tut  means this root + its direct dependents form one visual group
  const buildSectionGroups = (list) => {
    const ids = new Set(list.map((t) => t.id))
    // A tutorial is a "root" in this section if it has no requires within this section
    const isLocalRoot = (t) => !t.requires?.some((r) => ids.has(r))
    // Map: rootId → direct children within this section
    const childrenOf = {}
    for (const t of list) {
      if (isLocalRoot(t)) { childrenOf[t.id] = [] }
    }
    for (const t of list) {
      if (!isLocalRoot(t)) {
        // attach to the first local parent
        const localParent = t.requires?.find((r) => ids.has(r))
        if (localParent && childrenOf[localParent]) childrenOf[localParent].push(t)
      }
    }
    return list
      .filter((t) => isLocalRoot(t))
      .map((root) => ({ root, children: childrenOf[root.id] || [] }))
  }

  const handleSelect = async (tut) => {
    const v = validation[tut.id]
    if (v && !v.valid) return
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutorialId: tut.id, currentStep: getProgress(tut.id).currentStep || 0 }),
    }).catch(() => {})
    onSelect({ ...session, tutorialId: tut.id, currentStep: getProgress(tut.id).currentStep || 0 })
  }

  // ── Tutorial card ────────────────────────────────────────────────────────
  const TutorialCard = ({ tut }) => {
    const v = validation[tut.id] ?? { valid: true, errors: [] }
    const progress   = getProgress(tut.id)
    const statusInfo = STATUS_LABEL[progress.status] ?? STATUS_LABEL['not-started']
    const { met, unmet } = requirementsMet(tut)
    const isBroken   = !v.valid
    const totalSteps = tut.steps?.length ?? 0
    const errOpen    = expanded === tut.id
    const tutPct     = totalSteps
      ? Math.round(((progress.currentStep + (progress.status === 'completed' ? totalSteps : 0)) / totalSteps) * 100)
      : 0

    const reqTutorials = (tut.requires || []).map((rid) => {
      const found = tutorials.find((t) => t.id === rid)
      return { id: rid, title: found?.title ?? rid, done: getProgress(rid).status === 'completed' }
    })

    return (
      <div className={`sc101-tut-card${isBroken ? ' is-broken' : ''}${!met && !isBroken ? ' is-locked' : ''}`}>
        <div className="sc101-tut-card-header">
          <div className="sc101-tut-badges">
            <span
              className="sc101-badge"
              style={{ backgroundColor: DIFFICULTY_COLOUR[tut.difficulty] ?? '#888', color: '#fff' }}
            >{tut.difficulty ?? 'unknown'}</span>
            <span className={`sc101-badge ${statusInfo.cls}`}>{statusInfo.text}</span>
            {isBroken && (
              <button
                className="sc101-badge sc101-badge--broken"
                onClick={() => setExpanded(errOpen ? null : tut.id)}
              >⚠ broken {errOpen ? '▲' : '▼'}</button>
            )}
          </div>
          {tut.time && <span className="sc101-tut-time">⏱ {tut.time} min</span>}
        </div>

        {isBroken && errOpen && (
          <div className="sc101-tut-errors">
            <div className="sc101-tut-errors-title">Validation errors</div>
            <ul>{v.errors.map((e, i) => <li key={i}><code>{e.file}</code>: {e.message}</li>)}</ul>
          </div>
        )}

        <div className="sc101-tut-card-body">
          <h3 className="sc101-tut-title">{tut.title}</h3>
          <p className="sc101-tut-desc">{tut.description}</p>

          {tut.tags?.length > 0 && (
            <div className="sc101-tut-tags">
              {tut.tags.map((tag) => <span key={tag} className="sc101-tut-tag">{tag}</span>)}
            </div>
          )}

          {reqTutorials.length > 0 && (
            <div className="sc101-tut-requires">
              <span className="sc101-tut-requires-label">Requires:</span>
              {reqTutorials.map((r) => (
                <span key={r.id} className={`sc101-badge sc101-badge--req${r.done ? ' is-done' : ' is-pending'}`}>
                  {r.done ? '✓' : '○'} {r.title}
                </span>
              ))}
            </div>
          )}

          {progress.status !== 'not-started' && totalSteps > 0 && (
            <ProgressBar
              pct={tutPct}
              label={progress.status === 'completed' ? null : `Step ${progress.currentStep + 1} / ${totalSteps}`}
            />
          )}
        </div>

        <div className="sc101-tut-card-footer">
          {isBroken ? (
            <span className="sc101-tut-cta-disabled">Fix errors to enable</span>
          ) : !met ? (
            <span className="sc101-tut-cta-disabled" title={`Complete first: ${unmet.join(', ')}`}>
              🔒 Complete prerequisites first
            </span>
          ) : (
            <button className="p-button--positive sc101-tut-cta" onClick={() => handleSelect(tut)}>
              {progress.status === 'not-started' ? '▶ Start' :
               progress.status === 'completed'   ? '↺ Restart' : '→ Resume'}
            </button>
          )}
        </div>
      </div>
    )
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
          <p>Hello, <strong>{session?.username}</strong>. Pick up where you left off or start something new.</p>

          {!loading && !fetchError && totalCount > 0 && (
            <div className="sc101-global-progress">
              <span className="sc101-global-progress-label">
                Overall progress — {completedCount} of {totalCount} tutorial{totalCount !== 1 ? 's' : ''} completed
              </span>
              <ProgressBar pct={globalPct} size="lg" />
            </div>
          )}
        </div>

        {loading && <div className="sc101-selector-empty">Loading tutorials…</div>}

        {!loading && fetchError && (
          <div className="sc101-selector-error">
            <strong>Could not load tutorials</strong>
            <p>{fetchError}</p>
            <p>Make sure the backend server is running (<code>npm run dev:backend</code>) and try reloading.</p>
          </div>
        )}

        {!loading && !fetchError && tutorials.length === 0 && (
          <div className="sc101-selector-empty">No tutorials found in the <code>tutorials/</code> folder.</div>
        )}

        {!loading && !fetchError && courses.map((courseName) => {
          const cData = courseMap[courseName]
          const cPct = courseProgress(courseName)
          const isCollapsed = collapsedCourses[courseName] ?? false
          const toggle = () => setCollapsedCourses((prev) => ({ ...prev, [courseName]: !isCollapsed }))
          return (
            <div key={courseName} className="sc101-course">
              <button className="sc101-course-header" onClick={toggle} aria-expanded={!isCollapsed}>
                <div className="sc101-course-title-row">
                  <span className="sc101-course-chevron">{isCollapsed ? '▶' : '▼'}</span>
                  <h2 className="sc101-course-title">{courseName}</h2>
                  <span className="sc101-course-pct">{cPct}%</span>
                </div>
                <ProgressBar pct={cPct} size="md" />
              </button>

              {!isCollapsed && cData.sections.map((secName) => {
                const secPct = sectionProgress(courseName, secName)
                const secList = cData.sectionMap[secName]
                const secGroups = buildSectionGroups(secList)
                return (
                  <div key={secName} className="sc101-section">
                    <div className="sc101-section-header">
                      <div className="sc101-section-title-row">
                        <h3 className="sc101-section-title">{secName}</h3>
                        <span className="sc101-section-pct">{secPct}%</span>
                      </div>
                      <ProgressBar pct={secPct} size="sm" />
                    </div>
                    {secGroups.map((group) => (
                      <div key={group.root.id} className="sc101-tut-group">
                        <div className="sc101-tutorial-grid sc101-tutorial-grid--root">
                          <TutorialCard tut={group.root} />
                        </div>
                        {group.children.length > 0 && (
                          <div className="sc101-tutorial-grid sc101-tutorial-grid--children">
                            {group.children.map((tut) => <TutorialCard key={tut.id} tut={tut} />)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
