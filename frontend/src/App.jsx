import { useRef, useCallback, useState, useEffect } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import TutorialSelector from './screens/TutorialSelector.jsx'
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

  useEffect(() => {
    const saved = localStorage.getItem('sc101_session_id')
    if (!saved) { setChecking(false); return }
    fetch(`/api/sessions/${saved}`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { setSession(s || null); setChecking(false) })
      .catch(() => setChecking(false))
  }, [])

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

  const handleLogout = () => {
    localStorage.removeItem('sc101_session_id')
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
    const s = await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutorialId: null }),
    }).then((r) => r.json()).catch(() => null)
    if (s) setSession(s)
    setActiveTutorialId(null)
    setLastTutorialId(previousTutorialId)
    setTutorialProgress(null)
  }

  // Find the immediately next tutorial in list order
  const nextTutorial = (() => {
    if (!activeTutorialId || !allTutorials.length) return null
    const idx = allTutorials.findIndex((t) => tutorialKey(t) === activeTutorialId || t.id === activeTutorialId)
    if (idx === -1 || idx >= allTutorials.length - 1) return null
    return allTutorials[idx + 1]
  })()

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

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--sc101-fg-muted)' }}>
        Restoring session…
      </div>
    )
  }

  if (!session) return <LoginScreen onSession={(s) => { setSession(s) }} />

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
            ← Tutorials
          </button>
          <SettingsPanel session={session} tutorialProgress={tutorialProgress} />
          <button onClick={handleLogout} className="sc101-nav-text-btn">⎋ Exit</button>
        </div>
      </nav>
      <div className="sc101-body">
        <TutorialPane
          tutorialId={activeTutorialId}
          session={session}
          onRunCommand={handleRunCommand}
          onProgress={setTutorialProgress}
          nextTutorial={nextTutorial}
          onFinish={handleFinish}
        />
        <div className="sc101-divider" />
        <TerminalPane session={session} onReady={registerSendCommand} />
      </div>
    </div>
  )
}
