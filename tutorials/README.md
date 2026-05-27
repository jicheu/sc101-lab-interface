# SC101 Tutorials

This folder contains all tutorials served by the SC101 Lab Interface.  
Each tutorial is a sub-folder with an `index.md` manifest and one `stepN.md` file per step.

---

## Adding a new tutorial

1. Create a folder: `tutorials/<your-tutorial-id>/`
2. Add an `index.md` (see format below)
3. Add `step1.md`, `step2.md`, … (one per step)
4. Restart the backend — it auto-discovers tutorials at startup

No code changes required.

---

## `index.md` format

```markdown
---
id: my-tutorial              # must match the folder name
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

---

## `stepN.md` format

```markdown
---
title: "Step title"          # required — shown in the nav bar
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
└── hello-snap/
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
