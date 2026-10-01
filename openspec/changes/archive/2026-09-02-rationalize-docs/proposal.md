## Why

Project documentation has drifted from the code. Six markdown files at the repo root
overlap in scope, contradict each other, and in a few places describe stale behavior
(step-frontmatter rules the code no longer enforces, "restart the backend" claims that
no longer apply, teaching-mode framed as an experiment that has since shipped). Two
capabilities of the running system — **teaching sessions** and the **tutorial format
the platform actually reads** — have no home in the docs at all: teaching mode lives
only inside a testing-recipes file, and the tutorial format lives only inside the
backend code plus scattered prose. There is no source of truth we can point at.

At the same time, OpenSpec is set up in this repo but has zero specs. Adopting it as
the source of truth for behavior — starting with these two capabilities — solves the
"where does the truth live" problem going forward, without asking us to backfill the
whole system at once.

## What Changes

- Introduce OpenSpec as the source of truth for behavior specs (starting with two
  capabilities). Free-form markdown docs become operational/onboarding material, not
  behavior specs.
- Capture the current behavior of **teaching sessions** in a capability spec
  (`teaching-sessions`). This is where join codes, participants, `canWrite` propagation,
  the shared-PTY sharing model, and the `/ws/terminal` + `/ws/sessions` presence
  protocols get specified.
- Capture the **tutorial format** the platform enforces as a capability spec
  (`tutorial-format`). Covers directory layout, discovery precedence
  (`$SNAP_COMMON` → `$SNAP` → repo), UID scheme, required and optional frontmatter,
  step-file rules, `run` code-block annotation, `requires` semantics, and how
  KillerCoda repos are accepted at import time.
- Retire `MULTIUSER_TESTING.md`:
  - Behavior content → moves into the `teaching-sessions` spec.
  - Curl / DevTools recipes → move into a new `docs/manual-testing-recipes.md`.
  - "Next steps: build the UI" section → deleted (stale; UI already exists).
- Extract dev-setup material from `README.md` into a new `HACKING.md` (private-audience
  developer doc). `README.md` is trimmed to public orientation and links.
- Fix drift in place:
  - `README.md`: trim, cross-link to the new specs and HACKING.
  - `INSTALL.md`: fix stale bits.
  - `SNAP_PACKAGING.md`: fix stale bits (e.g. port 5173 note that doesn't apply to
    the snap).
  - `tutorials/README.md`: correct the "restart the backend" line and the
    step-frontmatter-title claim (neither is enforced by the code); trim so the
    format itself is delegated to the `tutorial-format` spec.
- Deliberately **not** touched by this change:
  - `PROJECT_REPORT.md` (retrospective — untouched)
  - `genesis.md` (backfill deferred to a later change)
  - `tutorials/INSTRUCTIONS.md` (authoring rulebook — layers on top of the format
    spec, stays as-is; feeds the `create-lab` skill)
  - `.github/skills/create-lab/SKILL.md`

## Capabilities

### New Capabilities

- `teaching-sessions`: Multi-user sessions with an owner and joinable participants.
  Covers session creation (regular vs teaching), join codes, join/leave semantics,
  the participant model, `canWrite` permission and its live propagation over
  established WebSocket connections, the shared-PTY sharing model, presence and
  session-event broadcasts on `/ws/terminal`, and the sessions-dashboard stream on
  `/ws/sessions`.

- `tutorial-format`: The tutorial content format the platform reads at runtime.
  Covers the two-level `<CourseDir>/<TutorialDir>/` layout, discovery precedence
  under snap and non-snap runtimes, the UID scheme
  (`courseDir/tutorialDir`) plus legacy `id` fallback, frontmatter fields (required,
  recognized, and not-currently-consumed), step-file rules, the `run` code-block
  annotation, `requires` semantics enforced at the selector layer, and the
  KillerCoda-format ingestion edge (accepted on import, converted to SC101 at rest).

### Modified Capabilities

None. Both capabilities are new to OpenSpec even though the behavior already exists
in code.

## Impact

- **Code**: none. This change captures existing behavior; it does not modify
  runtime behavior.
- **Docs**: `README.md`, `INSTALL.md`, `SNAP_PACKAGING.md`, `tutorials/README.md`
  edited. `HACKING.md` and `docs/manual-testing-recipes.md` created.
  `MULTIUSER_TESTING.md` deleted (content migrated).
- **Specs**: two new capability specs under `openspec/specs/`.
- **AI tooling**: `tutorials/INSTRUCTIONS.md` and the `create-lab` skill are
  unaffected; they continue to layer on top of the tutorial format.
- **Users / operators**: no behavior change. Doc links may need updating in any
  external material that references the retired `MULTIUSER_TESTING.md` file.
- **Future work explicitly unblocked but out of scope**: backfilling `genesis.md`
  post-Phase-35, and capturing additional capabilities (e.g. tutorial import,
  tutorial resolution, LXD lifecycle) as separate future changes.
