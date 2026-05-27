# genesis.md — SC101 Lab Interface: Complete Build History

> This document records every instruction given during the creation of this project,
> rephrased to avoid the bugs that were encountered along the way.
> It can be replayed from scratch to reproduce the entire application.

---

## Prerequisites

Before starting, ensure the host machine has:

```bash
snap install lxd
lxd init --auto
snap install snapcraft --classic
```

Node.js **v18.x** is required. Vite 5+ requires Node 20+ — use Vite 4.x with Node 18.

---

## Phase 1 — Initial scaffold

**Instruction:**  
Create an interactive web-based application similar to KillerCoda. It is split into two parts:
- **Left side**: tutorial text and commands
- **Right side**: a terminal emulation of the system (using LXD)

The tutorial panel must support:
- Multiple pages/steps
- Code highlighting with Prism.js
- A ▶ Run button that appears on hover over code blocks and executes the command in the terminal

The terminal panel must run an Ubuntu 24.04 LXD container per user.

For the initial development phase, create a tutorial to write a "Hello World" C application and package it as a strictly-confined snap.

**Stack:**
- Frontend: React + Vite 4.x (use `npm create vite@4` — Vite 5 requires Node 20+)
- Backend: Node.js + Express + WebSocket + `node-pty`
- Container bridge: `lxc exec <container> -- bash --login` via `node-pty`

**Known pitfalls to avoid:**
- Do **not** wrap the React app in `<React.StrictMode>` — it mounts components twice in dev, creating two WebSocket connections and two PTY shells, causing the terminal to stall after one keypress
- When checking WebSocket ready state, use `WebSocket.OPEN` (the static class constant) **not** `ws.OPEN` on an instance — the instance property is `undefined`
- `marked` v12 API: use `marked.use({ breaks: true })` not `marked.setOptions()`, and import `Renderer` as a named export
- Call `onReady(sendCommand)` **inside** `ws.onopen`, not at mount time — the callback fires before the connection is open otherwise
- Use `lxc stop --force <name>` — without `--force`, the stop command hangs on running containers

**Commit:** `initial revision`

---

## Phase 2 — Session persistence and per-user containers

**Instruction:**  
Make sessions persistent. If a user disconnects or reloads, they can resume from where they left off.

Requirements:
- A login screen where users can pick an existing session or create a new one. Username is sufficient for now. Add a `TODO` comment for later SSO integration.
- Every user gets their own LXD container (`sc101-<username>`).
- Containers that are not in use must be stopped to avoid draining resources.

**Implementation notes:**
- Session store: JSON file at `backend/data/sessions.json` (flat object keyed by session ID)
- Container naming: `sc101-<sanitized-username>` — lowercase alphanumeric + hyphens, max 63 chars
- Idle stop: track active WebSocket connections per container; stop after 60 s of zero connections
- Stop all `sc101-*` containers at backend startup (use `--force` flag)
- Restore session from `localStorage` on page load
- `PATCH /api/sessions/:id` endpoint to persist `currentStep`
- WebSocket URL includes session ID as query param: `ws://host/ws/terminal?session=<id>`

**Commit:** `Add session persistence, per-user LXD containers, and login screen`

---

## Phase 3 — Canonical design system and theming

**Instruction:**  
Change the UI to comply with [Canonical design](https://canonical.design/).  
The login screen must offer two options: create a new user or re-use an existing one (tabs).  
The interface must offer Light / Dark / Auto mode.

**Implementation notes:**
- The `vanilla-framework` npm package ships SCSS only, **not** pre-built CSS. Load it from the Ubuntu assets CDN instead:
  ```html
  <link rel="stylesheet" href="https://assets.ubuntu.com/v1/vanilla-framework-version-4.51.0.min.css" />
  ```
- Add Ubuntu and Ubuntu Mono fonts via Google Fonts in `index.html`
- Use `--sc101-*` CSS custom properties (not Vanilla's own `--vf-*`) for your own custom components, so the Vanilla base doesn't interfere
- Theme switching: write a `ThemeContext` + `ThemeToggle` component; toggle by setting `is-dark` / `is-light` class on `document.body`
- Auto mode: use `window.matchMedia('(prefers-color-scheme: dark)')` with an event listener

**Commit:** `Apply Canonical Vanilla design and light/dark/auto theme`

---

## Phase 4 — Fix session creation error

**Instruction (rephrased to avoid the bug):**  
When creating a session, the frontend was getting "Failed to execute 'json' on 'Response': Unexpected end of JSON input".

Root cause: the backend was sending response headers before `lxc export` completed, producing an empty body. The fix is:
- In the `POST /api/sessions` handler, wrap the entire body in a `try/catch` and always respond with `res.status(201).json(session)` or `res.status(500).json({ error: ... })`
- In the frontend, always wrap `res.json()` in its own `try/catch` because an empty body throws even on an `ok` response

**Commit:** `Fix session creation JSON error`

---

## Phase 5 — Gear settings panel

**Instruction:**  
Add a gear (⚙) button visible on every page that opens a panel containing:
- Username
- Tutorial name and progress
- Option to download the LXC image
- Light / Dark mode switcher

**Implementation notes:**
- Backend endpoint: `GET /api/sessions/:id/export` — runs `lxc export --instance-only <container> -` and pipes the stdout to the HTTP response. The `--instance-only` flag is **required** — without it `lxc export` requires the container to be stopped first.
- Frontend: `fetch()` the export endpoint → create a `Blob` → trigger download via a temporary `<a>` element
- Show a status message with the download size read from the `Content-Length` response header so the user knows the download started

**Commit:** `design update & portal version 0`

---

## Phase 6 — TODO.md

**Instruction:**  
Create a `TODO.md` file with the following items:
- SSO integration
- Pre-install required host tools (snapcraft, lxd, etc.)
- Launch of Ubuntu Core image
- Connect to it and install snap

**Commit:** `Add TODO.md with SSO, infra prerequisites, and Ubuntu Core tasks`

---

## Phase 7 — Tutorial folder structure redesign

**Instruction:**  
Tutorials must be based on Markdown files. Create a `tutorials/` folder at the project root so contributors can add them manually. Each tutorial lives in its own subfolder.

The format should closely follow KillerCoda. Each tutorial folder must contain:
- `index.md` — YAML frontmatter with `id`, `title`, `description`, `difficulty`, `time`, `tags`, `environment` (LXD image + prestart commands), and `steps` (list of `{title, file}` pairs)
- `stepN.md` files — YAML frontmatter with `title` only; body is pure Markdown

The backend must use `gray-matter` to parse frontmatter. `GET /api/tutorials` reads all subdirectories and returns the list. `GET /api/tutorials/:id/step/:index` returns the step body (frontmatter stripped).

Also add a `tutorials/README.md` contributor guide.

**Migrate the existing "hello-snap" tutorial to this format (6 steps).**

**Commit:** `Move tutorials to top-level tutorials/ folder with frontmatter format`

---

## Phase 8 — "Understanding what confinement means" tutorial

**Instruction:**  
Create a second tutorial named **"Understanding what confinement means"**.  
The student is an experienced Ubuntu developer but has no prior knowledge of snaps or confinement.

**Steps:**

### Step 1 — Introduction
Explain what the student will build and why confinement matters for Ubuntu Core.

### Step 2 — Build the inspire app
The application asks for a filename and writes a random inspirational message to it.  
Fetch the message from **https://zenquotes.io/api/random** (free API, no auth required, returns `[{"q":"...","a":"..."}]`).  
The app is written in C and uses libcurl for the HTTPS request.

### Step 3 — Package as a devmode snap (unconfined)
Package the app with `confinement: devmode` and `grade: devel`. Everything must work.  
Include `stage-packages: [libcurl4]` to bundle the runtime library inside the snap.  
Build with `snapcraft --destructive-mode`. Install with `snap install --devmode`.

### Step 4 — Switch to strict confinement
Change `confinement: strict` and `grade: stable`. Rebuild and install with `--dangerous`.  
The student deliberately encounters two failures:
1. Network blocked → add `plugs: [network]`
2. Home directory blocked → add `plugs: [home]`, then `snap connect inspire:home :home`

When **modifying** `snapcraft.yaml` (a file created in a previous step), **show a diff and apply with `sed`** rather than overwriting the file. This lets the student see exactly what changed.

**Add `requires: [hello-snap]` to the tutorial's `index.md` to declare the dependency.**

**Commit:** `Add 'Understanding what confinement means' tutorial`

---

## Phase 9 — Tutorial authoring instructions

**Instruction:**  
Create a `tutorials/INSTRUCTIONS.md` file that defines the rules for authoring tutorials.  
This file must be used whenever a new tutorial is created.

Rules:
1. All instructions must be referenced with official documentation from `canonical.com`, `snapcraft.io`, or `ubuntu.com` only
2. Verify that every command is available on a stock Ubuntu 24.04 image; explicitly install tools before using them
3. When modifying a previously created file, **show a diff and use `sed`/`patch`** — never silently overwrite
4. Introduce concepts (confinement, interfaces, plugs) with a callout block and official documentation link on first use
5. Each step must be **atomic** with this structure: Objective → Install required tools → Instructions → What we learned → What's next. If a step is not atomic, split it and say so.

**Commit:** `Add tutorial authoring instructions (INSTRUCTIONS.md)`

---

## Phase 10 — Tutorial selector screen

**Instruction:**  
Create an intermediate page that lists all available tutorials. It must:
- Read tutorials from the `tutorials/` folder via the API
- Validate each tutorial's syntax (frontmatter, required fields, step files exist); highlight broken tutorials with an expandable error list
- Track progress per tutorial (not started / in progress / completed)
- Show dependency relationships between tutorials (e.g. snap-confinement requires hello-snap), with a visual indicator of whether prerequisites are met
- The flow after login is: **Login → Tutorial Selector → Tutorial view**

**Implementation notes:**
- Add `GET /api/tutorials/:id/validate` endpoint to the backend. Wrap it and `listTutorials()` in try/catch — a single broken tutorial must not crash the entire endpoint
- Update `PATCH /api/sessions/:id` to accept `tutorialId`, `totalSteps`, and `status`
- After login or session restore, **always** land on the tutorial selector — do not skip it even if the session has a saved `tutorialId` (that caused a regression where the selector was bypassed)
- Add a "← Tutorials" back button in the tutorial view nav

**Commit:** `Add tutorial selector with progress tracking, validation, and dependency indicators`

---

## Phase 11 — Apply authoring standards to existing tutorials

**Instruction:**  
Apply the rules from `tutorials/INSTRUCTIONS.md` to the two existing tutorials. Every step must have:
- Concept callout blocks with official links (first occurrence of snap, confinement, Ubuntu Core, Snapcraft, interfaces, plugs & slots, `network` and `home` interfaces)
- Explicit `## Install required tools` sections with verification commands
- `## Objective`, `## What we learned`, `## What's next` sections
- In `snap-confinement/step4.md`: replace the two `cat > file << EOF` overwrites with diff blocks + `sed` commands (Rule 3 compliance)

**Commit:** `Apply tutorial authoring standards to all existing tutorials`

---

## Phase 12 — Bug fix: tutorial selector regression after login

**Instruction (rephrased to document the root cause):**  
After login or session restore, the app was skipping the tutorial selector and going directly to the tutorial view when the session had a saved `tutorialId`.

Root cause: `App.jsx` read `s.tutorialId` from the restored session and immediately set `activeTutorialId`, bypassing the selector.

Fix: never set `activeTutorialId` from the session restore or login path. The selector is always shown first — progress is displayed on the cards, and the student clicks Start/Resume to enter a tutorial.

**Commit:** `Fix: always show tutorial selector after login/session restore`

---

## Phase 13 — Bug fix: empty tutorial page + sections + progress + delete account

**Instruction:**  
Fix the tutorial selector showing "no tutorials found" even when tutorials exist.

Root cause: any exception thrown inside `loadTutorialMeta` (e.g. a YAML parse error in a single tutorial) bubbled up and crashed `GET /api/tutorials`, returning an HTML error page. The frontend called `.json()` on the HTML and received an empty array.

Fix:
- Wrap `loadTutorialMeta` and `listTutorials` in try/catch — log the error and return `null` / `[]` instead of throwing
- Return `res.status(500).json({ error: '...' })` so the frontend gets valid JSON on failure
- In `TutorialSelector`, distinguish between a fetch error (backend down) and an empty list, and show an appropriate message in each case

**Additional improvements in the same commit:**

### Delete account
- Add `DELETE /api/sessions/:id` endpoint: removes the session record **and** destroys the LXD container (`lxc stop --force` + `lxc delete`)
- Add a 🗑 delete button per session row on the login screen with a confirmation dialog

### Section grouping
- Add a `section` field to tutorial `index.md` files
- Group tutorial cards under section headings in the selector

### Progress percentages at all levels
- **Global**: total completed / total tutorials, progress bar in selector header
- **Per section**: completed within section, bar next to section heading
- **Per tutorial**: bar already existed; now shows % label

**Commit:** `Fix tutorials loading, add sections/progress, delete account, todo update`

---

## Current project structure

```
sc101-lab-interface/
├── backend/
│   ├── data/sessions.json        # Runtime session store
│   ├── lxd.js                    # Container lifecycle + destroyContainer
│   ├── server.js                 # Express REST API + WebSocket PTY bridge
│   └── sessions.js               # Session CRUD (list/get/create/update/remove)
├── frontend/
│   ├── index.html                # Vanilla CSS CDN link, Ubuntu fonts
│   └── src/
│       ├── App.jsx               # Screen flow: checking → login → selector → tutorial
│       ├── main.jsx              # Entry point (no StrictMode)
│       ├── index.css             # --sc101-* custom properties, all custom styles
│       ├── components/
│       │   ├── SettingsPanel/    # Gear popover: username, progress, download, theme
│       │   ├── TerminalPane/     # xterm.js + WebSocket + node-pty bridge
│       │   ├── ThemeToggle/      # ThemeContext + ThemeToggle (light/dark/auto)
│       │   └── TutorialPane/     # Markdown renderer, Prism.js, step navigation, run buttons
│       └── screens/
│           ├── LoginScreen.jsx   # Tabbed new/resume + delete account
│           └── TutorialSelector.jsx  # Card grid with sections, progress, dependencies
├── tutorials/
│   ├── INSTRUCTIONS.md           # Authoring rules for new tutorials
│   ├── README.md                 # Contributor guide
│   ├── hello-snap/               # Tutorial 1: Hello Snap (6 steps)
│   └── snap-confinement/         # Tutorial 2: Confinement (4 steps, requires hello-snap)
├── TODO.md
├── package.json
└── genesis.md                    # This file
```

---

## Key technical decisions and pitfalls

| Issue | Root cause | Fix |
|-------|-----------|-----|
| Terminal stalls after 1 keypress | React StrictMode double-mounts | Remove `<StrictMode>` from `main.jsx` |
| PTY output silently dropped | `ws.OPEN` on instance is `undefined` | Use static `WebSocket.OPEN` |
| `onReady` callback never fires | Called at mount before WS opens | Call inside `ws.onopen` |
| `lxc stop` hangs | No `--force` flag | Always use `lxc stop --force <name>` |
| Session creation JSON error | Backend sent empty body; `.json()` throws | Wrap entire handler in try/catch; always send JSON |
| Tutorial selector bypass | `activeTutorialId` set from restored session | Never skip selector on restore/login |
| Empty tutorial selector | Exception in one tutorial crashes whole list | Wrap `loadTutorialMeta` in try/catch |
| `lxc export` requires stopped container | Missing `--instance-only` flag | Always use `lxc export --instance-only` |
| Vanilla CSS not in npm package | Package ships SCSS only, no pre-built CSS | Load from Ubuntu assets CDN |
| File modification visibility | Overwriting files loses diff context | Use diff blocks + `sed` (INSTRUCTIONS.md Rule 3) |

---

## TODO (open items)

- [ ] SSO integration (replace username-only login)
- [ ] Pre-install script for host prerequisites
- [ ] Ubuntu Core container launch + snap install on it
- [ ] Live container status indicator in terminal header
- [ ] Rate-limit session creation
- [ ] HTTPS / reverse proxy
- [ ] Session expiry + auto-cleanup
- [ ] Mobile responsive layout
- [ ] **Award page** — certificate download when all tutorials are completed
