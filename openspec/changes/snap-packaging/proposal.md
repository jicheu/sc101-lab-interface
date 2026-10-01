## Why

Snap packaging is the platform's production distribution mechanism, but it has
no capability spec. The observable guarantees SC101 makes to operators —
two-snap architecture, strict confinement, port 3001, session data survives
refresh, tutorial content is swappable at runtime, manual interface
connections required — currently live only in prose across `INSTALL.md`,
`SNAP_PACKAGING.md`, and `PROJECT_REPORT.md`. Those docs have already drifted
once (the `rationalize-docs` and `clean-fossils` changes fixed several stale
claims), and there is no source of truth to prevent them from drifting again.

At the same time, `snap-analysis.json` at the repo root is a stale artifact
from an early packaging attempt: it claims `command: start.sh` when the actual
snap uses `snap-start.sh`, claims `stage_packages: [nodejs]` when the actual
build installs Node.js manually in `override-build`, and doesn't mention the
`sc101-tutorials` content interface at all. It's a fossil that needs framing
as historical rather than removed, per user decision.

This change captures the operator-facing behavior contract of the snap
distribution as a proper capability spec, and trims the prose docs so
`INSTALL.md` and `SNAP_PACKAGING.md` stop mixing behavior claims with
how-to-do-it operational content.

## What Changes

- **New capability**: `snap-packaging` — the operator-facing contract of the
  snap distribution: two-snap layout, confinement, HTTP surface, interface
  requirements, session persistence, content swap semantics.
- **Trim `INSTALL.md`**: keep the how-to-install-and-connect flow; remove
  behavior claims that are now spec content (e.g. "manual interface
  connections required", "no restart needed to swap tutorials") — these
  become one-line references to the spec.
- **Trim `SNAP_PACKAGING.md`**: keep build steps + troubleshooting; remove
  behavior claims that are now spec content.
- **Header on `snap-analysis.json`**: add a top-level `"__note"` (or
  equivalent) marking the file as a historical snapshot from initial snap
  packaging, superseded by `snap/snapcraft.yaml` and the `snap-packaging`
  spec. No content edits.
- **Add a row to `README.md`'s Getting-started table** for the new spec.
- **Add a row to `PROJECT_REPORT.md`'s Reference-documentation table** for
  the new spec.
- **CHANGELOG.md**: entry under `[Unreleased]` referencing this change's
  archive (self-applying the standing instruction).

Explicitly **not** part of this change:

- Modifying `tutorial-format`'s `Tutorials root resolution` requirement. It
  stays where it is; `snap-packaging` cross-references it from the operator
  perspective without duplicating.
- Committing to a specific content-interface version string
  (`sc101-tutorials-v1`) in the spec — the interface is versioned as an
  abstract property, not by name.
- Changing `snap/snapcraft.yaml` or any build artifact.
- Backfilling any packaging-related phase into `docs/genesis.md`.

## Capabilities

### New Capabilities

- `snap-packaging`: The operator-facing contract of the snap distribution.
  Covers the two-snap architecture (platform + content), strict confinement,
  HTTP surface on port 3001, required auto-connected and manually-connected
  interfaces, session data persistence across snap refresh, and the content
  swap model (disconnect/reconnect a content snap, or use the operator
  override path, without rebuilding the platform).

### Modified Capabilities

None. `tutorial-format` is cross-referenced but not modified.

## Impact

- **Code**: none. This change captures existing packaging behavior; runtime
  behavior does not change.
- **Docs**: `INSTALL.md` and `SNAP_PACKAGING.md` shrink slightly as behavior
  claims migrate to the spec. `README.md` and `PROJECT_REPORT.md` each get
  one new row. `CHANGELOG.md` gets one entry.
- **Specs**: one new capability under `openspec/specs/`.
- **`snap-analysis.json`**: gains a header noting its historical status;
  content unchanged.
- **AI tooling**: unaffected. `tutorials/INSTRUCTIONS.md` and the
  `create-lab` skill don't depend on packaging.
- **Users / operators**: no behavior change. External bookmarks to specific
  paragraphs of INSTALL.md or SNAP_PACKAGING.md that describe behavior may
  no longer match if the paragraph moved to spec content — but the spec is
  discoverable via the Getting-started table and the ref table.
- **Future work explicitly unblocked but out of scope**:
  - A hook or CI check enforcing "every archive adds a CHANGELOG entry"
    (thread from earlier).
  - A capability spec for the LXD access layer (`backend/lxd.js`).
