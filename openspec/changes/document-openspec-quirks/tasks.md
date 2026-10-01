## 1. Add "Working with OpenSpec" section to HACKING.md

- [x] 1.1 Add a new `## Working with OpenSpec` section to `HACKING.md`
      (near the end, after "Testing recipes", before "Build history"). The
      section MUST contain:
      * A short preamble stating that OpenSpec is the project's spec /
        change-tracking tool and that this section captures workflow
        conventions and known quirks specific to this project.
      * A `### Known quirks` subsection with the design.md-warning false
        positive documented: what it looks like (the exact warning text),
        why it happens (propose treats design as conditional; archive
        doesn't share that context), and the workaround (confirm
        "Proceed" at archive time; the omission was deliberate).
      * Room for additional quirks to be added later without restructuring.
      Verify: the section renders as valid Markdown; the "design.md
      reported 'ready'" phrase appears verbatim so a future contributor
      searching for the warning finds the explanation.

## 2. CHANGELOG entry

- [x] 2.1 Add an entry under `[Unreleased]` in `CHANGELOG.md` for the
      `document-openspec-quirks` change, under `### Added` (new HACKING.md
      section is user-visible for contributors). Link the entry to the
      archive path
      `openspec/changes/archive/2026-09-04-document-openspec-quirks/`
      (which will exist after archive). Verify: entry present; archive
      path matches today's date.

## 3. Final validation

- [x] 3.1 Run `openspec validate document-openspec-quirks --type change --strict`
      (verb-first form with `--type change` disambiguator). The `snap-packaging`
      archive showed that when a change and a spec share a name, bare
      `openspec validate <name> --strict` errors with "ambiguous"; using
      `--type change` is the current non-deprecated way to force change
      validation. Expect clean.
- [x] 3.2 Verify `HACKING.md` has a `## Working with OpenSpec` section and
      that "design.md reported 'ready'" appears verbatim in it.
- [x] 3.3 Verify `CHANGELOG.md`'s `[Unreleased]` section has the entry with
      the correct archive path.
