## 1. Author-side prep (no repo writes)

- [x] 1.1 Re-read `README.md` end-to-end and identify every line that belongs to
      dev-setup vs public orientation; produce an internal split-plan (verify: plan
      lists which paragraphs move to `HACKING.md` and which stay in `README.md`).
- [x] 1.2 Re-read `INSTALL.md` and `SNAP_PACKAGING.md` and enumerate every stale
      or contradicted claim identified during propose (port 5173 in the snap doc,
      any cross-doc duplication, any spec-worthy claim); output a concrete diff list
      (verify: list is exhaustive against `git grep 5173` and against the two docs).
- [x] 1.3 Re-read `tutorials/README.md` and identify the "restart the backend" line
      plus the step-frontmatter-title claim; confirm each against the code
      (`backend/server.js` step endpoint + validation endpoint) (verify: identified
      lines with line numbers).
- [x] 1.4 Re-read `MULTIUSER_TESTING.md` and map every prose paragraph and every
      code fence to one of: (a) migrated to `teaching-sessions` spec, (b) migrated
      to `docs/manual-testing-recipes.md`, (c) deleted as stale (verify: mapping
      covers 100% of the file).

## 2. Land the two capability specs into main specs

- [x] 2.1 Verify the two delta specs under
      `openspec/changes/rationalize-docs/specs/` pass validation
      (`openspec validate rationalize-docs --strict` reports no errors).
- [x] 2.2 Create `openspec/specs/teaching-sessions/spec.md` from the delta and
      verify the resulting main spec includes every scenario from the delta.
- [x] 2.3 Create `openspec/specs/tutorial-format/spec.md` from the delta and
      verify the resulting main spec includes every scenario from the delta.

## 3. Extract HACKING.md

- [x] 3.1 Create `HACKING.md` at repo root with dev-setup content extracted per the
      split plan from 1.1; include: prerequisites, `npm install` steps, backend
      dev run (`npm run dev:backend`, port 3001 in snap / 3002 in dev), frontend
      dev run (port 5173), LXD requirements, node-pty build notes, dev-flow tips.
      Verify: `HACKING.md` renders cleanly and a fresh clone following it produces
      a working dev environment (mental walk-through counts; no CI required).

## 4. Extract manual testing recipes

- [x] 4.1 Create `docs/manual-testing-recipes.md` containing the curl and DevTools
      recipes from `MULTIUSER_TESTING.md`, retitled and reframed as "manual
      testing recipes for teaching sessions" rather than a testing guide. Verify:
      every recipe from the source file has an equivalent block in the new file.

## 5. Doc surgery pause point (user review required)

- [x] 5.1 Prepare side-by-side old/new diffs for `README.md`, `INSTALL.md`,
      `SNAP_PACKAGING.md`, and `tutorials/README.md`. Present them to the user in
      one message. Verify: user has replied with "go" (or per-file revisions).

- [x] 5.2 Apply the approved edits to `README.md`. Verify: file passes markdown
      linting (or manual read) and no dev-setup content remains outside the link
      to `HACKING.md`.

- [x] 5.3 Apply the approved edits to `INSTALL.md`. Verify: every stale claim
      from 1.2 has been addressed; no removed content unless the user approved it.

- [x] 5.4 Apply the approved edits to `SNAP_PACKAGING.md`. Verify: the port 5173
      note is corrected or removed; no removed content unless the user approved it.

- [x] 5.5 Apply the approved edits to `tutorials/README.md`. Verify: the
      "restart the backend" claim is corrected, the step-frontmatter-title claim is
      corrected, the file cross-links to the `tutorial-format` spec.

## 6. Retire MULTIUSER_TESTING.md

- [x] 6.1 Ask the user: delete outright, or reduce to a one-line redirect stub
      pointing to `docs/manual-testing-recipes.md` and the `teaching-sessions`
      spec. Record the choice. **Decision: delete outright.**

- [x] 6.2 Execute the chosen retirement (delete or stub). Verify:
      `git grep -l MULTIUSER_TESTING` returns no live references (or only the
      stub, if that was chosen).

## 7. Final validation

- [x] 7.1 Run `openspec validate rationalize-docs --strict` and verify no errors.

- [x] 7.2 Verify `openspec list` shows the two new capabilities under
      `openspec/specs/` after archive/sync.

- [x] 7.3 Grep the repo for cross-references to renamed/deleted files
      (`MULTIUSER_TESTING`, extracted dev-setup sections) and confirm every hit
      either points to the new home or is intentionally obsolete history.
