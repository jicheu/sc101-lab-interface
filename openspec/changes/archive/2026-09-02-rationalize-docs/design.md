## Context

See proposal.md for motivation. The repo has six root-level markdown docs with
overlapping scopes and drifted content, plus a running system whose behavior for two
capabilities (teaching sessions, tutorial format) is not captured in any spec or
authoritative doc. OpenSpec is set up but empty. This change is doc surgery plus the
first two OpenSpec capability specs; there is no runtime behavior change.

Two audience segments matter here and shape the doc split:

- **Public** — visitors landing on the GitHub page. `README.md` only.
- **Private** — the maintainer and future-maintainer. Everything else. Terse and
  blunt is fine.

## Goals / Non-Goals

**Goals:**

- Make specs the source of truth for the two capabilities we care about most.
- Eliminate drift and duplication among the private docs.
- Preserve every existing operational recipe (nothing useful is lost).
- Preserve the AI-authoring pipeline as-is (`tutorials/INSTRUCTIONS.md` and the
  `create-lab` skill layer on top of the tutorial-format spec).

**Non-Goals:**

- Backfill `genesis.md` phases 36+ (deferred to a separate future change).
- Capture other capabilities as specs (LXD lifecycle, tutorial import pipeline as a
  first-class capability, session persistence). Deferred.
- Polish `PROJECT_REPORT.md` beyond touching its "as of" date if it happens
  incidentally.
- Change any runtime behavior.
- Rewrite `INSTALL.md` or `SNAP_PACKAGING.md` structurally. Drift is fixed in
  place, not by re-architecting these docs.

## Decisions

### Two capability specs, not one

`teaching-sessions` and `tutorial-format` are independent concerns with different
audiences and different code owners in the backend. Merging them would obscure that.
Keeping them separate also gives us a clean pattern for future capabilities.

Alternative considered: a single `sc101-platform` mega-spec. Rejected — too
coarse-grained; OpenSpec deltas would become churny.

### KillerCoda is an import edge, not a runtime format

The tutorial-format spec explicitly names KillerCoda as an accepted *source* that is
converted to SC101 at import time, and requires that no runtime path read it. This
matches the code and prevents future contributors from writing readers that widen the
runtime surface.

Alternative considered: define a common "tutorial ingestion" capability that covers
both formats. Rejected for this change — SC101 is what the platform reads at rest;
KillerCoda is one specific edge. If tutorial import grows more sources or richer
lifecycle, a separate `tutorial-import` capability spec is the right home.

### Extract `HACKING.md` rather than section-header the README

`README.md` currently mixes public orientation with dev-setup detail. The two
audiences want different things (public: "what is this?", private: "how do I run the
backend?"). A section-header split leaves dev-setup permanently visible to strangers
and permanently hard to update without touching public-facing text. Extracting to
`HACKING.md` makes both files smaller and each has one job.

### Retire `MULTIUSER_TESTING.md`; do not rename

The file has three tangled jobs (spec-shaped behavior description, curl recipes,
stale next-steps list). The right final state is: behavior in the spec, recipes in a
neutral file, and the stale next-steps deleted. Renaming `MULTIUSER_TESTING.md` to
something else would just carry the tangle forward. Git history preserves the
retired content for anyone who wants it.

### `docs/manual-testing-recipes.md`, not appended to `HACKING.md`

Confirmed with the user. Keeps `HACKING.md` focused on "how to develop", not "how
to poke live endpoints".

### Spec fidelity: capture what the code does, not what the docs claim

Where doc and code disagree (step frontmatter `title` requirement, tutorial reload
semantics, "backend needs frontend components" claim about teaching mode), the specs
match the code. The user confirmed this rule upfront.

Behaviors the code has but that the specs deliberately leave loose:
- Exact join-code alphabet, length, and collision handling (spec says "short, opaque,
  unique" — leaves room for future improvement without breaking the spec).
- Exact idle-stop and expiry timings (spec says "bounded" and "threshold" — leaves
  operational tuning free).
- Whether tutorial `environment.dev.image` and `.prestart` are ever consumed (spec
  documents these as metadata-only for now, non-committally).

### Spec fidelity: what the specs do NOT cover

The specs describe the current shipped behavior. Known imperfections (e.g., "teachers
join read-only by default" being a comment-only rule with no scenario coverage,
`maxParticipants` being hardcoded to 20) are captured as behavior but not as design
constraints. If we want to change these, that's a future change with its own delta.

## Risks / Trade-offs

- **Risk**: Doc consumers with bookmarks to `MULTIUSER_TESTING.md` get 404. →
  Mitigation: the manual-testing recipes file replaces its practical value; the
  retirement is called out in the change notes. Optional secondary mitigation: leave
  a one-line stub `MULTIUSER_TESTING.md` pointing at the new files. Undecided; will
  ask at apply time.

- **Risk**: Extracting `HACKING.md` breaks external "how do I run this locally"
  references to `README.md`. → Mitigation: the trimmed README explicitly links to
  `HACKING.md` at the top.

- **Risk**: Spec captures a behavior we later regret and no longer want to be
  bound to (e.g., single-active-connection-per-username as a hard rule). →
  Mitigation: this is what OpenSpec deltas are for. Capturing behavior is not
  committing to it forever; it makes future changes visible.

- **Trade-off**: The specs are prose-heavy for behaviors that could be tightened
  into machine-checkable rules later. Accepted — better a readable behavior spec
  now than an untested one that pretends to be a contract.

- **Trade-off**: `tutorials/README.md` and the `tutorial-format` spec have some
  necessary overlap (folder layout, frontmatter fields). Accepted — the spec is
  normative; `tutorials/README.md` is a friendly view that points at it.

## Migration Plan

The propose phase produces artifacts only. The apply phase does the surgery in this
order:

1. Create `openspec/specs/teaching-sessions/spec.md` and
   `openspec/specs/tutorial-format/spec.md` (specs land in main via `openspec sync`
   or `archive`; the delta files in the change directory drive that).
2. Create `HACKING.md` (dev setup extracted from README).
3. Create `docs/manual-testing-recipes.md` (curl/DevTools recipes from
   MULTIUSER_TESTING).
4. Modify `README.md`, `INSTALL.md`, `SNAP_PACKAGING.md`, `tutorials/README.md`
   (drift fixes; cross-links to specs and to HACKING).
   **User has requested a side-by-side pause at this point** for review.
5. Delete `MULTIUSER_TESTING.md` after the user has confirmed migration is
   complete. Alternative: reduce to a one-line pointer stub. Decision deferred to
   the apply-phase check-in.

No rollback is needed for a docs-only change; `git revert` is the rollback plan if
anything is wrong.

## Open Questions

None that block planning. Two deferrable decisions to resolve at apply time:

- Delete `MULTIUSER_TESTING.md` outright, or reduce to a redirect stub? (asked
  during propose, deferred to apply)
- Does `PROJECT_REPORT.md`'s "as of 2026-07-03" get bumped opportunistically, or
  left alone? (leaning: leave alone; it's a retrospective, not a living doc)
