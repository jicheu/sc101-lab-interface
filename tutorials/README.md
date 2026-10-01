# SC101 Tutorials

This folder contains the tutorials served by the SC101 Lab Interface in
development. Tutorials are organized as a two-level hierarchy:
`tutorials/<Course>/<tutorial-id>/`.

This document is a friendly authoring guide. The normative format is the
[tutorial-format spec](../openspec/specs/tutorial-format/spec.md).
Authoring conventions (official-references rule, atomic steps, printf-not-heredoc
for tabs, etc.) live in [INSTRUCTIONS.md](./INSTRUCTIONS.md).

---

## Adding a new tutorial

1. Pick or create a course folder: `tutorials/<Course_Name>/` (use underscores
   for spaces — the UI renders `_` back to space in display names).
2. Create the tutorial folder: `tutorials/<Course_Name>/<your-tutorial-id>/`.
3. Add an `index.md` (see format below).
4. Add `step1.md`, `step2.md`, … (one per step).
5. Reload the tutorial selector — the backend re-reads the tutorials directory
   on every list request; no restart needed.

No code changes required.

---

## `index.md` format

```markdown
---
id: my-tutorial              # must match the tutorial folder name
title: "My Tutorial Title"
description: >
  One or two sentences shown on the tutorial selection screen.
difficulty: beginner         # beginner | intermediate | advanced
time: 30                     # estimated minutes
tags: [snap, python, iot]

environment:
  dev:
    image: ubuntu:24.04      # LXD image alias for the dev container
    prestart:                # shell commands run once on first container create
      - apt-get update -y
      - apt-get install -y python3

  # Optional: second container for testing (e.g. Ubuntu Core)
  # test:
  #   image: ubuntu-core:24

steps:
  - file: step1.md
    title: "Introduction"
  - file: step2.md
    title: "Step two title"
---

## About this tutorial

This paragraph is shown on the tutorial selection screen.
It supports full Markdown.
```

> The `environment` block is currently metadata-only — the platform preserves it
> and exposes it to consumers, but does not (yet) provision containers from it.
> See the tutorial-format spec for details.

---

## `stepN.md` format

```markdown
---
title: "Step title"          # optional; ignored by the platform.
                             # The nav bar title comes from index.md's
                             # steps[].title.
---

Step content in standard Markdown.

## Run a command

Add the `run` annotation to a fenced code block to show a ▶ Run button:

    ```bash run
    echo "Hello!"
    ```

## Show code without a run button

    ```bash
    # This block has no run button
    ls -la
    ```
```

---

## Folder layout reference

```
tutorials/
└── SC101_Lab_Interface_playground/          ← course folder
    └── hello-snap/                          ← tutorial folder
        ├── index.md        ← manifest (metadata + environment + steps list)
        ├── step1.md
        ├── step2.md
        ├── step3.md
        ├── step4.md
        ├── step5.md
        ├── step6.md
        └── assets/         ← optional images referenced in steps
            └── diagram.png
```
