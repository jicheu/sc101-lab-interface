# Changelog

All notable, user-visible changes to SC101 Lab Interface are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Entries link to their originating [OpenSpec change](./openspec/) archive
when applicable, so you can trace any entry back to its proposal, design
decisions, tasks, and specs.

**Scope**: user-visible changes going forward. History from project inception
through mid-2026 lives in [`docs/genesis.md`](./docs/genesis.md); the retrospective
snapshot lives in [`PROJECT_REPORT.md`](./PROJECT_REPORT.md).

**Standing instruction**: every archived OpenSpec change adds an entry under
`[Unreleased]`. When a proper release process is introduced, `[Unreleased]`
becomes `[X.Y.Z] - YYYY-MM-DD` per Keep a Changelog convention.

---

## [Unreleased]

### Added

- Added a `## Working with OpenSpec` section to
  [`HACKING.md`](./HACKING.md) with a `### Known quirks` subsection
  documenting the `design.md reported 'ready'` false-positive warning on
  `skip_specs: true` changes at archive time, and the workaround (confirm
  "Proceed"). Section is structured so additional OpenSpec quirks can be
  added over time.
  ([`document-openspec-quirks` archive](./openspec/changes/archive/2026-09-04-document-openspec-quirks/))
- Captured the operator-facing snap distribution contract as a new
  capability spec:
  [`snap-packaging`](./openspec/specs/snap-packaging/spec.md) — two-snap
  layout, strict confinement, HTTP surface on port 3001, auto- vs
  manually-connected interfaces, session persistence across snap refresh,
  versioned content interface, operator content override, daemon lifecycle.
  ([`snap-packaging` archive](./openspec/changes/archive/2026-09-03-snap-packaging/))
- Introduced `CHANGELOG.md` (this file) as the forward-going record of
  user-visible changes. Preamble carries the standing instruction and points
  at [`docs/genesis.md`](./docs/genesis.md) for pre-CHANGELOG history.
  ([`reboot-genesis` archive](./openspec/changes/archive/2026-09-03-reboot-genesis/))
- Introduced OpenSpec as the source of truth for behavior specs. First two
  capabilities captured: `teaching-sessions` (multi-user sessions, join codes,
  live `canWrite` propagation, shared-terminal semantics) and `tutorial-format`
  (the tutorial content format the platform reads at runtime).
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))
- Added [`HACKING.md`](./HACKING.md) — developer setup and dev-loop, extracted
  from `README.md`.
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))
- Added [`docs/manual-testing-recipes.md`](./docs/manual-testing-recipes.md) —
  curl and DevTools recipes for teaching sessions and permission toggling.
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))

### Changed

- Trimmed `INSTALL.md` and `SNAP_PACKAGING.md`: behavior claims that were
  duplicated in prose now reference the `snap-packaging` spec; every command,
  troubleshooting section, and how-to preserved. Added `snap-packaging` row
  to `README.md`'s spec list and `PROJECT_REPORT.md`'s reference table.
  ([`snap-packaging` archive](./openspec/changes/archive/2026-09-03-snap-packaging/))
- Marked `snap-analysis.json` as a historical snapshot via a `__note` header;
  content unchanged. Superseded by `snap/snapcraft.yaml` and the
  `snap-packaging` spec.
  ([`snap-packaging` archive](./openspec/changes/archive/2026-09-03-snap-packaging/))
- Moved `genesis.md` from the repo root to
  [`docs/genesis.md`](./docs/genesis.md). Closed as a historical document;
  new user-visible changes now go in this file.
  ([`reboot-genesis` archive](./openspec/changes/archive/2026-09-03-reboot-genesis/))
- Rewrote `README.md` as public-facing project orientation with a
  Getting-started link table; dev-setup content moved to `HACKING.md`.
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))
- Rewrote `tutorials/README.md`: two-level `<Course>/<tutorial>/` layout in
  examples; corrected the "restart the backend" claim; corrected the step
  frontmatter `title` claim; added pointer to the `tutorial-format` spec.
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))
- Refactored `start.sh` from a 47-line `pkill`-based launcher to a 22-line
  `trap`-based wrapper over `npm run dev:backend` + `npm run dev:frontend`.
  No wrong-port echoes; no machine-wide `pkill`.
  ([`clean-fossils` archive](./openspec/changes/archive/2026-09-02-clean-fossils/))
- Fixed `PROJECT_REPORT.md` reference-documentation table drift: corrected the
  `README.md` row, added rows for `HACKING.md`,
  `docs/manual-testing-recipes.md`, `CHANGELOG.md`, and both capability
  specs; updated 6 `genesis.md` link paths to `docs/genesis.md`.
  ([`clean-fossils` archive](./openspec/changes/archive/2026-09-02-clean-fossils/),
  [`reboot-genesis` archive](./openspec/changes/archive/2026-09-03-reboot-genesis/))

### Fixed

- `INSTALL.md` and `SNAP_PACKAGING.md` cross-linking cleaned up; port 5173
  note in `SNAP_PACKAGING.md` corrected (5173 is dev-only, snap serves the
  built frontend from the backend on 3001).
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))

### Removed

- Retired `MULTIUSER_TESTING.md`: behavior migrated to the `teaching-sessions`
  spec, recipes migrated to `docs/manual-testing-recipes.md`, stale
  "next steps: build the UI" section deleted.
  ([`rationalize-docs` archive](./openspec/changes/archive/2026-09-02-rationalize-docs/))
- Deleted three superseded snap-patch fossils that had no live references:
  `fix-server.sh`, `server-snap-patch.sh`, `snap-server-patch.js`. The code
  they injected is folded directly into `backend/server.js`.
  ([`clean-fossils` archive](./openspec/changes/archive/2026-09-02-clean-fossils/))
