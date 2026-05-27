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

## Phase 14 — Tutorial skeleton sections

**Instruction:**  
Create a section called "Creating Ubuntu Core image" with four tutorials (skeleton only, no content yet):
1. Create a basic image (no dependencies)
2. Add a user assertion to connect to the image (requires: tutorial 1)
3. Customize the image to add your snaps (requires: tutorial 1, not 2)
4. How to upload a snap to the store (no dependencies — placed in a new "Publishing Snaps" section)

Add the four content-writing tasks to the TODO list.

**Implementation notes:**
- Each tutorial gets an `index.md` with correct frontmatter (`section`, `requires`, `difficulty`, `tags`) and 5 placeholder `stepN.md` files showing "⚠️ Coming soon"
- The `section` field in `index.md` is what the selector uses to group tutorials — the field name must match exactly across tutorials in the same group

**Commit:** `Add 4 tutorial skeletons (2 new sections, placeholder content)`

---

## Phase 15 — Bug fix: tutorial step navigation doesn't scroll to top

**Instruction (with root cause):**  
When clicking Next/Previous in the tutorial panel, the content area remained scrolled to the bottom of the previous step.

Root cause: the tutorial content `<div>` is a scrollable overflow container. Changing `stepIndex` re-renders the content but does not reset the scroll position of the container — the browser has no way to know the content was "replaced".

Fix: attach a `useRef` to the content `<div>` and call `contentRef.current.scrollTo({ top: 0, behavior: 'instant' })` at the start of the step-loading `useEffect`, before the fetch resolves.

```jsx
// In the useEffect that loads step content:
contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
```

Use `behavior: 'instant'` (not `'smooth'`) to avoid the user seeing the scroll animation while the new content is still loading.

**Commit:** `Fix: scroll tutorial content to top on step navigation`

---

## Phase 16 — Finish screen on last tutorial step + next-tutorial navigation crash fix

**Instruction:**  
On the last step of a tutorial, replace the disabled "Next →" button with a "Finish ✓" button. Clicking it shows a modal overlay with three options:
1. **Start next tutorial** — shown only if a tutorial exists that `requires` the current one and hasn't been completed yet
2. **Back to tutorial list** — returns to the TutorialSelector
3. **Stay on this page** — dismisses the overlay

**Implementation notes:**
- `TutorialPane` accepts two new props: `onFinish(nextTutorialId | null)` and `onBackToSelector()`
- On mount, `TutorialPane` calls `GET /api/tutorials` to find the first tutorial whose `requires` array contains the current `tutorialId` and that the user hasn't yet completed — this becomes the suggested "next" tutorial
- The finish overlay is `position: absolute` inside the pane (which is `position: relative`) with a semi-transparent backdrop
- In `App.jsx`, `handleFinishTutorial(nextId)`: if `nextId` is set, PATCH the session to switch tutorial and update `activeTutorialId`; otherwise call `handleBackToSelector()`
- `isLastStep = stepIndex >= totalSteps - 1` — use this to conditionally render the Finish button instead of the Next button (no `disabled` prop needed)

**Commit:** `Add finish screen with next-tutorial suggestion on last step`

---

## Phase 17 — Bug fix: "next tutorial" shows wrong step number and crashes

**Instruction:**  
When clicking "Start next tutorial" from the finish overlay, the tutorial pane shows step "6/4" and throws `Error: marked(): input parameter is undefined or null`.

**Root cause:**  
When `tutorialId` changes, React batches `setStepIndex(0)` and `setMeta(null)` in the same render cycle. The step-fetch `useEffect([meta, stepIndex])` fires with the *new* meta but the *old* `stepIndex` (e.g. 5). It tries to fetch step 5 of a 4-step tutorial — the backend returns nothing — so `marked.parse(undefined)` crashes.

**Fix:**  
Consolidate all state resets into the `tutorialId` `useEffect` instead of scattering them:

```jsx
useEffect(() => {
  // Reset all step state when switching tutorials
  setStepIndex(0)
  setMeta(null)
  setHtml('')
  setLoading(true)
  setError(null)
  setShowFinish(false)
  fetch(`/api/tutorials/${tutorialId}/meta`)
    .then((r) => r.json())
    .then(setMeta)
    .catch((e) => setError(e.message))
}, [tutorialId])
```

This ensures that by the time the new `meta` arrives, `stepIndex` is already `0`.

**Commit:** `df90943` — `Fix: reset step to 0 when switching to next tutorial`

---

## Phase 18 — Bug fix: Makefile missing separator error in tutorial 2

**Instruction:**  
Running the Makefile in tutorial 2 (snap-confinement, step 2) fails with `Makefile:6: *** missing separator. Stop.`

**Root cause:**  
Makefile recipe lines require a literal tab character. The step used a heredoc with real tab characters in the markdown source, but `marked` strips/normalises whitespace when extracting the inner text of a fenced code block for the run button. The tabs become spaces, and `make` rejects them.

**Fix:**  
Replace the `cat > Makefile << 'EOF' ... EOF` heredoc with a single `printf` command using explicit `\t` escape sequences — these are not affected by the markdown parser:

```bash
printf 'CC      = gcc\nCFLAGS  = -Wall -O2\nLDFLAGS = -lcurl\n\ninspire: inspire.c\n\t$(CC) $(CFLAGS) -o inspire inspire.c $(LDFLAGS)\n\nclean:\n\trm -f inspire\n' > ~/inspire/src/Makefile
```

**General rule for future tutorials:** Never use heredocs with tab-indented content in run-button code blocks. Use `printf` with `\t` instead.

**File changed:** `tutorials/snap-confinement/step2.md`  
**Commit:** `aafba5c` — `fix: use printf for Makefile to preserve tab characters`

---

## Phase 19 — Fix: use `snapcraft pack` instead of bare `snapcraft` command

**Instruction:**  
Tutorial steps were using `snapcraft --destructive-mode` (old syntax). Update to `snapcraft pack --destructive-mode` to match current CLI syntax.

**Files changed (5 occurrences total):**
- `tutorials/hello-snap/step5.md` — 2 occurrences (run block + "what we learned" explanation)
- `tutorials/snap-confinement/step3.md` — 1 occurrence
- `tutorials/snap-confinement/step4.md` — 3 occurrences (each rebuild step)

**General rule for future tutorials:** Always use `snapcraft pack` (not bare `snapcraft`) as the build command. The `--destructive-mode` flag remains valid and unchanged.

**Commit:** `6fec1ef` — `fix: use 'snapcraft pack' instead of bare 'snapcraft' command`

---

## Phase 20 — Fix: snapcraft `make` plugin fails with "No rule to make target 'install'"

**Instruction:**  
Building snaps fails with `make: *** No rule to make target 'install'. Stop.`

**Root cause:**  
The `plugin: make` plugin automatically runs both `make` and `make install DESTDIR=$CRAFT_PART_INSTALL`. Our Makefile only has a default and `clean` target — no `install` target — so the second step fails.

**Fix:**  
Switch both tutorials from `plugin: make` to `plugin: nil` with an explicit `override-build` section:

```yaml
parts:
  inspire:
    plugin: nil
    source: src/
    build-packages:
      - gcc
      - libcurl4-openssl-dev
    stage-packages:
      - libcurl4
    override-build: |
      make
      install -m755 inspire "$CRAFT_PART_INSTALL/"
```

`plugin: nil` means snapcraft does nothing automatically — `override-build` gives full control. The `install` command (from coreutils) copies the binary into the staging area with correct permissions.

Also added `gcc` to `build-packages` (was previously implicit).

**Files changed:**
- `tutorials/hello-snap/step4.md` — switched to `plugin: nil`, updated key fields table
- `tutorials/snap-confinement/step3.md` — switched to `plugin: nil`

**General rule for future tutorials:** Prefer `plugin: nil` + `override-build` for simple C builds. Only use `plugin: make` when the project's Makefile has a proper `install` target.

**Commit:** `a45ab44` — `fix: use plugin:nil + override-build instead of plugin:make`

---

## Phase 21 — Fix: snap command name + network API

**Instruction:**  
Two bugs reported after running the snap:
1. `inspire.inspire` command not found
2. Network timeout when fetching quote

**Bug 1 — `inspire.inspire` command not found:**  
When snap name == app name, snapcraft exposes the command as just `<snap-name>` (not `<snap-name>.<app-name>`). The double-name form is only needed when the snap exposes multiple apps. Corrected `inspire.inspire` → `inspire` in step3.md (1 place) and step4.md (3 places).

**Bug 2 — Network timeout:**  
`zenquotes.io` is unreliable or blocked in cloud/LXD container environments. Switched to `https://api.quotable.io/random`, a more reliable free API with compatible JSON structure (`content`/`author` fields instead of `q`/`a`).

**Files changed:**
- `tutorials/snap-confinement/step2.md` — C source: new API URL, new JSON field names (`content`, `author`)
- `tutorials/snap-confinement/step3.md` — snapcraft.yaml description text + run command
- `tutorials/snap-confinement/step4.md` — run commands (×3) + expected error message

**General rules for future tutorials:**
- When snap name == app name, run command is just `<snap-name>`, not `<snap-name>.<app-name>`
- Prefer `api.quotable.io/random` over zenquotes.io for quote fetching in lab environments

**Commit:** `7b02904` — `fix: snap command name and network API in snap-confinement tutorial`

---

## Phase 22 — Fix: switch network API to numbersapi.com (plain HTTP)

**Instruction:**  
`api.quotable.io` fails with SSL certificate error in the container environment.

**Root cause:**  
Both previous APIs (`zenquotes.io`, `api.quotable.io`) use HTTPS. The LXD container may lack CA certificates or have network filtering that breaks TLS handshakes. Since the network call is not the teaching focus (confinement is), the simplest fix wins.

**Fix:**  
Switch to `http://numbersapi.com/random/trivia`:
- Plain HTTP — no SSL, no cert issues
- Plain text response — no JSON parser needed (removed `extract()` function)
- Very reliable, free, no auth required
- C source simplified by ~25 lines

**Files changed:**
- `tutorials/snap-confinement/step2.md` — rewritten C source: new URL, removed JSON extraction
- `tutorials/snap-confinement/step3.md` — snap description text
- `tutorials/snap-confinement/step4.md` — expected error message hostname

**General rule for future tutorials:** For any tutorial that requires a network call as a prop (not the focus), use `http://numbersapi.com/random/trivia` — plain HTTP, plain text, reliable in container environments.

**Commit:** `f18f213` — `fix: switch to numbersapi.com (plain HTTP, plain text, no SSL)`

---

## Phase 23 — Fix: switch to icanhazip.com (numbersapi returns HTML)

**Instruction:**  
`numbersapi.com` returns a full HTML page instead of plain text.

**Root cause:**  
`numbersapi.com` redirects HTTP to HTTPS (`CURLOPT_FOLLOWLOCATION` follows it), then the HTTPS response is an HTML page when the `Accept` header isn't set correctly.

**Fix:**  
Switch to `http://icanhazip.com` — Cloudflare-maintained service that returns exactly one line: your public IP address. No SSL, no JSON, no parsing, always available. Output format: `"Your public IP address is: X.X.X.X"`.

**Files changed:**
- `tutorials/snap-confinement/step2.md` — new URL, strip trailing newline, new fprintf format
- `tutorials/snap-confinement/step3.md` — snap description
- `tutorials/snap-confinement/step4.md` — expected error message hostname

**General rule for future tutorials:** Use `http://icanhazip.com` for any lab tutorial that needs a simple, reliable HTTP network call with a text response. It is Cloudflare-maintained, plain HTTP, single-line response.

**Commit:** `530e730` — `fix: switch to icanhazip.com - plain HTTP, single-line IP response`

---

## Phase 24 — Refactor: split snap-confinement step4 into 5 atomic steps

**Instruction:**  
Step4 was too dense — it had 5 distinct parts covering entirely different concepts. Split into atomic pages following INSTRUCTIONS.md structure.

**New step structure (was 4 steps, now 8):**

| Step | Title | Content |
|------|-------|---------|
| step4 | Enable strict confinement | Patch yaml with sed, rebuild, reinstall |
| step5 | Observe the network denial | Run snap, read error, journalctl AppArmor |
| step6 | Grant network access | Add network plug, rebuild, run, see file error |
| step7 | Grant home directory access | Add home plug, rebuild, reinstall |
| step8 | Connect the interface and verify | snap connect, run success, snap connections |

Each step follows the INSTRUCTIONS.md pattern: Objective → Concept callouts → Commands → What we learned → What's next.

**Files changed:**
- `step4.md` — rewritten as atomic "Enable strict confinement" step
- `step5.md` — new: "Observe the network denial"
- `step6.md` — new: "Grant network access"
- `step7.md` — new: "Grant home directory access"
- `step8.md` — new: "Connect the interface and verify"
- `index.md` — updated steps list from 4 to 8 entries

**Commit:** `387ac0e` — `refactor: split snap-confinement step4 into 5 atomic steps (steps 4-8)`

---

## Phase 25 — Fix: use dmesg instead of journalctl for AppArmor denials

**Instruction:**  
`journalctl --no-pager -g 'apparmor.*DENIED.*inspire'` shows nothing useful.

**Root cause:**  
The `-g` flag in journalctl matches log message text, but AppArmor audit entries are structured differently across kernels and may not appear in the systemd journal at all in some container environments. The kernel ring buffer (`dmesg`) is the reliable source.

**Fix:**

```bash
dmesg | grep -i 'apparmor.*DENIED' | tail -5
```

Also added a fallback:
```bash
journalctl -k --no-pager | grep -i apparmor | tail -5
```

Added documentation of the snap profile name format: `snap.<snap-name>.<app-name>` (e.g. `snap.inspire.inspire`), which helps students identify their snap's entries.

**Files changed:**
- `tutorials/snap-confinement/step5.md` — replaced journalctl command, added profile name explanation
- `tutorials/snap-confinement/step3.md` — same fix for the optional devmode log check

**General rule for future tutorials:** Use `dmesg | grep -i apparmor` to inspect AppArmor denials. Never rely on `journalctl -g` for kernel-level security events.

**Commit:** `1c0729c` — `fix: use dmesg for AppArmor denial inspection`

---

## Phase 26 — Fix: use /var/log/syslog for AppArmor denials (dmesg blocked in LXD)

**Instruction:**  
`dmesg` fails with `Operation not permitted` even as root.

**Root cause:**  
LXD unprivileged containers do not have `CAP_SYSLOG`, which is required to read the kernel ring buffer via `dmesg`. This cannot be worked around without changing the container configuration.

**Fix:**  
AppArmor audit entries are also written to syslog (`/var/log/syslog`), which is readable by root without `CAP_SYSLOG`:

```bash
grep -i 'apparmor.*DENIED' /var/log/syslog | tail -5
```

Fallback if syslog is empty:
```bash
journalctl --no-pager | grep -i 'apparmor.*DENIED' | tail -5
```

**Files changed:**
- `tutorials/snap-confinement/step5.md`
- `tutorials/snap-confinement/step3.md`

**General rule for future tutorials:** In LXD container environments, always use `/var/log/syslog` (not `dmesg`, not `journalctl -k`) to inspect AppArmor audit events.

**Commit:** `70512d3` — `fix: use /var/log/syslog for AppArmor denials in LXD containers`

---

## Phase 27 — Fix: snap-store-upload missing from "Creating Ubuntu Core image" section

**Instruction:**  
Tutorial #4 ("How to upload a snap to the Snap Store") was missing from the "Creating Ubuntu Core image" section in the selector.

**Root cause:**  
The `snap-store-upload/index.md` had `section: "Publishing Snaps"` instead of `section: "Creating Ubuntu Core image"`.

**Fix:** Changed the `section` field to match the other three UC image tutorials.

**Commit:** `c9aa4b5`

---

## Phase 28 — Add "Modifying the gadget" skeleton; revert snap-store-upload section

- `snap-store-upload` reverted to `section: "Publishing Snaps"`
- New skeleton tutorial `uc-gadget-snap` added to `"Creating Ubuntu Core image"` section, no dependencies
- 3 skeleton steps: Introduction, What is a gadget snap?, Inspect a reference gadget

**Commit:** `1c0b42c`

---

## Phase 29 — Tree layout for tutorial sections

**Instruction:**  
Dependent tutorials should appear on the same line/row as siblings, not scattered in a flat grid.

**Implementation:**  
`buildSectionGroups(list)` computes a dependency tree within each section:
- Identifies "local roots" = tutorials with no `requires` pointing inside the same section
- Maps each root to its direct dependents (children)
- Returns `[{ root, children[] }, ...]`

Render pattern:
```
[root card]        ← own full-width row
  [child] [child]  ← sibling row, indented with left border
[root card]        ← next independent root, own row
```

Result for "Creating Ubuntu Core image":
```
[uc-basic-image]
  ├── [uc-user-assertion]  [uc-customize-image]
[uc-gadget-snap]
```

CSS additions: `.sc101-tut-group`, `.sc101-tutorial-grid--root` (capped width), `.sc101-tutorial-grid--children` (left-indented with border).

**Commit:** `8ed9a91` — `feat: tree layout for tutorial sections`

---

## Phase 30 — Bug fix: Start/Restart buttons not clickable after tree layout refactor

**Root cause:**  
During the tree layout refactor (Phase 29), the line `const v = validation[tut.id]` was accidentally dropped from `handleSelect`. The check `if (v && !v.valid) return` then evaluated `v` as `undefined`, which is falsy — so it didn't return, but the real damage was that without the declaration the variable referenced the outer scope `v` which was `undefined`, causing every click to silently no-op before reaching the `fetch`/`onSelect`.

Actually — `undefined && !undefined` is `false`, so it didn't early-return. The real symptom was that `v` being `undefined` caused a silent error elsewhere. Either way, restoring `const v = validation[tut.id]` fixes it.

**Fix:** Restored the missing `const v = validation[tut.id]` declaration at the top of `handleSelect`.

**Commit:** `f213387`

---

## Standing instruction (Phase 17+)

> **Always update `genesis.md` after every change to the project**, no matter how small. Add a new Phase section describing: the instruction given, the implementation, any pitfalls encountered, and the commit SHA.


---

## Phase 31 — Course hierarchy

**Goal**: Group tutorials into courses. Each course is a folder in `tutorials/`.

**Changes**:
1. **Folder structure**: `tutorials/<Course_Name>/<tutorial-id>/` (underscores replace spaces for shell safety; display converts `_` → spaces)
   - Created `tutorials/SC101_Lab_Interface_playground/` containing all 7 existing tutorials
   - Created `tutorials/SC101_Original_Labs/` with a placeholder tutorial
2. **Backend** (`server.js`):
   - `loadTutorialMeta(courseDir, tutorialId)` — takes course dir parameter
   - `findTutorial(tutorialRef)` — searches all courses; accepts `courseId/folderId` UID or legacy `id`
   - `listTutorials()` — scans nested structure, adds `course`/`courseId`/`uid` to every tutorial
   - `courseDisplayName()` — converts folder name to display name (underscores → spaces)
   - `tutorialUid()` — stable compound key `courseDir/tutorialDir`
   - Resilient: try/catch at every directory scan level, skips invalid entries
   - Courses and tutorials are sorted alphabetically for deterministic ordering
3. **Frontend** (`TutorialSelector.jsx`):
   - Groups by course first, then section within each course
   - Courses are collapsed by default; the active course expands on back-navigation
   - Course header with progress bar
4. **CSS** (`index.css`): course styles, orange accent, collapsible chevron

**Commits:** `2da458a`, `f7f6432`, `e21a888`, `d919d65`, `263a8eb`, `e8db60c`

---

## Phase 32 — Static review fixes and hardening

**Goal**: Fix security issues, code inconsistencies, and potential bugs from static code analysis.

**Changes**:
1. **Stable tutorial identity**: `courseId`, `folderId`, `uid` on every tutorial; frontend keys all progress by `uid`
2. **LXD command injection prevention**: all `lxc` calls use `spawnSync` argument arrays; export uses `execFile()`
3. **Path traversal prevention**: `safeResolve()` checks paths stay inside their base directory
4. **Session hardening**: atomic writes, `Object.hasOwn()` for null tutorialId, container name with session suffix
5. **XSS hardening**: DOMPurify on tutorial HTML, `escapeAttr()` on run-button commands
6. **Session enumeration fix**: login only fetches the locally-saved session ID (later reverted — see Phase 33)
7. **Selector regressions fixed**: restored `expanded` state, `lastTutorialId` for correct course expansion on back

**Commit:** `0b3f06d`

---

## Phase 33 — UX fixes and nav improvements

1. **User initials in nav**: `SC` logo replaced with user's initials (first letter of each name word)
2. **← Tutorials link moved** to right side of nav bar, before the gear icon
3. **Session listing restored**: `GET /api/sessions` re-enabled (was disabled in Phase 32 as a security measure, but broke the resume screen for a lab tool with no authentication)
4. **Session expiry**: containers auto-stopped after 2h inactivity; `runSessionExpiry()` runs every 15 min via `setInterval`; `IDLE_STOP_DELAY` bumped from 60s to 5min

**Commits:** `0a5df7d`, `b57e424`, `d291ac5`

---

## Phase 34 — Host prerequisites UI + GitHub tutorial import

1. **Host prerequisites check** (`GET /api/setup/check`): checks lxd, lxd-init, snapcraft, node, npm; returns version + install command for missing tools
2. **Prerequisites panel** in gear menu: collapsible, green/red per check, copy button, docs link, re-check button
3. **GitHub tutorial import** (`POST /api/tutorials/import`):
   - Shallow-clones repo to a temp directory
   - **Auto-detects format**:
     - `index.md` present → SC101 native format: validate and install as-is
     - `index.json` at root → KillerCoda single-tutorial: convert to SC101 format
     - Subdirs each with `index.json` → KillerCoda multi-tutorial repo: convert and import each sub-tutorial
   - **KillerCoda conversion** (`convertKillercodaTutorial`):
     - Reads `index.json` for title, description, step list
     - Generates `index.md` with YAML frontmatter
     - Converts `{{execute}}` / `{{copy}}` inline syntax → SC101 fenced run blocks
     - Strips remaining `{{...}}` markers
    - **Validation** (`validateSc101Tutorial`): auto-fills missing `id`/`title` from the final tutorial name, auto-discovers `steps` when missing, and validates that referenced step files exist
   - On failure: cleans up cloned dir, returns structured error list
   - Optional course name parameter (defaults to `Imported_Tutorials`)
4. **Import UI** in gear menu: URL + course name inputs, inline success/error/warnings display
5. **Light mode fix**: setup and import CSS now uses `--sc101-fg` / `--sc101-fg-muted` / `--sc101-bg-alt` (previously used undefined variables causing white-on-white text)

**Commits:** `e7537f2`, `507a31f`, `0597f9e`, `360c358`, `0490a98`, `87c2e6e`, `baef913` + this phase

---

## Current project structure

```
sc101-lab-interface/
├── backend/
│   ├── data/sessions.json        # Runtime session store
│   ├── lxd.js                    # Container lifecycle (spawnSync arg-array)
│   ├── server.js                 # Express REST API + WebSocket PTY bridge
│   └── sessions.js               # Session CRUD (atomic writes, Object.hasOwn)
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx               # Screen flow: login → selector → tutorial; lastTutorialId
│       ├── main.jsx              # Entry point (no StrictMode)
│       ├── index.css             # --sc101-* custom properties, all custom styles
│       ├── components/
│       │   ├── SettingsPanel/    # Gear popover: user info, progress, export, theme, import, prerequisites
│       │   ├── TerminalPane/     # xterm.js + WebSocket + node-pty bridge
│       │   ├── ThemeToggle/      # ThemeContext (light/dark/auto)
│       │   └── TutorialPane/     # Markdown + DOMPurify, Prism.js, step nav, run buttons
│       └── screens/
│           ├── LoginScreen.jsx   # New/resume/delete session; shows all sessions
│           └── TutorialSelector.jsx  # Courses → sections → tree layout, progress, deps
├── tutorials/
│   ├── INSTRUCTIONS.md
│   ├── SC101_Lab_Interface_playground/
│   │   ├── hello-snap/           # Tutorial 1: Hello Snap C app (6 steps)
│   │   ├── snap-confinement/     # Tutorial 2: Confinement (4 steps)
│   │   ├── uc-basic-image/       # Skeleton: Basic UC image
│   │   ├── uc-user-assertion/    # Skeleton: User assertion
│   │   ├── uc-customize-image/   # Skeleton: Customize image
│   │   ├── snap-store-upload/    # Skeleton: Snap Store upload
│   │   └── uc-gadget-snap/       # Skeleton: Gadget snap
│   └── SC101_Original_Labs/
│       └── fake/                 # Placeholder tutorial
├── package.json
└── genesis.md                    # This file (TODO.md merged in below)
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
| Step navigation stays at bottom | Overflow container scroll not reset on re-render | `contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })` |
| "Next tutorial" shows wrong step + crash | React batches state | Reset all state in same `tutorialId` `useEffect` |
| Makefile recipe lines become spaces | `marked` strips tabs from code blocks | Use `printf '...\t...'` — `\t` survives the markdown→terminal pipeline |
| White-on-white text in light mode | CSS used undefined `--sc101-text-muted` / `--sc101-hover` vars | Use `--sc101-fg`, `--sc101-fg-muted`, `--sc101-bg-alt` |
| Sessions "lost" after server restart | `GET /api/sessions` disabled for security (bad for lab tool) | Restored; lab tool has no auth, enumeration is acceptable |

---

## TODO (open items)

### Authentication
- [ ] **SSO integration** — replace username-only login with OIDC/SAML (e.g. Keycloak or Ubuntu One); map `session.username` to SSO subject claim

### Tutorial content — to write
- [ ] **`uc-basic-image`** — Create a basic Ubuntu Core image with `ubuntu-image` and a model assertion
- [ ] **`uc-user-assertion`** *(requires: uc-basic-image)* — Add a user assertion to enable SSH login via Ubuntu SSO
- [ ] **`uc-customize-image`** *(requires: uc-basic-image)* — Pre-install snaps at build time via model assertion
- [ ] **`snap-store-upload`** — Register, upload, and release a snap on the Snap Store
- [ ] Complete all 6 steps of `hello-snap` tutorial

### Infrastructure
- [x] **Host prerequisites UI** — show required tools with install commands in the gear menu *(Phase 34)*
- [ ] **Ubuntu Core container** — import UC24 image into LXD; expose to backend for snap test step
- [ ] **Provision script** — `scripts/setup-host.sh` that automates lxd init, snapcraft install, image pull

### Backend
- [x] **Session expiry** — auto-destroy containers + remove sessions after 2h inactivity *(Phase 33)*
- [x] **GitHub tutorial import** — detect SC101 and KillerCoda formats, convert, validate, install, and auto-fill missing frontmatter *(Phase 34)*
- [ ] **Rate-limit session creation** — prevent container sprawl
- [ ] **Delete imported tutorial** — `DELETE /api/tutorials/:uid` endpoint to remove a tutorial folder

### Frontend
- [x] **Tutorial selector** — card grid, sections, progress, dependency tree *(Phase 11+)*
- [x] **Collapsible courses** — folded by default, expand active course on back-nav *(Phase 31)*
- [ ] **Live container status** — show starting/running/stopped in terminal pane header
- [ ] **Mobile layout** — responsive split-pane or tabbed view for narrow screens
- [ ] **Award page** — certificate/PDF download when user completes all tutorials in a course

### Security / Production
- [ ] **Resource limits** — enforce LXD CPU/RAM/disk quotas per container
- [ ] **HTTPS** — reverse proxy with nginx or Caddy + TLS
