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

  const handleExport = () => {
    if (!session || exporting) return
    setExporting(true)
    // Trigger a browser download; the fetch completes in the background
    const link = document.createElement('a')
    link.href = `/api/sessions/${session.id}/export`
    link.download = `${session.containerName}.tar.gz`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Re-enable after a few seconds (the download is async on server side)
    setTimeout(() => setExporting(false), 5000)
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
                    {session.username[0].toUpperCase()}
                  </span>
                  {session.username}
                </div>
              </div>

              <div className="sc101-settings-divider" />

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

              <div className="sc101-settings-section">
                <button
                  className={`sc101-download-btn${exporting ? ' is-loading' : ''}`}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? '⏳ Preparing…' : '⬇ Download LXC image'}
                </button>
                <div className="sc101-settings-meta" style={{ marginTop: '0.375rem' }}>
                  Exports container as .tar.gz
                </div>
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
        </div>
      )}
    </div>
  )
}
