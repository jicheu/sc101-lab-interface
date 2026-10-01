## 1. Land the spec into main

- [x] 1.1 Validate the delta spec passes strict validation
      (`openspec validate snap-packaging --strict`).
- [x] 1.2 Create `openspec/specs/snap-packaging/spec.md` from the delta
      (copy `## Purpose` verbatim; rename `## ADDED Requirements` to
      `## Requirements`; preserve every requirement block and every
      scenario). Verify: `openspec list --specs` shows `snap-packaging` with
      the expected requirement count; `openspec validate --specs` passes.

## 2. Trim INSTALL.md

- [x] 2.1 Read `INSTALL.md` end-to-end. For each behavior claim that is now
      spec content, replace the prose with a short reference to the
      `snap-packaging` spec. Concrete claims to move:
      * "Two interfaces must be connected manually … not auto-connected" →
        one-liner referencing the spec's *Interface connections*
        requirement, keeping the actual `snap connect` commands.
      * "The platform daemon does not need to restart after refreshing the
        tutorials snap — tutorials are read from disk on every API request"
        → one-liner referencing the spec's *Two-snap distribution* + content
        swap scenario.
      * "Platform … keeps session data by default" → reference to *Session
        persistence across snap refresh*.
      Keep every command block, every troubleshooting section, and the
      "Using a Custom Tutorial Pack" section. Verify: no removed content
      that isn't literally a duplicate of a spec claim; word count drop is
      modest (target: file stays >80% of its current length).
      **Note during apply:** all three behavior claims replaced with spec
      references; every command preserved. File grew from 279→284 lines
      (spec-references are longer than the prose they replaced); still
      meets the >80% criterion.

## 3. Trim SNAP_PACKAGING.md

- [x] 3.1 Same treatment. Behavior claims to move:
      * "The `network` and `network-bind` interfaces are auto-connected" →
        reference to *Interface connections*.
      * "The 'lxd' interface must be manually connected" → same reference.
      * "Frontend is pre-built during snap creation and served as static
        files" → reference to *HTTP and WebSocket surface* + *No separate
        frontend process* scenario.
      * "Tutorials are read on every API request — no platform restart
        needed after swapping snaps" → reference to *Two-snap distribution*
        content-swap scenario.
      Keep every build step, every `snapcraft` command, and every
      troubleshooting section. Verify: same criteria as INSTALL.md
      (>80% length, no unique content lost).
      **Note during apply:** all 4 claims replaced; every command
      preserved. File grew 189→201 lines. Also added session-persistence
      reference to the "Important Notes" list since that section is a
      behavior-summary and would otherwise duplicate the spec.

## 4. Header on snap-analysis.json

- [x] 4.1 Add a top-level `"__note"` field (or equivalent JSON-friendly
      marker) at the beginning of `snap-analysis.json` reading:
      "HISTORICAL SNAPSHOT from initial snap packaging (Jun 2025).
       Superseded by snap/snapcraft.yaml and the snap-packaging capability
       spec at openspec/specs/snap-packaging/spec.md. Retained for
       provenance only."
      Verify: `python3 -c "import json; json.load(open('snap-analysis.json'))"`
      succeeds (file remains valid JSON).

## 5. Cross-references

- [x] 5.1 Add a row to `README.md`'s Getting-started table linking to the
      `snap-packaging` spec, alongside the two existing spec rows. Verify:
      the link resolves to `./openspec/specs/snap-packaging/spec.md`.
      **Note during apply:** the specs list in README is a bullet list
      below the Getting-started table, not a row within it. Added a
      third bullet next to `teaching-sessions` and `tutorial-format`.

- [x] 5.2 Add a row to `PROJECT_REPORT.md`'s Reference-documentation table
      pointing at `openspec/specs/snap-packaging/spec.md`
      ("Snap distribution contract"). Verify: link resolves.

## 6. CHANGELOG entry (self-apply the standing instruction)

- [x] 6.1 Add an entry under `[Unreleased]` in `CHANGELOG.md` for the
      `snap-packaging` change, split across `### Added` (the new capability
      spec) and `### Changed` (the trimmed INSTALL.md / SNAP_PACKAGING.md /
      snap-analysis.json / README.md / PROJECT_REPORT.md). Link the entry
      to the archive path `openspec/changes/archive/YYYY-MM-DD-snap-packaging/`
      (which will exist after archive). Verify: entry present; archive
      path matches today's date.

## 7. Final validation

- [x] 7.1 Run `openspec validate snap-packaging --strict`; expect clean.
      **Note during apply:** the name is now shared between an active change
      and a main spec, so the CLI reports ambiguity. Ran
      `openspec change validate snap-packaging --strict` instead — clean.

- [x] 7.2 Run `openspec validate --specs`; expect all three main specs
      (`teaching-sessions`, `tutorial-format`, `snap-packaging`) to pass.

- [x] 7.3 Verify all new cross-references resolve to existing files
      (README row, PROJECT_REPORT row, CHANGELOG links, INSTALL and
      SNAP_PACKAGING internal references to the spec).

- [x] 7.4 Grep for stale claims that should have moved to the spec.
      `git grep -n 'auto-connected'` should return only spec content plus
      the trimmed doc references, not standalone prose duplicates.
      **Note during apply:** one hit at `SNAP_PACKAGING.md:84` — the
      spec-referenced sentence that names `network` and `network-bind`
      then cross-refs the *Interface connections* requirement. Not stale;
      accepted.
