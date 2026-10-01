## Why

Three root-level artifacts (`fix-server.sh`, `server-snap-patch.sh`,
`snap-server-patch.js`) are fossils from the early CLI-based snap-packaging phase —
they injected code into `backend/server.js` that has since been folded into the
source directly. Nothing references them; they're just noise at the repo root
adding to the "what am I looking at" burden every time we open the tree.

`start.sh` (dev-only launcher) still works but has drifted: it echoes the wrong
backend port (3001, which is the snap port; dev is 3002) and uses machine-wide
`pkill` to clean up prior processes. Refactoring it into a small `trap`-based
wrapper around the existing `npm run dev:*` scripts removes the drift risk and
the pkill sledgehammer.

`PROJECT_REPORT.md`'s "Reference documentation" table wasn't updated during the
`rationalize-docs` change; three entries are stale or missing (the README row
still claims to cover dev setup; there's no row for `HACKING.md`, no row for
`docs/manual-testing-recipes.md`, no rows for the two new specs). Fixing this
completes the doc-rationalization work.

## What Changes

- Delete `fix-server.sh` (fossil; no live references).
- Delete `server-snap-patch.sh` (fossil; no live references).
- Delete `snap-server-patch.js` (fossil; no live references).
- Refactor `start.sh` into a small `trap`-based wrapper around
  `npm run dev:backend` + `npm run dev:frontend` so it stops duplicating logic
  that lives in `package.json` and stops printing the wrong port.
- Update `PROJECT_REPORT.md` § Reference documentation: correct the README row
  (no longer covers dev setup), add rows for `HACKING.md`,
  `docs/manual-testing-recipes.md`, and the two capability specs
  (`teaching-sessions`, `tutorial-format`).

Explicitly **not** part of this change:
- `snap-start.sh` (referenced by `snap/snapcraft.yaml`; live).
- `sc101-lab-interface_0.1.0_amd64.snap` (build output; kept as-is).
- `snap-analysis.json` (build-time record; kept as-is).
- Capturing snap packaging as a capability spec — noted as future work.

## Capabilities

No spec-level behavior change. This change removes fossil files, rewrites one
dev-only shell script without changing what it does, and updates a documentation
table. `.openspec.yaml` declares `skip_specs: true`.

## Impact

- **Code**: none. `backend/`, `frontend/`, `snap/` untouched.
- **Dev flow**: `start.sh` continues to work the same way from the user's
  perspective (one command, backend + frontend, Ctrl-C stops both).
  Implementation is simpler and no longer uses machine-wide `pkill`.
- **Docs**: `PROJECT_REPORT.md` ref table becomes accurate.
- **Snap packaging**: unaffected; the daemon still runs `snap-start.sh` from the
  snap.
- **Future work unblocked but out of scope**: capturing snap packaging as a
  capability spec (`snap-packaging`) — the drift-risk parallel to what we did
  for `teaching-sessions` and `tutorial-format`.
