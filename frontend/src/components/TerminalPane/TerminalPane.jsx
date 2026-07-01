import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPane({ session, onReady, onSessionEvent }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const [connected, setConnected] = useState(false)

  useEffect(() => { onReadyRef.current = onReady }, [onReady])

  const [participants, setParticipants] = useState([])
  const [canWrite, setCanWrite] = useState(true)
  const [enablingWrite, setEnablingWrite] = useState(false)
  const [connectionError, setConnectionError] = useState('')

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
    let reconnectTimer = null

    // handleResize is defined once here (not inside connect) so it can be
    // reliably removed in cleanup and not multiply-registered on reconnect.
    const handleResize = () => {
      fitAddon.fit()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const { cols, rows } = term
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
      }
    }
    window.addEventListener('resize', handleResize)

    const connect = () => {
      if (destroyed) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setConnectionError('')
        fitAddon.fit()
        const { cols, rows } = term
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
        term.focus()
        onReadyRef.current?.(sendCommand)
      }

      ws.onmessage = async (e) => {
        // Binary frames (ArrayBuffer or Blob) are always raw terminal data
        if (e.data instanceof ArrayBuffer) {
          term.write(new Uint8Array(e.data))
          return
        }
        if (e.data instanceof Blob) {
          const buf = await e.data.arrayBuffer()
          term.write(new Uint8Array(buf))
          return
        }
        // Text frame — try JSON first (presence/session-event/error), else raw terminal
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'presence') {
            setParticipants(msg.participants || [])
            const self = msg.participants?.find(p => p.username === session.username)
            if (self) setCanWrite(self.canWrite)
          } else if (msg.type === 'session-event') {
            onSessionEvent?.(msg)
          } else if (msg.type === 'error') {
            term.write(`\r\n\x1b[31m[Error: ${msg.message}]\x1b[0m\r\n`)
          } else {
            term.write(e.data)
          }
        } catch {
          // Not JSON — raw terminal text data
          term.write(e.data)
        }
      }

      ws.onclose = (event) => {
        setConnected(false)
        if (event.code === 4001) {
          setConnectionError('Session missing or expired. Please log in again.')
          localStorage.removeItem('sc101_session_id')
          localStorage.removeItem('sc101_is_teacher')
          sessionStorage.removeItem('sc101_teacher_session_id')
          return
        }
        if (event.code === 4002) {
          setConnectionError('Container failed to start. Please retry or recreate the session.')
          return
        }
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()

    // Wire keyboard input from xterm → WebSocket
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }))
      }
    })

    return () => {
      destroyed = true
      clearTimeout(reconnectTimer)
      window.removeEventListener('resize', handleResize)
      const ws = wsRef.current
      if (ws) {
        ws.onclose = null  // prevent reconnect loop on intentional teardown
        ws.close()
        wsRef.current = null
      }
      term.dispose()
    }
  }, [session.id, session.username, onSessionEvent])

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

  const handleDisableWriteMode = async () => {
    if (!isTeacher) return
    setEnablingWrite(true)
    try {
      const result = await fetch(`/api/sessions/${session.id}/participants/${encodeURIComponent(session.username)}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canWrite: false })
      }).then(r => r.json())
      
      if (result.error) {
        alert(`Failed to disable write mode: ${result.error}`)
      }
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

        {connectionError && (
          <div className="sc101-readonly-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span style={{ color: '#f8d7da' }}>⚠️ {connectionError}</span>
          </div>
        )}
        
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

        {isTeacher && canWrite && (
          <div className="sc101-readonly-overlay" style={{ background: 'rgba(0, 128, 0, 0.15)', borderTopColor: '#4caf50', color: '#4caf50' }}>
            <span style={{ marginRight: '0.5rem' }}>👑 Teacher in write mode — </span>
            <button
              onClick={handleDisableWriteMode}
              disabled={enablingWrite}
              className="sc101-enable-write-btn"
              style={{ background: '#4caf50' }}
              title="Return to read-only mode"
            >
              {enablingWrite ? '...' : '👁️ Return to Read-only'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
