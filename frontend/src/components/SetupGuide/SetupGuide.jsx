import { useState, useEffect, useRef } from 'react'

export default function SetupGuide() {
  const [open, setOpen]       = useState(false)
  const [checks, setChecks]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(null)
  const dialogRef = useRef(null)

  const load = () => {
    setLoading(true)
    fetch('/api/setup/check')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setChecks(d.checks) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleOpen = () => { setOpen(true); load() }
  const handleClose = () => setOpen(false)

  // Close on Escape / outside click
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (dialogRef.current && !dialogRef.current.contains(e.target)) handleClose() }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const copyCmd = (id, cmd) => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const allOk = checks?.every((c) => c.ok)

  return (
    <>
      <button
        className="sc101-nav-text-btn"
        onClick={handleOpen}
        title="Host setup prerequisites"
        aria-label="Setup guide"
      >
        {allOk === false ? '⚠ Setup' : '🔧 Setup'}
      </button>

      {open && (
        <div className="sc101-modal-overlay" role="dialog" aria-modal="true" aria-label="Host Setup Guide">
          <div ref={dialogRef} className="sc101-modal">
            <div className="sc101-modal-header">
              <h2>Host Prerequisites</h2>
              <button className="sc101-modal-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            <div className="sc101-modal-body">
              <p className="sc101-modal-intro">
                These tools must be installed on the host machine before running SC101 Lab Interface.
              </p>

              {loading && <div className="sc101-modal-loading">Checking prerequisites…</div>}

              {!loading && checks && (
                <ul className="sc101-setup-list">
                  {checks.map((c) => (
                    <li key={c.id} className={`sc101-setup-item${c.ok ? ' is-ok' : ' is-missing'}`}>
                      <span className="sc101-setup-status">{c.ok ? '✓' : '✗'}</span>
                      <div className="sc101-setup-details">
                        <div className="sc101-setup-label">
                          {c.label}
                          {c.version && <span className="sc101-setup-version">{c.version}</span>}
                        </div>
                        {!c.ok && c.fix && (
                          <div className="sc101-setup-fix">
                            <code className="sc101-setup-cmd">{c.fix}</code>
                            <button
                              className="sc101-setup-copy"
                              onClick={() => copyCmd(c.id, c.fix)}
                              title="Copy command"
                            >
                              {copied === c.id ? '✓' : '⎘'}
                            </button>
                            {c.docs && (
                              <a href={c.docs} target="_blank" rel="noopener noreferrer" className="sc101-setup-docs">
                                docs ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {!loading && checks && allOk && (
                <div className="sc101-setup-all-ok">
                  ✓ All prerequisites met — you're good to go!
                </div>
              )}

              <div className="sc101-modal-footer">
                <button className="p-button" onClick={load} disabled={loading}>
                  {loading ? 'Checking…' : '↺ Re-check'}
                </button>
                <button className="p-button--positive" onClick={handleClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
