import { useState, useEffect } from 'react'
import SettingsPanel from '../components/SettingsPanel/SettingsPanel.jsx'

export default function LoginScreen({ onSession }) {
  const [tab, setTab] = useState('new')
  const [sessions, setSessions] = useState([])
  const [savedId] = useState(() => localStorage.getItem('sc101_session_id'))
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('sc101_session_id')
    fetch('/api/sessions')
      .then((r) => r.ok ? r.json() : [])
      .then((list) => {
        if (!list.length) return
        setSessions(list)
        // Auto-switch to resume tab if we have a saved session or any sessions exist
        if (saved && list.some((s) => s.id === saved)) setTab('resume')
        else if (list.length > 0) setTab('resume')
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
      let data
      try { data = await res.json() } catch { data = {} }
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      localStorage.setItem('sc101_session_id', data.id)
      onSession(data)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const resume = (session) => {
    localStorage.setItem('sc101_session_id', session.id)
    onSession(session)
  }

  const deleteSession = async (s, e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete account "${s.username}"?\n\nThis will permanently remove all progress and destroy the container.`)) return
    setDeletingId(s.id)
    try {
      await fetch(`/api/sessions/${s.id}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((x) => x.id !== s.id))
      if (localStorage.getItem('sc101_session_id') === s.id) localStorage.removeItem('sc101_session_id')
    } catch {}
    setDeletingId(null)
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt)
  )

  return (
    <div className="sc101-login">
      <nav className="sc101-nav">
        <span className="sc101-nav-brand">
          <span className="sc101-nav-logo">SC</span>
          SC101 Lab Interface
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsPanel />
        </div>
      </nav>

      <div className="sc101-login-body">
        <div className="sc101-login-card">
          <div className="sc101-login-card-header">
            <h2>Welcome</h2>
            <p>Start a new session or resume where you left off.</p>
          </div>

          <div className="sc101-login-card-body">
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

            {tab === 'new' && (
              <div role="tabpanel">
                <form onSubmit={create} className="p-form p-form--stacked">
                  <div className="p-form__group">
                    <label className="p-form__label" htmlFor="username">Username</label>
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
                      <p className="p-form-validation__message" style={{ color: '#c7162b' }}>{error}</p>
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

            {tab === 'resume' && (
              <div role="tabpanel">
                {sorted.length === 0 ? (
                  <div className="sc101-empty">
                    <p>No previous sessions found.</p>
                    <button className="p-button" onClick={() => setTab('new')}>Create one now</button>
                  </div>
                ) : (
                  <div className="sc101-session-list">
                    {sorted.map((s) => (
                      <div key={s.id} className="sc101-session-item-wrapper">
                        <button
                          className={`sc101-session-item${s.id === savedId ? ' is-saved' : ''}`}
                          onClick={() => resume(s)}
                          disabled={deletingId === s.id}
                        >
                          <div className="sc101-avatar">{s.username?.[0]?.toUpperCase() ?? '?'}</div>
                          <div style={{ flex: 1 }}>
                            <div className="sc101-session-name">{s.username}{s.id === savedId && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--sc101-accent)' }}>← last used</span>}</div>
                            <div className="sc101-session-meta">
                              {s.tutorialId ? `${s.tutorialId} · Step ${s.currentStep + 1}` : 'No tutorial started'} ·{' '}
                              {new Date(s.lastActiveAt).toLocaleString()}
                            </div>
                          </div>
                          <span className="sc101-session-arrow">›</span>
                        </button>
                        <button
                          className="sc101-session-delete"
                          title={`Delete account ${s.username}`}
                          onClick={(e) => deleteSession(s, e)}
                          disabled={deletingId === s.id}
                        >
                          {deletingId === s.id ? '…' : '🗑'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
