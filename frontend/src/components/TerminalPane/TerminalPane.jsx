import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const WS_URL = `ws://${window.location.host}/ws/terminal`

export default function TerminalPane({ onReady }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const fitRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const [connected, setConnected] = useState(false)

  // Keep onReadyRef current without re-running the effect
  useEffect(() => { onReadyRef.current = onReady }, [onReady])

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0d0d0d',
        foreground: '#c8d6e5',
        cursor: '#e94560',
        selectionBackground: '#1e3a5f',
        black: '#0d0d0d',
        brightBlack: '#555',
        red: '#e94560',
        brightRed: '#ff6b81',
        green: '#4caf50',
        brightGreen: '#5ddf5f',
        yellow: '#f0c040',
        brightYellow: '#ffd32a',
        blue: '#54a0ff',
        brightBlue: '#74b9ff',
        magenta: '#a29bfe',
        brightMagenta: '#c4bbfe',
        cyan: '#00cec9',
        brightCyan: '#55efc4',
        white: '#dfe6e9',
        brightWhite: '#fff',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()
    termRef.current = term
    fitRef.current = fitAddon

    // The send function — stable reference, always uses latest wsRef
    const sendCommand = (command) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data: command + '\r' }))
      }
    }

    let destroyed = false

    const connect = () => {
      if (destroyed) return
      const ws = new WebSocket(WS_URL)
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
        term.write(e.data)
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
  }, [])

  return (
    <div className="terminal-pane">
      <div className="terminal-header">
        <span className="dot dot-red" />
        <span className="dot dot-yellow" />
        <span className="dot dot-green" />
        <span style={{ marginLeft: 8 }}>sc101-dev</span>
        <span className={`terminal-status ${connected ? '' : 'disconnected'}`}>
          {connected ? '● connected' : '○ connecting…'}
        </span>
      </div>
      <div
        className="terminal-body"
        ref={containerRef}
        onClick={() => termRef.current?.focus()}
      />
    </div>
  )
}
