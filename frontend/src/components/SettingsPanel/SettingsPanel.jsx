import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../ThemeToggle/ThemeContext.jsx'
const THEME_OPTIONS = [
  { value: 'light', icon: '☀', label: 'Light' },
  { value: 'auto',  icon: '⬤', label: 'Auto'  },
  { value: 'dark',  icon: '☾', label: 'Dark'  },
]

export default function SettingsPanel({ session, tutorialProgress }) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { theme, setTheme } = useTheme()
  const panelRef = useRef(null)
  const btnRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  const [exportError, setExportError] = useState(null)
  const [exportStatus, setExportStatus] = useState(null)

  // Host prerequisites check
  const [setupChecks, setSetupChecks] = useState(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupCopied, setSetupCopied] = useState(null)
  const [setupOpen, setSetupOpen] = useState(false)

  const loadSetup = () => {
    setSetupLoading(true)
    fetch('/api/setup/check')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSetupChecks(d.checks) })
      .catch(() => {})
      .finally(() => setSetupLoading(false))
  }

  const copySetupCmd = (id, cmd) => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setSetupCopied(id)
      setTimeout(() => setSetupCopied(null), 2000)
    })
  }

  // GitHub tutorial import
  const [importOpen, setImportOpen]     = useState(false)
  const [importUrl, setImportUrl]       = useState('')
  const [importCourse, setImportCourse] = useState('')
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)  // { ok, error, errors, warnings, meta }

  const handleImport = async () => {
    if (!importUrl.trim() || importing) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/tutorials/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim(), course: importCourse.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) setImportResult({ ok: false, ...data })
      else { setImportResult({ ok: true, ...data }); setImportUrl(''); setImportCourse('') }
    } catch (e) {
      setImportResult({ ok: false, error: e.message })
    } finally {
      setImporting(false)
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  }

  const handleExport = async () => {
    if (!session || exporting) return
    setExporting(true)
    setExportError(null)
    setExportStatus('Requesting export from server…')
    try {
      const res = await fetch(`/api/sessions/${session.id}/export`)
      if (!res.ok) {
        let msg = `Server error ${res.status}`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        throw new Error(msg)
      }
      // Content-Length is available as soon as response headers arrive
      const contentLength = res.headers.get('content-length')
      const sizeLabel = contentLength ? formatBytes(parseInt(contentLength, 10)) : null
      setExportStatus(sizeLabel ? `Downloading ${sizeLabel}…` : 'Downloading…')
      const blob = await res.blob()
      const actualSize = formatBytes(blob.size)
      setExportStatus(`Saving ${actualSize}…`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${session.containerName}.tar.gz`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setExportStatus(`✓ Downloaded — ${actualSize}`)
      setTimeout(() => setExportStatus(null), 6000)
    } catch (err) {
      setExportError(err.message)
      setExportStatus(null)
    } finally {
      setExporting(false)
    }
  }

  const { meta: tutorialMeta, step: currentStep = 0 } = tutorialProgress ?? {}
  const totalSteps = tutorialMeta?.steps?.length ?? 0
  const progressPct = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        className="sc101-gear-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
      >
        ⚙
      </button>

      {open && (
        <div ref={panelRef} className="sc101-settings-panel" role="dialog" aria-label="Settings">

          {/* User & tutorial info */}
          {session && (
            <>
              <div className="sc101-settings-section">
                <div className="sc101-settings-label">Signed in as</div>
                <div className="sc101-settings-value sc101-settings-username">
                  <span className="sc101-avatar sc101-avatar--sm">
                    {session.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  {session.username}
                </div>
              </div>

              <div className="sc101-settings-divider" />

              {tutorialProgress && (
                <>
                  <div className="sc101-settings-section">
                    <div className="sc101-settings-label">Tutorial</div>
                    <div className="sc101-settings-value">
                      {tutorialMeta?.title ?? session.tutorialId}
                    </div>
                    {totalSteps > 0 && (
                      <>
                        <div className="sc101-progress-track" title={`${progressPct}%`}>
                          <div className="sc101-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="sc101-settings-meta">
                          Step {currentStep + 1} of {totalSteps} — {progressPct}%
                        </div>
                      </>
                    )}
                  </div>

                  <div className="sc101-settings-divider" />
                </>
              )}

              <div className="sc101-settings-section">
                <button
                  className={`sc101-download-btn${exporting ? ' is-loading' : ''}`}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? '⏳ Exporting…' : '⬇ Download LXC image'}
                </button>
                {exportStatus && (
                  <div className={`sc101-settings-meta sc101-export-status${exportStatus.startsWith('✓') ? ' is-done' : ''}`}>
                    {exportStatus}
                  </div>
                )}
                {exportError && (
                  <div className="sc101-settings-meta" style={{ color: '#c7162b' }}>
                    ✕ {exportError}
                  </div>
                )}
                {!exportStatus && !exportError && (
                  <div className="sc101-settings-meta">
                    Exports container as .tar.gz
                  </div>
                )}
              </div>

              <div className="sc101-settings-divider" />
            </>
          )}

          {/* Theme */}
          <div className="sc101-settings-section">
            <div className="sc101-settings-label">Colour theme</div>
            <div className="sc101-theme-row">
              {THEME_OPTIONS.map(({ value, icon, label }) => (
                <button
                  key={value}
                  className={`sc101-theme-opt${theme === value ? ' is-active' : ''}`}
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          <div className="sc101-settings-divider" />

          {/* Import tutorial from GitHub */}
          <div className="sc101-settings-section">
            <button
              className="sc101-download-btn"
              onClick={() => { setImportOpen((v) => !v); setImportResult(null) }}
            >
              ⬇ Import tutorial from GitHub
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{importOpen ? '▲' : '▼'}</span>
            </button>

            {importOpen && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input
                  className="sc101-import-input"
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={importUrl}
                  onChange={(e) => { setImportUrl(e.target.value); setImportResult(null) }}
                  disabled={importing}
                />
                <input
                  className="sc101-import-input"
                  type="text"
                  placeholder="Course name (optional, e.g. My Course)"
                  value={importCourse}
                  onChange={(e) => setImportCourse(e.target.value)}
                  disabled={importing}
                />
                <button
                  className="sc101-download-btn"
                  onClick={handleImport}
                  disabled={importing || !importUrl.trim()}
                >
                  {importing ? '⏳ Importing…' : '⬇ Import'}
                </button>

                {importResult && importResult.ok && (
                  <div className="sc101-import-result is-ok">
                    <div>✓ Imported {importResult.imported?.length ?? 1} tutorial(s) into <strong>{importResult.course?.replace(/_/g, ' ')}</strong></div>
                    {importResult.format && importResult.format !== 'sc101' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--sc101-fg-muted)' }}>Converted from KillerCoda format</div>
                    )}
                    {importResult.imported?.map((t, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', color: 'var(--sc101-fg-muted)' }}>
                        • {t.meta?.title || t.tutorial}
                      </div>
                    ))}
                    {importResult.warnings?.length > 0 && (
                      <ul className="sc101-import-warnings">
                        {importResult.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
                      </ul>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--sc101-fg-muted)', marginTop: '0.25rem' }}>Refresh the tutorial list to see it.</div>
                  </div>
                )}

                {importResult && !importResult.ok && (
                  <div className="sc101-import-result is-error">
                    <div>✗ {importResult.error}</div>
                    {importResult.errors?.length > 0 && (
                      <ul className="sc101-import-warnings">
                        {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                    {importResult.warnings?.length > 0 && (
                      <ul className="sc101-import-warnings">
                        {importResult.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sc101-settings-divider" />

          {/* Host prerequisites */}
          <div className="sc101-settings-section">
            <button
              className="sc101-download-btn"
              onClick={() => { setSetupOpen((v) => !v); if (!setupChecks) loadSetup() }}
            >
              {setupChecks && setupChecks.some((c) => !c.ok) ? '⚠ ' : '🔧 '}
              Host prerequisites
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{setupOpen ? '▲' : '▼'}</span>
            </button>

            {setupOpen && (
              <div style={{ marginTop: '0.5rem' }}>
                {setupLoading && <div className="sc101-settings-meta">Checking…</div>}
                {!setupLoading && setupChecks && (
                  <ul className="sc101-setup-list">
                    {setupChecks.map((c) => (
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
                              <button className="sc101-setup-copy" onClick={() => copySetupCmd(c.id, c.fix)} title="Copy">
                                {setupCopied === c.id ? '✓' : '⎘'}
                              </button>
                              {c.docs && <a href={c.docs} target="_blank" rel="noopener noreferrer" className="sc101-setup-docs">docs ↗</a>}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="sc101-download-btn" style={{ marginTop: '0.25rem' }} onClick={loadSetup} disabled={setupLoading}>
                  {setupLoading ? 'Checking…' : '↺ Re-check'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
