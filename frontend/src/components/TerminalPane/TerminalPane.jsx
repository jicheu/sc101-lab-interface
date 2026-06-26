import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPane({ session, onReady }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const [connected, setConnected] = useState(false)

  useEffect(() => { onReadyRef.current = onReady }, [onReady])

  const [participants, setParticipants] = useState([])
  const [canWrite, setCanWrite] = useState(true)
  const [enablingWrite, setEnablingWrite] = useState(false)

  useEffect(() => {
    const wsUrl = `ws://${window.location.host}/ws/terminal?session=${session.id}&username=${encodeURIComponent(session.username)}`

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1a1a1a', foreground: '#f8f8f2', cursor: '#e95420',
        selectionBackground: '#444', black: '#1a1a1a', brightBlack: '#555',
        red: '#c7162b', brightRed: '#e95420', green: '#0e8420', brightGreen: '#5ddf5f',
        yellow: '#f0c040', brightYellow: '#ffd32a', blue: '#0066cc', brightBlue: '#74b9ff',
        magenta: '#a29bfe', brightMagenta: '#c4bbfe', cyan: '#00cec9', brightCyan: '#55efc4',
        white: '#dfe6e9', brightWhite: '#ffffff',
      },
      fontFamily: "'Ubuntu Mono', 'Courier New', monospace",
      fontSize: 13, lineHeight: 1.4, scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()
    termRef.current = term

    const sendCommand = (command) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data: command + '\r' }))
      }
    }

    let destroyed = false

    const connect = () => {
      if (destroyed) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        fitAddon.fit()
        const { cols, rows } = term
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
        term.focus()
        onReadyRef.current?.(sendCommand)
      }

      ws.onmessage = (e) => {
        // Try to parse as JSON first (for presence/error messages)
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'presence') {
            setParticipants(msg.participants || [])
            // Update own write permission
            const self = msg.participants?.find(p => p.username === session.username)
            if (self) setCanWrite(self.canWrite)
          } else if (msg.type === 'error') {
            // Show error notification in terminal
            term.write(`\r\n\x1b[31m[Error: ${msg.message}]\x1b[0m\r\n`)
          }
        } catch {
          // Not JSON - it's raw terminal data
          term.write(e.data)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!destroyed) {
          term.writeln('\r\n\x1b[31m[disconnected — retrying in 3s…]\x1b[0m')
          setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()

    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }))
      }
    })

    const handleResize = () => {
      fitAddon.fit()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const { cols, rows } = term
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      destroyed = true
      window.removeEventListener('resize', handleResize)
      wsRef.current?.close()
      term.dispose()
    }
  }, [session.id])

  const isOwner = session.owner?.username === session.username
  const ownerName = session.owner?.username || session.username
  
  // Check if current user is a teacher (not owner)
  const self = participants.find(p => p.username === session.username)
  const isTeacher = self?.role === 'teacher' && !isOwner

  const handleEnableWriteMode = async () => {
    if (!isTeacher) return
    setEnablingWrite(true)
    try {
      const result = await fetch(`/api/sessions/${session.id}/participants/${encodeURIComponent(session.username)}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canWrite: true })
      }).then(r => r.json())
      
      if (result.error) {
        alert(`Failed to enable write mode: ${result.error}`)
      }
      // Permission update will come through WebSocket presence message
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setEnablingWrite(false)
    }
  }

  return (
    <div className="sc101-terminal-pane">
      <div className="sc101-terminal-header">
        <span className="sc101-terminal-title">
          <span className={`sc101-status-dot${connected ? ' is-connected' : ''}`} />
          {session.containerName}
          {!canWrite && <span className="sc101-readonly-badge">Read-only</span>}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Presence indicators */}
          {participants.length > 0 && (
            <div className="sc101-participants">
              {participants.map((p, i) => (
                <div
                  key={i}
                  className={`sc101-participant-badge sc101-participant-badge--${p.role}`}
                  title={`${p.username} (${p.role})${p.canWrite ? ' - can type' : ' - viewing'}`}
                >
                  {p.username[0]?.toUpperCase() || '?'}
                  {p.role === 'teacher' && <span className="sc101-crown">👑</span>}
                </div>
              ))}
            </div>
          )}
          
          <span style={{ color: '#888', fontSize: '0.75rem' }}>
            {connected ? 'connected' : 'connecting…'}
          </span>
        </div>
      </div>
      
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          className="sc101-terminal-viewport"
          ref={containerRef}
          onClick={() => termRef.current?.focus()}
        />
        
        {!canWrite && (
          <div className="sc101-readonly-overlay">
            {isTeacher ? (
              <>
                <span>👑 Teacher observing — </span>
                <button
                  onClick={handleEnableWriteMode}
                  disabled={enablingWrite}
                  className="sc101-enable-write-btn"
                  title="Enable typing to help the student"
                >
                  {enablingWrite ? 'Enabling...' : '✏️ Enable Write Mode'}
                </button>
              </>
            ) : (
              <>👁️ View-only mode — {ownerName} is controlling the terminal</>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
