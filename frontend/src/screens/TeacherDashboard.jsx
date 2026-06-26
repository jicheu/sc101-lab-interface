import { useState, useEffect } from 'react'

export default function TeacherDashboard({ teacherSession, onJoinSession, onLogout }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
    // Refresh every 5 seconds
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = () => {
    fetch('/api/sessions')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        // Filter out the teacher's own session and show only student sessions
        const studentSessions = list.filter(s => 
          s.id !== teacherSession.id && 
          s.username && 
          !s.username.toLowerCase().includes('teacher')
        )
        setSessions(studentSessions)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleJoinSession = async (session) => {
    try {
      // Join the student's session
      const result = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: teacherSession.username, 
          role: 'teacher' 
        })
      }).then(r => r.json())

      if (result.error) {
        alert(`Failed to join: ${result.error}`)
        return
      }

      // Update local session to point to the student's session
      const updatedSession = {
        ...teacherSession,
        ...result.session,
        // Keep teacher's original username and teacher flag
        username: teacherSession.username,
        isTeacher: true
      }
      
      onJoinSession(updatedSession)
    } catch (err) {
      alert(`Error joining session: ${err.message}`)
    }
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="sc101-selector">
      <nav className="sc101-nav">
        <span className="sc101-nav-brand">
          <span className="sc101-nav-logo">
            {teacherSession?.username?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'T'}
          </span>
          SC101 Lab Interface - Teacher Dashboard
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="sc101-nav-text-btn" onClick={onLogout}>⎋ Exit</button>
        </div>
      </nav>

      <div className="sc101-selector-body">
        <div className="sc101-selector-header">
          <h1>Active Student Sessions</h1>
          <p>Welcome, <strong>{teacherSession?.username}</strong>. Click on any session to join and help the student.</p>
        </div>

        {loading && (
          <div className="sc101-selector-empty">Loading sessions...</div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="sc101-selector-empty">
            <p>No active student sessions at the moment.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--sc101-fg-muted)', marginTop: '0.5rem' }}>
              Sessions will appear here when students log in and start working.
            </p>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="sc101-session-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {sessions.map((session) => (
              <div key={session.id} className="sc101-session-item-wrapper">
                <button
                  className="sc101-session-item"
                  onClick={() => handleJoinSession(session)}
                >
                  <div className="sc101-avatar">
                    {session.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="sc101-session-name">
                      {session.username}
                      {session.owner && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--sc101-fg-muted)' }}>(Teaching Session)</span>}
                    </div>
                    <div className="sc101-session-meta">
                      {session.tutorialId ? (
                        <>
                          Tutorial: {session.tutorialId} · Step {session.currentStep + 1}
                        </>
                      ) : (
                        'No tutorial started'
                      )}
                      {' · '}
                      {session.participants?.length > 0 && `${session.participants.length} participant${session.participants.length !== 1 ? 's' : ''} · `}
                      Last active {formatTime(session.lastActiveAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {session.participants?.length > 0 && (
                      <div className="sc101-participants">
                        {session.participants.slice(0, 3).map((p, i) => (
                          <div
                            key={i}
                            className={`sc101-participant-badge sc101-participant-badge--${p.role}`}
                            style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
                            title={p.username}
                          >
                            {p.username[0]?.toUpperCase() || '?'}
                          </div>
                        ))}
                        {session.participants.length > 3 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--sc101-fg-muted)' }}>
                            +{session.participants.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="sc101-session-arrow">Join →</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--sc101-bg-alt)', borderRadius: '8px', maxWidth: '800px', margin: '2rem auto 0' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--sc101-fg)' }}>
            💡 How it works
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--sc101-fg-muted)', lineHeight: 1.6 }}>
            <li>Click on any student session to join their terminal</li>
            <li>You'll see everything they type and all output in real-time</li>
            <li>You can type commands to help guide them</li>
            <li>The student sees you've joined (your avatar appears in the terminal header)</li>
            <li>Click "← Back" to return to this list and join another student</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
