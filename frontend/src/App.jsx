import { useRef, useCallback, useState, useEffect } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import TutorialPane from './components/TutorialPane/TutorialPane.jsx'
import TerminalPane from './components/TerminalPane/TerminalPane.jsx'
import SettingsPanel from './components/SettingsPanel/SettingsPanel.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  // { step: number, meta: object|null }
  const [tutorialProgress, setTutorialProgress] = useState(null)

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
    setTutorialProgress(null)
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--sc101-fg-muted)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsPanel session={session} tutorialProgress={tutorialProgress} />
          <button
            onClick={handleLogout}
            className="sc101-nav-text-btn"
            title="Back to session list"
          >
            ⎋ Exit
          </button>
        </div>
      </nav>
      <div className="sc101-body">
        <TutorialPane
          session={session}
          onRunCommand={handleRunCommand}
          onProgress={setTutorialProgress}
        />
        <div className="sc101-divider" />
        <TerminalPane session={session} onReady={registerSendCommand} />
      </div>
    </div>
  )
}
