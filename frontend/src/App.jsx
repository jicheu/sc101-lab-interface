import { useRef, useCallback, useState, useEffect } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import TutorialSelector from './screens/TutorialSelector.jsx'
import TeacherDashboard from './screens/TeacherDashboard.jsx'
import TutorialPane from './components/TutorialPane/TutorialPane.jsx'
import TerminalPane from './components/TerminalPane/TerminalPane.jsx'
import SettingsPanel from './components/SettingsPanel/SettingsPanel.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [activeTutorialId, setActiveTutorialId] = useState(null)
  const [lastTutorialId, setLastTutorialId] = useState(null)
  const [tutorialProgress, setTutorialProgress] = useState(null)
  const [allTutorials, setAllTutorials] = useState([])
  const [studentLeftModal, setStudentLeftModal] = useState(false)    // teacher notification
  const [teacherNotice, setTeacherNotice] = useState(null)            // { type: 'joined'|'left', username }

  useEffect(() => {
    const saved = localStorage.getItem('sc101_session_id')
    const wasTeacher = localStorage.getItem('sc101_is_teacher') === '1'
    if (!saved) { setChecking(false); return }
    fetch(`/api/sessions/${saved}`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => {
        if (s && wasTeacher) s.isTeacher = true
        setSession(s || null)
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [])

  // Update page title based on teacher mode
  useEffect(() => {
    if (session?.isTeacher) {
      document.title = '👑 Teacher - SC101 Lab Interface'
    } else {
      document.title = 'SC101 Lab Interface'
    }
  }, [session?.isTeacher])

  // When teacher is in a shared session, poll the student's session.
  // If the student leaves (tutorialId → null), prompt the teacher.
  useEffect(() => {
    if (!session?.isTeacher || !activeTutorialId) return
    const studentSessionId = session.id
    const interval = setInterval(async () => {
      try {
        const s = await fetch(`/api/sessions/${studentSessionId}`).then(r => r.ok ? r.json() : null)
        if (s && !s.tutorialId) {
          clearInterval(interval)
          setStudentLeftModal(true)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [session?.isTeacher, session?.id, activeTutorialId])

  // Keep a flat tutorial list so we can find the next tutorial
  useEffect(() => {
    fetch('/api/tutorials')
      .then((r) => r.ok ? r.json() : [])
      .then((list) => Array.isArray(list) ? setAllTutorials(list) : setAllTutorials([]))
      .catch(() => {})
  }, [])

  const sendCommandRef = useRef(null)
  const registerSendCommand = useCallback((fn) => { sendCommandRef.current = fn }, [])
  const handleRunCommand = useCallback((command) => { sendCommandRef.current?.(command) }, [])
  const tutorialKey = (t) => t?.uid ?? t?.id

  const handleLogout = async () => {
    // If this is a regular student (not teacher), nullify tutorialId on the backend
    // so any teacher watching knows the student left.
    if (session && !session.isTeacher) {
      fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId: null }),
      }).catch(() => {})
    }
    // If teacher in a shared session, leave gracefully
    if (session?.isTeacher && activeTutorialId) {
      fetch(`/api/sessions/${session.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: session.username }),
      }).catch(() => {})
    }
    localStorage.removeItem('sc101_session_id')
    localStorage.removeItem('sc101_is_teacher')
    sessionStorage.removeItem('sc101_teacher_session_id')
    setSession(null)
    setActiveTutorialId(null)
    setLastTutorialId(null)
    setTutorialProgress(null)
  }

  const handleTutorialSelect = (updatedSession) => {
    setSession(updatedSession)
    setActiveTutorialId(updatedSession.tutorialId)
    setLastTutorialId(updatedSession.tutorialId)
  }

  const handleBackToSelector = async () => {
    const previousTutorialId = activeTutorialId || session.tutorialId

    if (session?.isTeacher) {
      // Remove teacher from the student's participants list
      await fetch(`/api/sessions/${session.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: session.username }),
      }).catch(() => {})

      const teacherId = sessionStorage.getItem('sc101_teacher_session_id')
      if (teacherId) {
        localStorage.setItem('sc101_session_id', teacherId)
        localStorage.setItem('sc101_is_teacher', '1')
        sessionStorage.removeItem('sc101_teacher_session_id')
        const ts = await fetch(`/api/sessions/${teacherId}`).then(r => r.ok ? r.json() : null)
        if (ts) {
          ts.isTeacher = true
          setSession(ts)
        }
      }
    } else {
      const s = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId: null }),
      }).then((r) => r.json()).catch(() => null)
      if (s) setSession(s)
    }
    setActiveTutorialId(null)
    setLastTutorialId(previousTutorialId === '__teacher_view__' ? null : previousTutorialId)
    setTutorialProgress(null)
    setTeacherNotice(null)
  }

  // Find the immediately next tutorial in list order
  const nextTutorial = (() => {
    if (!activeTutorialId || !allTutorials.length) return null
    const idx = allTutorials.findIndex((t) => tutorialKey(t) === activeTutorialId || t.id === activeTutorialId)
    if (idx === -1 || idx >= allTutorials.length - 1) return null
    return allTutorials[idx + 1]
  })()

  const handleTeacherStay = () => {
    // Dismiss the notification — teacher stays in view (student may come back)
    setStudentLeftModal(false)
  }

  const handleTeacherLeave = () => {
    setStudentLeftModal(false)
    handleBackToSelector()
  }

  const handleFinish = async (goNext) => {
    if (goNext && nextTutorial) {
      const s = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId: tutorialKey(nextTutorial), currentStep: 0 }),
      }).then((r) => r.json()).catch(() => null)
      if (s) setSession(s)
      setActiveTutorialId(tutorialKey(nextTutorial))
      setLastTutorialId(tutorialKey(nextTutorial))
      setTutorialProgress(null)
    } else {
      handleBackToSelector()
    }
  }

  // Handle real-time session events from terminal WebSocket
  const handleSessionEvent = useCallback((evt) => {
    if (!evt?.event) return
    if (evt.event === 'student-left' && session?.isTeacher) {
      setStudentLeftModal(true)
    }
    if (!session?.isTeacher) {
      if (evt.event === 'teacher-joined' || evt.event === 'teacher-left') {
        const notice = {
          type: evt.event === 'teacher-joined' ? 'joined' : 'left',
          username: evt.username || evt.usernames?.[0],
        }
        setTeacherNotice(notice)
        clearTimeout(window._teacherNoticeTimer)
        window._teacherNoticeTimer = setTimeout(() => setTeacherNotice(null), 5000)
      }
    }
  }, [session?.isTeacher])

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--sc101-fg-muted)' }}>
        Restoring session…
      </div>
    )
  }

  if (!session) return <LoginScreen onSession={(s) => { setSession(s) }} />

  // Teacher mode: Show dashboard unless actively joined into a student session
  // (tracked via sessionStorage teacher_session_id being set)
  const teacherIsJoined = session.isTeacher && !!sessionStorage.getItem('sc101_teacher_session_id')
  if (session.isTeacher && !teacherIsJoined) {
    return (
      <TeacherDashboard
        teacherSession={session}
        onJoinSession={(joinedSession) => {
          setSession(joinedSession)
          setActiveTutorialId(joinedSession.tutorialId || '__teacher_view__')
        }}
        onLogout={handleLogout}
      />
    )
  }

  // If teacher joined but student has no active tutorial yet, show a waiting screen
  if (session.isTeacher && teacherIsJoined && !activeTutorialId) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:'1rem', color:'var(--sc101-fg-muted)' }}>
        <span style={{ fontSize:'2rem' }}>⏳</span>
        <p>Waiting for the student to start a tutorial…</p>
        <button className="sc101-nav-text-btn" onClick={handleBackToSelector}>← Back to student list</button>
      </div>
    )
  }

  // Regular student mode: Show tutorial selector
  if (!activeTutorialId) {
    return (
      <TutorialSelector
        session={session}
        onSelect={handleTutorialSelect}
        onLogout={handleLogout}
        activeTutorialId={lastTutorialId}
      />
    )
  }

  return (
    <div className="sc101-app">
      <nav className="sc101-nav">
        <span className="sc101-nav-brand">
          <span className="sc101-nav-logo">{session?.username?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'}</span>
          SC101 Lab Interface
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          <button onClick={handleBackToSelector} className="sc101-nav-text-btn">
            {session.isTeacher ? '← Back' : '← Tutorials'}
          </button>
          <SettingsPanel session={session} tutorialProgress={tutorialProgress} />
          <button
            onClick={session.isTeacher ? handleBackToSelector : handleLogout}
            className="sc101-nav-text-btn"
          >
            ⎋ Exit
          </button>
        </div>
      </nav>
      <div className="sc101-body">
        <TutorialPane
          tutorialId={activeTutorialId === '__teacher_view__' ? null : activeTutorialId}
          session={session}
          onRunCommand={handleRunCommand}
          onProgress={setTutorialProgress}
          nextTutorial={nextTutorial}
          onFinish={handleFinish}
        />
        <div className="sc101-divider" />
        <TerminalPane session={session} onReady={registerSendCommand} onSessionEvent={handleSessionEvent} />
      </div>

      {/* Student notification: teacher joined or left — toast at top-right */}
      {!session.isTeacher && teacherNotice && (
        <div className={`sc101-toast sc101-toast--${teacherNotice.type === 'joined' ? 'info' : 'warn'}`}>
          <span className="sc101-toast-icon">{teacherNotice.type === 'joined' ? '👑' : '👋'}</span>
          <span className="sc101-toast-msg">
            {teacherNotice.type === 'joined'
              ? <><strong>{teacherNotice.username}</strong> is now watching your session.</>  
              : <><strong>{teacherNotice.username || 'Teacher'}</strong> has left the session.</>}
          </span>
          <button className="sc101-toast-close" onClick={() => setTeacherNotice(null)}>✕</button>
        </div>
      )}

      {/* Teacher notification: student left the shared session */}
      {studentLeftModal && (
        <div className="sc101-student-left-backdrop">
          <div className="sc101-student-left-modal">
            <div className="sc101-student-left-icon">👋</div>
            <h2>Student left the session</h2>
            <p>
              <strong>{session?.owner?.username ?? 'The student'}</strong> has left this tutorial.
              Would you like to go back to the student list?
            </p>
            <div className="sc101-student-left-actions">
              <button className="p-button--positive" onClick={handleTeacherLeave}>
                ← Back to student list
              </button>
              <button className="p-button" onClick={handleTeacherStay}>
                Stay in session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
