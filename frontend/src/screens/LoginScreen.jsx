import { useState, useEffect } from 'react'
import ThemeToggle from '../components/ThemeToggle/ThemeToggle.jsx'

export default function LoginScreen({ onSession }) {
  const [tab, setTab] = useState('new')
  const [sessions, setSessions] = useState([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((list) => {
        setSessions(list)
        // Auto-select resume tab if sessions exist
        if (list.length > 0) setTab('resume')
      })
      .catch(() => {})
  }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const session = await res.json()
      localStorage.setItem('sc101_session_id', session.id)
      onSession(session)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const resume = (session) => {
    localStorage.setItem('sc101_session_id', session.id)
    onSession(session)
  }

  // Sort sessions newest-last-active first
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt)
  )

  return (
    <div className="sc101-login">
      {/* Top bar */}
      <nav className="sc101-nav">
        <span className="sc101-nav-brand">
          <span className="sc101-nav-logo">SC</span>
          SC101 Lab Interface
        </span>
        <ThemeToggle />
      </nav>

      {/* Centred card */}
      <div className="sc101-login-body">
        <div className="sc101-login-card">
          <div className="sc101-login-card-header">
            <h2>Welcome</h2>
            <p>Start a new session or resume where you left off.</p>
          </div>

          <div className="sc101-login-card-body">
            {/* Tabs */}
            <div className="sc101-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'new'}
                className={`sc101-tab${tab === 'new' ? ' is-active' : ''}`}
                onClick={() => setTab('new')}
              >
                New session
              </button>
              <button
                role="tab"
                aria-selected={tab === 'resume'}
                className={`sc101-tab${tab === 'resume' ? ' is-active' : ''}`}
                onClick={() => setTab('resume')}
              >
                Resume session {sessions.length > 0 && `(${sessions.length})`}
              </button>
            </div>

            {/* New session panel */}
            {tab === 'new' && (
              <div role="tabpanel">
                <form onSubmit={create} className="p-form p-form--stacked">
                  <div className="p-form__group">
                    <label className="p-form__label" htmlFor="username">
                      Username
                    </label>
                    <input
                      id="username"
                      className="p-form__control"
                      type="text"
                      placeholder="e.g. alice"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                      disabled={loading}
                      autoComplete="username"
                    />
                    {error && (
                      <p className="p-form-validation__message" style={{ color: '#c7162b' }}>
                        {error}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className={`p-button--positive${loading ? ' is-processing' : ''}`}
                    disabled={loading || !username.trim()}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {loading ? 'Starting…' : 'Start session'}
                  </button>
                </form>
              </div>
            )}

            {/* Resume session panel */}
            {tab === 'resume' && (
              <div role="tabpanel">
                {sorted.length === 0 ? (
                  <div className="sc101-empty">
                    <p>No previous sessions found.</p>
                    <button
                      className="p-button"
                      onClick={() => setTab('new')}
                    >
                      Create one now
                    </button>
                  </div>
                ) : (
                  <div className="sc101-session-list">
                    {sorted.map((s) => (
                      <button
                        key={s.id}
                        className="sc101-session-item"
                        onClick={() => resume(s)}
                      >
                        <div className="sc101-avatar">
                          {s.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="sc101-session-name">{s.username}</div>
                          <div className="sc101-session-meta">
                            {s.tutorialId} · Step {s.currentStep + 1} ·{' '}
                            {new Date(s.lastActiveAt).toLocaleString()}
                          </div>
                        </div>
                        <span className="sc101-session-arrow">›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SSO placeholder */}
            {/* TODO(auth): Replace username-only login with SSO (e.g. OIDC/SAML).
                Map session.username → SSO identity subject claim. */}
            <div className="sc101-sso-note">
              <span>🔒</span>
              <span>SSO integration planned — username only for now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
