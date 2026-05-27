# SC101 Lab Interface

A KillerCoda-style interactive learning platform with a live terminal powered by LXD.

```
┌─────────────────────────────┬──────────────────────────────┐
│  Tutorial pane              │  Terminal pane               │
│  (Markdown + syntax hl.)    │  (xterm.js → LXD container)  │
│  ▶ Run buttons on code      │                              │
└─────────────────────────────┴──────────────────────────────┘
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 4 |
| Terminal | xterm.js + WebSocket |
| Backend | Node.js + Express + ws |
| PTY bridge | node-pty |
| Emulation | LXD (Ubuntu 24.04 container) |
| Tutorial format | Markdown with `run` code-block tags |

## Prerequisites

- LXD 6+ installed and initialised (`lxd init --auto`)
- Node.js 18+

## Development

### 1. Start the backend (port 3001)

The backend will automatically create and start the `sc101-dev` LXD container on first run.

```bash
npm run dev:backend
```

### 2. Start the frontend dev server (port 5173)

In a second terminal:

```bash
npm run dev:frontend
```

Open **http://localhost:5173** in your browser.

## Production build

```bash
npm run build          # builds frontend to frontend/dist/
npm run dev:backend    # serves API + WebSocket; point a reverse proxy at port 3001
```

## Tutorial authoring

Tutorials live in `backend/tutorials/<id>/`.

```
backend/tutorials/hello-snap/
├── meta.json          ← title, step list
├── 01-intro.md
├── 02-setup.md
└── …
```

### Click-to-execute code blocks

Tag any code block with `run` to add a **▶ Run** button:

````markdown
```bash run
gcc -o hello hello.c
```
````

Clicking the button sends the command directly to the live terminal.

## Included tutorial: hello-snap

A 6-step walkthrough that:
1. Sets up GCC + Snapcraft in the container
2. Writes a C "Hello World" app
3. Defines a strictly-confined `snapcraft.yaml`
4. Builds the snap
5. Installs and tests it

## Phase 2 (planned)

- Ubuntu Core 24 VM via `lxc launch ubuntu-core:24 sc101-core --vm`
- Transfer and test snaps on Ubuntu Core
- Per-session containers for multi-user support
