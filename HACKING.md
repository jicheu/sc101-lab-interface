# HACKING

Developer setup and dev-loop for SC101 Lab Interface. Audience: you, future-you,
anyone hacking on the platform locally (not the published snaps).

For running from the published snaps see [INSTALL.md](./INSTALL.md).
For building the snaps see [SNAP_PACKAGING.md](./SNAP_PACKAGING.md).

---

## Prerequisites

### Build tools (required for node-pty)

`node-pty` compiles a native C++ addon. Build tools must be present before
`npm install`:

```bash
sudo apt install -y build-essential python3
```

### LXD 6+

The backend provisions per-user containers via LXD.

```bash
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
newgrp lxd
```

### Node.js LTS (via nvm)

Vite 5+ requires Node 20+. Vite 4 works on Node 18. We ship Vite 4, but any current
LTS works.

```bash
# 1. install nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 2. load nvm into the CURRENT shell (no restart needed)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. install LTS
nvm install --lts
nvm use --lts

# 4. verify
node -v
npm  -v
```

---

## Install

```bash
git clone https://github.com/jicheu/sc101-lab-interface.git
cd sc101-lab-interface
npm --prefix backend  install
npm --prefix backend  rebuild        # compiles the node-pty native addon
npm --prefix frontend install
```

---

## Run

Two processes, two terminals.

### Backend (port 3002 in dev, 3001 under snap)

The backend automatically creates and starts the user's LXD container on first
connect.

```bash
npm run dev:backend
```

### Frontend dev server (port 5173)

```bash
npm run dev:frontend
```

Open **http://localhost:5173** in your browser.

> Note: port 5173 is the Vite dev server only. The snap serves the built frontend
> from the backend on port 3001; there is no 5173 in production.

---

## Production build (from source, without snap)

```bash
npm run build          # builds frontend to frontend/dist/
npm run dev:backend    # serves API + WebSocket; point a reverse proxy at 3001
```

For the packaged distribution path, see [SNAP_PACKAGING.md](./SNAP_PACKAGING.md).

---

## Where things live

```
backend/
  server.js           Express REST + WebSocket upgrade + tutorial resolution
  lxd.js              LXD REST client over unix.socket + PTY over exec WS
  sessions.js         Session CRUD, atomic JSON writes, join/leave/permissions
  data/sessions.json  Runtime session store (dev)
frontend/
  src/
    App.jsx           Login -> Selector -> Tutorial screen flow
    components/
      TerminalPane/   xterm.js + WebSocket + presence + read-only overlay
      TutorialPane/   Markdown render + Prism + Run buttons + step nav
      SettingsPanel/  Gear popover: profile, export, import, prerequisites
      ThemeToggle/    Light/dark/auto
    screens/
      LoginScreen.jsx
      TutorialSelector.jsx
tutorials/            Dev fallback tutorial root; see tutorials/README.md
openspec/
  specs/              Capability specs (source of truth for behavior)
  changes/            Active OpenSpec changes
```

For behavior specs, see:
- `openspec/specs/teaching-sessions/spec.md`
- `openspec/specs/tutorial-format/spec.md`

For tutorial authoring rules (layer on top of the format spec):
- `tutorials/INSTRUCTIONS.md`

---

## Testing recipes

Curl / DevTools recipes for teaching sessions and permission toggling live in
[docs/manual-testing-recipes.md](./docs/manual-testing-recipes.md).

---

## Working with OpenSpec

[OpenSpec](https://opencode.ai/docs) is the project's spec / change-tracking
tool. Behavior specs live under `openspec/specs/`; active changes under
`openspec/changes/`; archived changes under `openspec/changes/archive/`. Every
user-visible change to the platform goes through the propose → apply → archive
cycle, and each archived change gets a corresponding entry in
[`CHANGELOG.md`](./CHANGELOG.md) (per the standing instruction in its
preamble).

This section captures workflow conventions and known quirks specific to how we
use OpenSpec in this project. It exists so future-you (and future
collaborators) don't waste time re-diagnosing things we've already figured out.

### Known quirks

#### `design.md reported 'ready'` warning on `skip_specs: true` changes

At archive time, the archive workflow reports:

> design.md reported 'ready' (not 'done'/'skipped').

**When this happens:** every `skip_specs: true` change that legitimately skips
`design.md`. This is a false positive.

**Why it happens:** the propose skill treats `design.md` as *conditional* —
its own guidance says to write one "only if the change is cross-cutting,
introduces a new dependency, has security/performance/migration complexity, or
has ambiguity that benefits from technical decisions before coding." Small
docs-and-plumbing changes (drift fixes, doc rearrangements, provisioning
scripts) meet none of those criteria, so we deliberately skip design. The
archive workflow doesn't share that context, sees an artifact reading
`ready` instead of `done`/`skipped`, and warns.

**Workaround:** confirm "Proceed" when the warning fires. The omission was
deliberate per the propose skill's conditional-design guidance.

**Signature of the pattern**, so future-you can grep for it:

- `.openspec.yaml` declares `skip_specs: true`
- No `design.md` in the change directory
- `openspec status --change <name>` shows `design: ready`
- `openspec validate <name> --type change --strict` returns clean

The archive workflow will still ask; the answer is always "Proceed" for
`skip_specs: true` changes that never needed a design in the first place.

The real fix is upstream in OpenSpec (e.g. a `skip_design: true` marker in
`.openspec.yaml`, or reconciling propose vs archive guidance). Not pursued
locally.

<!--
When we discover another OpenSpec quirk worth documenting, add another
"#### <short title>" subsection here. Keep them small and focused: what does
it look like, why does it happen, what do we do about it.
-->

---

## Build history

Phase-by-phase build history (kept as an append-only record, "should" also be
current — see the note about drift in `PROJECT_REPORT.md`):

- [`docs/genesis.md`](./docs/genesis.md)
- [`PROJECT_REPORT.md`](./PROJECT_REPORT.md)
