import { useState, useEffect } from 'react'

export default function LoginScreen({ onSession }) {
  const [sessions, setSessions] = useState([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {})
  }, [])

  const resume = (session) => {
    localStorage.setItem('sc101_session_id', session.id)
    onSession(session)
  }

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

  // Group sessions by username for display
  const grouped = sessions.reduce((acc, s) => {
    ;(acc[s.username] = acc[s.username] || []).push(s)
    return acc
  }, {})

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">SC101</div>
        <h1 className="login-title">Lab Interface</h1>
        <p className="login-subtitle">Interactive tutorials with a live terminal</p>

        {/* New session */}
        <form onSubmit={create} className="login-form">
          <label className="login-label">Your username</label>
          <input
            className="login-input"
            type="text"
            placeholder="e.g. alice"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            disabled={loading}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn-primary" type="submit" disabled={loading || !username.trim()}>
            {loading ? 'Starting…' : 'Start new session'}
          </button>
        </form>

        {/* Existing sessions */}
        {sessions.length > 0 && (
          <div className="login-existing">
            <div className="login-divider"><span>or resume a session</span></div>
            <div className="session-list">
              {Object.entries(grouped).map(([uname, userSessions]) =>
                userSessions.map((s) => (
                  <button key={s.id} className="session-item" onClick={() => resume(s)}>
                    <div className="session-avatar">{uname[0].toUpperCase()}</div>
                    <div className="session-info">
                      <div className="session-username">{uname}</div>
                      <div className="session-meta">
                        Step {s.currentStep + 1} · {s.tutorialId} ·{' '}
                        {new Date(s.lastActiveAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="session-arrow">→</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* TODO: SSO integration */}
        {/* TODO(auth): Replace username-only login with proper SSO (e.g. OIDC/SAML).
            The session.username field maps directly to an SSO identity subject claim. */}
        <p className="login-sso-note">🔒 SSO integration planned — username only for now</p>
      </div>
    </div>
  )
}
