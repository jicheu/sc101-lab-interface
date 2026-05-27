---
name: create-lab
description: "Use when converting a lab file into an SC101 tutorial bundle, following tutorials/INSTRUCTIONS.md. Creates the tutorial folder, index.md, stepN.md files, and any supporting assets."
argument-hint: "Convert a lab file into a tutorial bundle"
---

# Create Lab

Use this skill when turning a source lab into a tutorial bundle for this platform.

## When to use
- Converting a lab Markdown file into `tutorials/<id>/`
- Splitting a lab into atomic tutorial steps
- Generating `index.md`, `stepN.md`, and optional `assets/`

## Workflow
1. Read `tutorials/INSTRUCTIONS.md` first and treat it as authoritative.
2. Inspect the source lab and extract objectives, prerequisites, commands, file edits, references, and dependencies.
3. Split non-atomic content into separate steps. If a step mixes install/build/test/edit work, split it before writing.
4. Create the tutorial bundle:
   - `index.md` with complete frontmatter, environment, and step list
   - `stepN.md` files with `Objective`, `Prerequisites`, `Install required tools`, `Instructions`, `What we learned`, and `What's next`
   - `assets/` only when needed
5. Apply the tutorial rules:
   - official Canonical / Ubuntu / Snapcraft references only
   - install every required tool before first use
   - show file changes as diffs/patches when a later step modifies earlier files
   - keep each step atomic and self-contained
6. Validate the bundle against the tutorial instructions before finishing.

## Output expectations
- Produce a complete tutorial folder under `tutorials/<id>/`
- Preserve the source lab’s intent while adapting it to the tutorial format
- Keep the writing concise, instructional, and beginner-safe
