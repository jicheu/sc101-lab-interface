## Purpose

Defines the on-disk format of tutorial content the platform reads at runtime — the
layout, identity, metadata, and step-file rules — so tutorial authors and importers
agree with what the platform actually enforces.

## ADDED Requirements

### Requirement: Two-level tutorial layout

The system SHALL organize tutorials as a two-level directory hierarchy: every
tutorial MUST live at `<tutorials-root>/<CourseDir>/<TutorialDir>/` and MUST contain
an `index.md` manifest at that path. Course directories and tutorial directories
whose names cannot be listed or whose `index.md` cannot be parsed MUST be skipped
without causing sibling tutorials to disappear from the listing.

#### Scenario: Well-formed tutorial

- **WHEN** a directory `<tutorials-root>/MyCourse/hello-world/` contains a valid
  `index.md`
- **THEN** the tutorial is included in the tutorial list under the course
  `MyCourse`.

#### Scenario: Sibling with broken index.md

- **WHEN** one tutorial's `index.md` fails to parse but another tutorial in the same
  course has a valid `index.md`
- **THEN** the tutorial list still contains the valid tutorial and the broken one is
  omitted.

#### Scenario: Course display name

- **WHEN** a course directory is named with underscores
- **THEN** the tutorial's `course` field in listings reports the name with
  underscores rendered as spaces.

---

### Requirement: Tutorials root resolution

The system SHALL resolve the tutorials root at startup in a fixed precedence order
so that operators can override packaged content without rebuilding. The precedence
MUST be: an override directory under `$SNAP_COMMON/tutorials` if `$SNAP_COMMON` is
set and that directory exists, otherwise `$SNAP/tutorials` if `$SNAP` is set,
otherwise a project-local `tutorials/` directory relative to the running backend.

#### Scenario: Snap override present

- **WHEN** the backend starts with `$SNAP_COMMON` set and
  `$SNAP_COMMON/tutorials/` exists
- **THEN** the tutorials root resolves to that directory and the content-snap mount
  is not used.

#### Scenario: Snap content mount

- **WHEN** the backend starts with `$SNAP` set and no override directory exists
- **THEN** the tutorials root resolves to `$SNAP/tutorials`.

#### Scenario: Development fallback

- **WHEN** the backend starts outside a snap runtime
- **THEN** the tutorials root resolves to the project-local `tutorials/` directory.

---

### Requirement: Tutorial identity and lookup

The system SHALL assign every tutorial a stable compound identifier
`<courseDir>/<tutorialDir>` (its **UID**) derived from disk paths, in addition to
its `id` field from frontmatter. Every listing entry MUST expose both. Runtime
lookup MUST accept the UID form as well as the legacy bare `id` form so existing
references continue to work.

#### Scenario: UID in listing

- **WHEN** a client fetches the tutorial list
- **THEN** each tutorial entry includes `courseId`, `folderId`, and `uid`, where
  `uid` is `<courseId>/<folderId>`.

#### Scenario: Lookup by UID

- **WHEN** a request references a tutorial by its UID `<courseDir>/<tutorialDir>`
- **THEN** the tutorial is resolved unambiguously to that directory.

#### Scenario: Lookup by legacy id

- **WHEN** a request references a tutorial by a bare `id` matching either the
  tutorial's frontmatter `id` or its folder name, and that reference is unambiguous
- **THEN** the tutorial is resolved to the corresponding directory.

---

### Requirement: Required tutorial frontmatter

The system SHALL require every tutorial's `index.md` to declare at minimum an
`id`, a `title`, and a non-empty `steps` array. Each entry in `steps` MUST have a
`file` naming a Markdown file that exists within the tutorial directory, and a
`title` used by the UI's step navigation. A tutorial whose `index.md` violates
these constraints MUST be reported as invalid by the validation endpoint.

#### Scenario: Missing required field

- **WHEN** the validation endpoint is invoked for a tutorial whose `index.md`
  omits any of `id`, `title`, or `steps`
- **THEN** the response reports the tutorial as invalid and names the missing
  field.

#### Scenario: Broken step reference

- **WHEN** an entry in `steps` names a `file` that does not exist inside the
  tutorial directory
- **THEN** the validation endpoint reports the tutorial as invalid and names the
  missing file.

#### Scenario: Step-list must be an array

- **WHEN** the `steps` field is not an array
- **THEN** the validation endpoint reports the tutorial as invalid.

---

### Requirement: Recognized optional frontmatter

The system SHALL recognize and preserve the following optional frontmatter fields
without treating their absence as an error: `description`, `difficulty`, `time`,
`tags`, `section`, `requires`, and `environment`. Optional fields MUST be exposed
verbatim on the tutorial's metadata so downstream consumers (the selector UI, the
authoring rulebook, external importers) can rely on them being propagated.

#### Scenario: Recognized field is preserved

- **WHEN** a tutorial's `index.md` declares `section: "Publishing Snaps"`
- **THEN** the tutorial's metadata reported by the list and meta endpoints
  contains `section: "Publishing Snaps"`.

#### Scenario: Absent optional field

- **WHEN** a tutorial's `index.md` omits `description`
- **THEN** the tutorial validates and appears in the tutorial list, with the
  `description` field simply absent from its metadata.

#### Scenario: environment field is metadata only

- **WHEN** a tutorial declares an `environment` block with a `dev.image` and
  `dev.prestart` commands
- **THEN** the metadata endpoint returns the `environment` block verbatim, and no
  behavior other than metadata propagation is guaranteed by this capability. Whether
  the runtime honors it is out of scope.

---

### Requirement: Step file rules

The system SHALL treat step files as Markdown documents whose YAML frontmatter is
optional. Any frontmatter present MUST be stripped before the step body is sent to
clients. Step titles displayed in the UI MUST come from the `steps` array in the
tutorial's `index.md`, not from step-file frontmatter.

#### Scenario: Step served without frontmatter

- **WHEN** a step is requested and its file has a YAML frontmatter block
- **THEN** the response body contains only the Markdown after the frontmatter, with
  no `---` delimiters and no frontmatter fields.

#### Scenario: Step file with no frontmatter

- **WHEN** a step file has no frontmatter at all
- **THEN** the step is served successfully; absence of frontmatter is not an error.

#### Scenario: Step title source

- **WHEN** the step's `index.md` entry declares `title: "Introduction"` and the
  step file itself declares a different title in its frontmatter
- **THEN** the UI uses `"Introduction"` from the `index.md` step entry.

---

### Requirement: Runnable code block annotation

The system SHALL treat any fenced code block whose info string contains the token
`run` after the language identifier as **runnable** — i.e. eligible for a UI
control that sends the block's contents to the active terminal. Blocks without the
`run` token MUST NOT be runnable. The annotation MUST be preserved through
tutorial-import conversion so imports from other formats surface as runnable
blocks where appropriate.

#### Scenario: Runnable block

- **WHEN** a step contains a fenced code block whose info string is `bash run`
- **THEN** the UI renders that block with a control that submits its contents to
  the terminal.

#### Scenario: Non-runnable block

- **WHEN** a step contains a fenced code block whose info string is `bash`
- **THEN** the block is rendered as code but has no run control.

---

### Requirement: Prerequisite declaration

The system SHALL let a tutorial declare zero or more prerequisite tutorials via a
`requires` array in `index.md`, listing either tutorial UIDs or legacy bare `id`
values. `requires` MUST be exposed on tutorial metadata so the UI can render the
dependency structure and can gate "start" actions on prerequisite completion. The
runtime file server MUST NOT prevent access to a tutorial's steps based on
prerequisites.

#### Scenario: requires is metadata

- **WHEN** a tutorial's `index.md` declares `requires: [SC101_Lab_Interface_playground/hello-snap]`
- **THEN** the tutorial's metadata exposes that list unchanged, and the step
  endpoint still serves its content regardless of whether the caller has completed
  the referenced tutorial.

---

### Requirement: Tutorial import as an edge, not a runtime format

The system SHALL support ingesting tutorials from remote sources (currently: a
GitHub repository URL) and MAY accept alternative source formats (currently:
KillerCoda). Any accepted source format MUST be converted to the runtime format
described in this capability before being written to the tutorials root. Once
imported, no runtime code path SHALL read the source format directly.

#### Scenario: Native import

- **WHEN** an imported repository contains an `index.md` at its root
- **THEN** the import validates and installs the tutorial verbatim into a course
  directory.

#### Scenario: KillerCoda single-tutorial import

- **WHEN** an imported repository contains an `index.json` at its root but no
  `index.md`
- **THEN** the import converts the KillerCoda structure into an SC101-format
  tutorial (generating an `index.md` with frontmatter and rewriting execute/copy
  annotations) before installation.

#### Scenario: KillerCoda multi-tutorial repo

- **WHEN** an imported repository has neither `index.md` nor `index.json` at its
  root, but contains subdirectories that each hold an `index.json`
- **THEN** each such subdirectory is converted and installed as a separate tutorial
  under the target course.

#### Scenario: Unknown format

- **WHEN** an imported repository matches none of the recognized shapes
- **THEN** the import is rejected with an error that names the failure, and no
  tutorial is installed.

#### Scenario: Lenient auto-fill on import

- **WHEN** an SC101-format tutorial being imported is missing `id`, `title`, or
  `steps` but has recoverable defaults (a folder name for id/title, discoverable
  `intro.md`/`stepN.md`/`finish.md` files for steps)
- **THEN** the import fills those fields in the generated `index.md`, reports the
  substitutions as warnings, and installs the tutorial.

#### Scenario: Non-recoverable import

- **WHEN** an imported tutorial has no discoverable step files and no `steps`
  frontmatter
- **THEN** the import is rejected with an error and no tutorial is installed.
