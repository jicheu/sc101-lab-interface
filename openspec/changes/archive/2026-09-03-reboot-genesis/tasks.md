## 1. Move genesis.md

- [x] 1.1 `git mv genesis.md docs/genesis.md` (creates `docs/` if needed;
      preserves rename history). Verify: `git status` shows a single rename,
      not a delete-plus-add; `docs/genesis.md` exists at the new path;
      `genesis.md` does not exist at the root.

## 2. Create CHANGELOG.md

- [x] 2.1 Create `CHANGELOG.md` at the repo root using a hybrid Keep-a-Changelog
      structure. Include:
      * A preamble stating the file's scope (user-visible changes going
        forward), a pointer to `docs/genesis.md` for pre-CHANGELOG history,
        and the standing instruction: **"Every archived OpenSpec change
        adds an entry under `[Unreleased]`."**
      * An `## [Unreleased]` section with two entries corresponding to the
        already-archived changes, each linking to its archive directory:
        * `rationalize-docs` under `### Added` / `### Changed` / `### Removed`
          as appropriate (introduced OpenSpec + two capability specs;
          extracted `HACKING.md` and `docs/manual-testing-recipes.md`;
          retired `MULTIUSER_TESTING.md`).
        * `clean-fossils` under `### Removed` / `### Changed` / `### Fixed`
          as appropriate (deleted three fossil scripts; refactored
          `start.sh`; fixed `PROJECT_REPORT.md` reference table drift).
      Verify: the file parses as valid Markdown; both archive-directory
      links resolve to existing paths.

## 3. Update references to genesis.md

- [x] 3.1 Update `README.md`: the "Understand what got built and why" row of
      the Getting-started table changes `[genesis.md](./genesis.md)` to
      `[genesis.md](./docs/genesis.md)`. Verify: `git grep 'genesis' README.md`
      shows exactly one hit, pointing at `docs/genesis.md`.

- [x] 3.2 Update `HACKING.md`: the "Build history" section's link to
      `[`genesis.md`](./genesis.md)` becomes
      `[`docs/genesis.md`](./docs/genesis.md)`. Verify:
      `grep genesis HACKING.md` shows exactly one hit, pointing at
      `docs/genesis.md`.

- [x] 3.3 Update `PROJECT_REPORT.md`: six references to `./genesis.md`
      become `./docs/genesis.md`. Verify: `grep -c './genesis.md'
      PROJECT_REPORT.md` returns 0; `grep -c './docs/genesis.md'
      PROJECT_REPORT.md` returns 6.
      **Note during apply:** the file has 5 markdown links + 1 unlinked
      backticked mention (line 123). All 6 mentions were updated. The
      link count is 5 (not 6), but the intent — zero stale refs, every
      mention pointing at the new location — is met.

- [x] 3.4 In `PROJECT_REPORT.md`'s Reference documentation table
      (§ around line 241), add a new row pointing at `CHANGELOG.md`
      ("User-visible changes going forward"). Verify: the row exists and
      its link resolves.

## 4. Final validation

- [x] 4.1 Run `openspec validate reboot-genesis --strict` and verify no errors.

- [x] 4.2 Verify `git grep '(?<!/)genesis\\.md' -- ':!openspec/changes/archive/'`
      (root-relative `genesis.md` references outside the archive) returns
      no matches. The archive directories retain their original references
      as historical record; they are not updated.

- [x] 4.3 Verify `docs/genesis.md` exists, `CHANGELOG.md` exists at the
      repo root, and all links added or updated in tasks 2 and 3 resolve to
      existing paths.

## 5. Standing-instruction self-application (out-of-band during apply)

- [x] 5.1 Add a `reboot-genesis` entry to `CHANGELOG.md`'s `[Unreleased]`
      section, self-applying the standing instruction introduced by this
      change (added a "Moved" entry under `### Changed` for the
      genesis.md relocation and a "Added CHANGELOG.md" entry under `### Added`).
      Verify: `CHANGELOG.md` mentions the `2026-09-03-reboot-genesis`
      archive path; that path will exist after archive.

      **Note during apply:** this task was not in the original tasks.md; it
      was added after task 4 completed, with explicit user consent
      ("go with (a), before archive"). The standing instruction is now
      immediately valid on the change that introduced it.
