## Context

See proposal.md for motivation. Ground truth for this spec came from reading
`snap/snapcraft.yaml`, `snap-tutorials/snapcraft.yaml`, `snap/hooks/install`,
and the four places `backend/` reads `$SNAP`, `$SNAP_DATA`, `$SNAP_COMMON`.
The existing prose docs (`INSTALL.md`, `SNAP_PACKAGING.md`,
`PROJECT_REPORT.md`) were used as a *starting point*, not authoritative:
where they contradicted `snapcraft.yaml`, `snapcraft.yaml` wins.

## Goals / Non-Goals

**Goals:**

- Capture the operator-facing packaging contract as a testable spec.
- Trim prose docs so behavior claims live in the spec, operational how-tos
  stay in the docs.
- Give future packaging changes a spec to write deltas against.

**Non-Goals:**

- Change the build. `snap/snapcraft.yaml` is untouched.
- Commit to specific interface version strings, plugin choices, or Node.js
  version in the spec. Those are implementation.
- Cover the LXD access layer as a capability. Adjacent, but a separate spec.
- Redesign the operator override mechanism. The spec captures what exists
  (survive-refresh + precedence via tutorial-format); does not change it.

## Decisions

### Capability boundary: operator-facing, not build-facing

Two things could have gone in `snap-packaging`:

- **A. Operator contract** — what an operator installing SC101 can rely on.
- **B. Build recipe** — how the snap is produced (base, plugin, override-build).

Chose **A only**. Rationale: (B) is implementation. Changing base from
`core24` to `core26` or reorganizing `override-build` shouldn't require a
spec delta if the operator contract (A) is preserved. Behavior specs are
about what consumers rely on; operators are consumers here, snap builders are
not.

Alternative considered: put both in the spec. Rejected — every build tweak
would become an ADDED/MODIFIED delta and the spec would churn on
implementation details.

### Abstract the content-interface version, don't pin it

The current implementation uses `sc101-tutorials-v1` as the content-interface
version string. The spec says "versioned content interface" without pinning
`v1`, per user decision Q2 (b).

Alternative considered: pin `sc101-tutorials-v1` in the spec. Rejected —
would make every content-interface version bump a spec delta. The operator
contract is "versioning exists and mismatches are rejected", not "the
current version is v1".

Trade-off: if someone reads the spec looking for "which content string do I
use for my third-party content snap?", they have to consult `snapcraft.yaml`
or the how-to. Accepted; that's how implementation details should be found.

### Cross-reference `tutorial-format` for override precedence, don't duplicate

Q1 was resolved to keep `Tutorials root resolution` in `tutorial-format`.
`snap-packaging`'s override requirement covers only the operator-visible
existence and refresh-survival of the override path; the precise resolution
order lives in `tutorial-format`.

Alternative considered: move the requirement wholesale into `snap-packaging`
(REMOVED delta on `tutorial-format`, ADDED here). Rejected in the
pre-propose discussion: the resolution mechanism is intrinsically about how
the platform *finds tutorial content*, which is a tutorial-format concern.

### `snap-analysis.json` gets a header, not deletion

Q4 was resolved to (c): mark as historical, keep as provenance.

Alternative considered: delete it. Rejected — it was the output of the
snap-analyzer skill during initial packaging, and the file's own creation
date (Jun 30) makes its historicity self-documenting once labeled. Same
treatment as `docs/genesis.md`.

### Daemon-starts-without-LXD is a real requirement, not an assumption

The scenarios explicitly say: platform starts even if `lxd` isn't connected,
even if content isn't connected. This is the actual behavior (verified in
`backend/server.js` — no top-level LXD check gates daemon start), and it's
worth being explicit about: it enables partial installs, staging
environments, and graceful degradation.

## Risks / Trade-offs

- **Risk**: A future implementation change reduces the daemon's tolerance
  for missing interfaces (e.g., adds a top-level LXD probe that exits on
  failure). → Mitigation: the spec now says the daemon MUST start; that
  change becomes a spec-visible regression.

- **Risk**: The "port 3001" requirement pins an implementation detail into
  the spec. → Mitigation: it's on the operator contract because operators
  configure reverse proxies and firewalls against it. Changing it *is* a
  spec-worthy change. Accepted.

- **Trade-off**: The spec doesn't mention specific interface names beyond
  `network`, `network-bind`, `lxd`. Left the content interface's exact plug
  and slot names abstract. Third-party content-snap authors will need to
  read the how-to for the exact names — accepted; keeps the spec stable
  through implementation changes.

- **Trade-off**: Doc trimming is deliberately conservative. INSTALL.md and
  SNAP_PACKAGING.md keep every step and every troubleshooting section;
  only *behavior claims* are removed and replaced with spec references.
  If either doc turns out to still have drift, that's a future change.

## Open Questions

None that block planning. Two things to keep on the shelf:

- Should the "every archive adds a CHANGELOG entry" standing instruction
  become enforced via a hook or CI check? (Thread H equivalent, out of
  scope here.)
- Should there be a `lxd-access` capability spec for the REST-over-unix-
  socket layer in `backend/lxd.js`? (Related but distinct; deferred.)
