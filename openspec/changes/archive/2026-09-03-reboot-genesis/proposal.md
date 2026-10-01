## Why

`genesis.md` is a 907-line append-only phase log that stopped being maintained
around Phase 35 (mid-2026). Its Phase 17 standing instruction — "always update
genesis.md after every change" — is silently broken: PROJECT_REPORT.md
describes at least a dozen post-Phase-35 events (LXD REST pivot, two-snap
split, teaching-mode implementation and its iterative fixes) that never got
phases. Reviving the instruction would mean back-filling ~40 commits from git
log, and even then the format overlaps with what OpenSpec change archives now
capture (intent + rationale + fix trail per change).

Instead, this change closes `genesis.md` as a historical document and
introduces a `CHANGELOG.md` at the repo root as the forward-going record of
user-visible changes. `CHANGELOG.md` links to the OpenSpec change archives
that produced each entry, so full traceability (proposal, design, tasks,
specs) is one click away without duplicating that content in the changelog
itself.

This is the third piece of the doc-rationalization arc:

1. `rationalize-docs` split the public/private doc surfaces and captured
   two capabilities as specs.
2. `clean-fossils` deleted superseded scripts and fixed the ref table.
3. **This change** decides what the *ongoing* record of the project looks
   like now that we have OpenSpec: `genesis.md` closes, `CHANGELOG.md`
   opens.

## What Changes

- **Move** `genesis.md` → `docs/genesis.md` via `git mv` so history is
  preserved. No stub at the old location.
- **Create** `CHANGELOG.md` at the repo root using a hybrid
  [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) structure whose
  entries link to their OpenSpec change archive when applicable.
- **Preamble** of `CHANGELOG.md` states:
  - Its scope (user-visible changes going forward).
  - That history from project inception through mid-2026 lives in
    `docs/genesis.md`.
  - The standing instruction going forward: **every archived OpenSpec change
    adds an entry under `[Unreleased]`**.
- **Seed** `CHANGELOG.md` with two entries under `[Unreleased]`:
  - `rationalize-docs` (with a link to
    `openspec/changes/archive/2026-09-02-rationalize-docs/`).
  - `clean-fossils` (with a link to
    `openspec/changes/archive/2026-09-02-clean-fossils/`).
- **Update all 8 references** to `genesis.md` in tracked files:
  - `README.md` — 1 reference.
  - `HACKING.md` — 1 reference.
  - `PROJECT_REPORT.md` — 6 references.
  - Update the ref target from `./genesis.md` to `./docs/genesis.md`.
- **Add** a row to `PROJECT_REPORT.md`'s reference table pointing at the new
  `CHANGELOG.md`.

Explicitly **not** part of this change:

- Backfilling any pre-2026-09 phase into `CHANGELOG.md` (user chose Q4a: fresh
  start; history stays in `docs/genesis.md`).
- Adding version tags or a release process to the project.
- Enforcing the "every archive adds an entry" rule via a hook or CI check.
  The rule lives as prose in `CHANGELOG.md`'s preamble; upgrading to
  enforcement is a separate change.
- Editing `docs/genesis.md`'s content. It is closed; only its path changes.

## Capabilities

No spec-level behavior change. This change moves one file, creates a second,
and updates references. `.openspec.yaml` declares `skip_specs: true`.

## Impact

- **Code**: none.
- **Docs**: `genesis.md` moves; `CHANGELOG.md` created; `README.md`,
  `HACKING.md`, `PROJECT_REPORT.md` refs updated.
- **Ergonomics**: contributors (present and future me) now have one obvious
  place to look for "what changed": `CHANGELOG.md` at the root. Old
  bookmarks to `genesis.md` at the root break; git history and the
  `docs/genesis.md` path preserve access to the content.
- **Standing instruction**: from now on, every `/opsx-archive` completion
  should be followed by adding an entry to `CHANGELOG.md`'s `[Unreleased]`.
  The instruction is documented in the CHANGELOG's own preamble so future
  agents reading the file see it as part of the file.
- **Future work explicitly unblocked but out of scope**:
  - Enforcing the standing instruction (hook or CI check).
  - Introducing a proper release/version-tagging process; when that
    happens, the `[Unreleased]` section becomes `[X.Y.Z] - YYYY-MM-DD`
    per Keep a Changelog convention.
  - Capturing `snap-packaging` as a capability spec (thread G on the shelf).
