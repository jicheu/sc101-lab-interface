import { useRef, useCallback } from 'react'
import TutorialPane from './components/TutorialPane/TutorialPane.jsx'
import TerminalPane from './components/TerminalPane/TerminalPane.jsx'

export default function App() {
  const sendCommandRef = useRef(null)

  // TerminalPane calls this once the WebSocket is open
  const registerSendCommand = useCallback((fn) => {
    sendCommandRef.current = fn
  }, [])

  // Stable wrapper so TutorialPane never gets a stale reference
  const handleRunCommand = useCallback((command) => {
    sendCommandRef.current?.(command)
  }, [])

  return (
    <div className="app-layout">
      <TutorialPane onRunCommand={handleRunCommand} />
      <TerminalPane onReady={registerSendCommand} />
    </div>
  )
}
