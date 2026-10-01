# SC101 Lab Interface

A KillerCoda-style interactive learning platform with a live terminal powered by LXD.

```
+-----------------------------+------------------------------+
|  Tutorial pane              |  Terminal pane               |
|  (Markdown + syntax hl.)    |  (xterm.js -> LXD container) |
|  Run buttons on code        |                              |
+-----------------------------+------------------------------+
```

## Getting started

| I want to...                       | Read                                                                 |
|------------------------------------|----------------------------------------------------------------------|
| Install and run the published snap | [INSTALL.md](./INSTALL.md)                                           |
| Develop on the platform            | [HACKING.md](./HACKING.md)                                           |
| Build the snaps from source        | [SNAP_PACKAGING.md](./SNAP_PACKAGING.md)                             |
| Write a tutorial                   | [tutorials/README.md](./tutorials/README.md)                         |
| Understand what got built and why  | [PROJECT_REPORT.md](./PROJECT_REPORT.md), [genesis.md](./docs/genesis.md) |

Behavior specs live under [`openspec/specs/`](./openspec/specs/):

- [`teaching-sessions`](./openspec/specs/teaching-sessions/spec.md) — multi-user
  sessions, join codes, live permission propagation, shared-terminal semantics.
- [`tutorial-format`](./openspec/specs/tutorial-format/spec.md) — the tutorial
  format the platform reads at runtime.
- [`snap-packaging`](./openspec/specs/snap-packaging/spec.md) — operator-facing
  contract of the snap distribution: two-snap layout, interface requirements,
  content-swap semantics, session persistence.

## Stack

| Layer            | Technology                       |
|------------------|----------------------------------|
| Frontend         | React 18 + Vite 4                |
| Terminal         | xterm.js + WebSocket             |
| Backend          | Node.js + Express + ws           |
| PTY bridge       | node-pty (dev), LXD exec (snap)  |
| Emulation        | LXD (Ubuntu 24.04 container)     |
| Tutorial format  | Markdown with `run` code blocks  |
| Packaging        | Two snaps: platform + content    |

## Features

### Click-to-execute code blocks

Tag any code block with `run` to add a Run button in the tutorial pane:

    ```bash run
    gcc -o hello hello.c
    ```

Clicking sends the command directly to the live terminal. See the
[tutorial-format spec](./openspec/specs/tutorial-format/spec.md) for the full
annotation rules.

### Import a tutorial from GitHub

From the gear menu → **Import from GitHub**, paste a repository URL and an optional
course name. The backend auto-detects the format:

| Format               | Detection                       | Action                    |
|----------------------|---------------------------------|---------------------------|
| SC101 native         | `index.md` at root              | Validate + install as-is  |
| KillerCoda (single)  | `index.json` at root            | Convert + install         |
| KillerCoda (multi)   | subdirs each with `index.json`  | Convert all + install     |

### AI-assisted tutorial authoring

- **VS Code Copilot:** the [`create-lab` skill](./.github/skills/create-lab/SKILL.md)
  auto-triggers when you ask to convert a raw lab into a tutorial bundle.
- **Gemini / Claude / other AI clients:** upload
  [`tutorials/INSTRUCTIONS.md`](./tutorials/INSTRUCTIONS.md) plus a workflow file
  as a Gem or Project, then paste your lab.

Both routes follow [`tutorials/INSTRUCTIONS.md`](./tutorials/INSTRUCTIONS.md), the
authoring rulebook that layers on top of the tutorial-format spec.

## Included tutorials

| Course                          | Tutorial                                                                                     | Steps     |
|---------------------------------|----------------------------------------------------------------------------------------------|-----------|
| SC101 Lab Interface playground  | hello-snap                                                                                   | 6         |
| SC101 Lab Interface playground  | snap-confinement                                                                             | 8         |
| SC101 Lab Interface playground  | uc-basic-image / uc-user-assertion / uc-customize-image / snap-store-upload / uc-gadget-snap | skeletons |
