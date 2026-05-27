import { useRef, useCallback, useState, useEffect } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import TutorialPane from './components/TutorialPane/TutorialPane.jsx'
import TerminalPane from './components/TerminalPane/TerminalPane.jsx'

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
    <div className="app-layout">
      <TutorialPane
        session={session}
        onRunCommand={handleRunCommand}
        onLogout={handleLogout}
      />
      <TerminalPane session={session} onReady={registerSendCommand} />
    </div>
  )
}
