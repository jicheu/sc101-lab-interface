import { useRef, useCallback, useState, useEffect } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import TutorialPane from './components/TutorialPane/TutorialPane.jsx'
import TerminalPane from './components/TerminalPane/TerminalPane.jsx'
import ThemeToggle from './components/ThemeToggle/ThemeToggle.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  // On mount: try to restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sc101_session_id')
    if (!saved) { setChecking(false); return }
    fetch(`/api/sessions/${saved}`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { setSession(s || null); setChecking(false) })
      .catch(() => setChecking(false))
  }, [])

  const sendCommandRef = useRef(null)

  const registerSendCommand = useCallback((fn) => {
    sendCommandRef.current = fn
  }, [])

  const handleRunCommand = useCallback((command) => {
    sendCommandRef.current?.(command)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('sc101_session_id')
    setSession(null)
  }

  if (checking) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#7a9cc0' }}>
        Restoring session…
      </div>
    )
  }

  if (!session) {
    return <LoginScreen onSession={setSession} />
  }

  return (
    <div className="sc101-app">
      <nav className="sc101-nav">
        <span className="sc101-nav-brand">
          <span className="sc101-nav-logo">SC</span>
          SC101 Lab Interface
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.45)',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              padding: '0.25rem 0.625rem',
            }}
          >
            ⎋ Exit
          </button>
        </div>
      </nav>
      <div className="sc101-body">
        <TutorialPane
          session={session}
          onRunCommand={handleRunCommand}
        />
        <div className="sc101-divider" />
        <TerminalPane session={session} onReady={registerSendCommand} />
      </div>
    </div>
  )
}
