## 1. Delete superseded snap-patch fossils

- [x] 1.1 Confirm `fix-server.sh` has no live references
      (`git grep -l fix-server\\.sh` returns nothing outside its own path).
      Delete the file.
- [x] 1.2 Confirm `server-snap-patch.sh` has no live references
      (`git grep -l server-snap-patch\\.sh` returns nothing outside its own
      path). Delete the file.
- [x] 1.3 Confirm `snap-server-patch.js` has no live references
      (`git grep -l snap-server-patch\\.js` returns nothing outside its own
      path). Delete the file.

## 2. Refactor start.sh (R2: trap-based wrapper over npm scripts)

- [x] 2.1 Replace `start.sh` with a small `trap`-based wrapper that runs
      `npm run dev:backend &` and `npm run dev:frontend &` in the background
      and `wait`s, forwarding SIGINT/SIGTERM/EXIT to the process group so
      Ctrl-C stops both children. Remove machine-wide `pkill` calls and any
      hardcoded port echoes (they belong in `HACKING.md`, not `start.sh`).
      Verify: mental walkthrough — running `./start.sh` starts both processes,
      Ctrl-C stops both, and no `pkill node`/`pkill vite` fires.

## 3. Update PROJECT_REPORT.md reference table

- [x] 3.1 In `PROJECT_REPORT.md` § Reference documentation:
      correct the README row to reflect that dev setup no longer lives there;
      add a row pointing to `HACKING.md` (dev setup);
      add a row pointing to `docs/manual-testing-recipes.md`;
      add rows for `openspec/specs/teaching-sessions/spec.md` and
      `openspec/specs/tutorial-format/spec.md`.
      Verify: the table has no dangling links (`git grep` for each new path
      resolves to an existing file) and no row still misdescribes what its
      target covers.

## 4. Final validation

- [x] 4.1 Run `openspec validate clean-fossils --strict` and verify no errors.
- [x] 4.2 Verify `git grep -E 'fix-server\\.sh|server-snap-patch\\.sh|snap-server-patch\\.js'`
      returns no matches anywhere in the tree.
- [x] 4.3 Verify `snap-start.sh` still exists and is still referenced by
      `snap/snapcraft.yaml` (guardrail against accidental deletion of the
      snap daemon entrypoint).
