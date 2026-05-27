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

  useEffect(() => {
    const wsUrl = `ws://${window.location.host}/ws/terminal?session=${session.id}`

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

      ws.onmessage = (e) => term.write(e.data)

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

  return (
    <div className="sc101-terminal-pane">
      <div className="sc101-terminal-header">
        <span className="sc101-terminal-title">
          <span className={`sc101-status-dot${connected ? ' is-connected' : ''}`} />
          {session.containerName}
        </span>
        <span style={{ color: '#888', fontSize: '0.75rem' }}>
          {connected ? 'connected' : 'connecting…'}
        </span>
      </div>
      <div
        className="sc101-terminal-viewport"
        ref={containerRef}
        onClick={() => termRef.current?.focus()}
      />
    </div>
  )
}
