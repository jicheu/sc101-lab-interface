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

Tutorials live in `tutorials/<Course>/<id>/`. Each tutorial is a folder containing:

```
tutorials/SC101_Lab_Interface_playground/hello-snap/
├── index.md       ← YAML frontmatter: id, title, description, steps list, environment
├── step1.md
├── step2.md
└── …
```

See [`tutorials/README.md`](tutorials/README.md) for the full format and [`tutorials/INSTRUCTIONS.md`](tutorials/INSTRUCTIONS.md) for authoring rules.

### Click-to-execute code blocks

Tag any code block with `run` to add a **▶ Run** button:

````markdown
```bash run
gcc -o hello hello.c
```
````

Clicking the button sends the command directly to the live terminal.

### Import a tutorial from GitHub

From the gear (⚙) menu → **Import from GitHub**, paste a repository URL and an optional course name. The backend auto-detects the format:

| Format | Detection | Action |
|--------|-----------|--------|
| SC101 native | `index.md` at root | Validate + install as-is |
| KillerCoda (single) | `index.json` at root | Convert + install |
| KillerCoda (multi) | subdirs each with `index.json` | Convert all + install |

## AI-assisted authoring

The repo ships a **`create-lab` Copilot skill** (`.github/skills/create-lab/SKILL.md`) that converts a raw lab file into a complete SC101 tutorial bundle, following `tutorials/INSTRUCTIONS.md`.

- **In VS Code Copilot:** type `/create-lab` or describe the conversion and Copilot picks it up automatically.
- **In Gemini / Claude / other AI clients:** upload `tutorials/INSTRUCTIONS.md` + the `create-lab.md` workflow file to a Gem or Project, then paste your lab file.

The skill handles step splitting, atomicity checks, diff-only file modifications, official-reference enforcement, and `index.md` frontmatter generation.

## Included tutorials

| Course | Tutorial | Steps |
|--------|----------|-------|
| SC101 Lab Interface playground | hello-snap | 6 |
| SC101 Lab Interface playground | snap-confinement | 8 |
| SC101 Lab Interface playground | uc-basic-image / uc-user-assertion / uc-customize-image / uc-gadget-snap / snap-store-upload | skeletons |
