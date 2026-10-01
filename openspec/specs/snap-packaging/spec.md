# snap-packaging Specification

## Purpose

Defines the operator-facing contract of SC101's snap distribution — what
snaps ship, how they connect, and what operational guarantees the platform
makes to whoever installs and runs it — so that installation and operational
docs remain honest and so that future packaging changes are visible against
a spec.

## Requirements

### Requirement: Two-snap distribution

The system SHALL be distributable as two independently-versioned snaps: a
**platform snap** containing the backend, the built frontend, and the daemon
entrypoint; and a **content snap** containing tutorial markdown content. The
platform snap SHALL function without the content snap — tutorial listings
will simply be empty until content is connected — so operators can install
the platform first and pick their content pack independently.

#### Scenario: Platform installed without content

- **WHEN** only the platform snap is installed
- **THEN** the daemon starts successfully, the HTTP surface is available, and
  the tutorial-list endpoint returns an empty list.

#### Scenario: Platform and default content installed

- **WHEN** both the platform snap and its default content snap are installed
  and their content interface is connected
- **THEN** the tutorial-list endpoint returns the tutorials from the content
  snap.

#### Scenario: Content pack swap

- **WHEN** an operator disconnects the current content snap, installs a
  different content snap that exposes the same content interface, and
  connects it
- **THEN** the tutorial-list endpoint returns the tutorials from the new
  content snap, without restarting the platform daemon.

### Requirement: Strict confinement

The platform snap SHALL declare `confinement: strict` and MUST NOT require
`classic` confinement or any per-install override to function. All access to
the host system MUST go through declared interfaces.

#### Scenario: Strict confinement declared

- **WHEN** the platform snap is inspected
- **THEN** its confinement is `strict` and its grade is `stable`.

#### Scenario: No classic escape

- **WHEN** an operator installs the platform snap in the default (non-devmode,
  non-dangerous) way from the store
- **THEN** the daemon starts and every declared feature works without the
  operator needing to override confinement.

### Requirement: HTTP and WebSocket surface

The platform snap's daemon SHALL listen on TCP port 3001 for HTTP and
WebSocket traffic. The surface MUST include the REST endpoints under `/api/`,
the terminal WebSocket at `/ws/terminal`, the sessions-dashboard WebSocket at
`/ws/sessions`, and the built frontend served as static files at all other
paths.

#### Scenario: Port 3001 is the surface

- **WHEN** the platform snap daemon is running
- **THEN** an HTTP request to `http://<host>:3001/` receives the frontend, and
  an HTTP request to `http://<host>:3001/api/tutorials` receives a JSON
  response.

#### Scenario: No separate frontend process

- **WHEN** the platform snap is installed
- **THEN** no additional process on any other port is required to serve the
  UI; the backend serves the built frontend directly on the same port.

### Requirement: Interface connections

The platform snap SHALL auto-connect the `network` and `network-bind`
interfaces. It SHALL require manual connection of the `lxd` interface (for
container management) and the content interface (for tutorial content).
The daemon MUST start regardless of the state of manually-connected
interfaces; features that depend on them fail gracefully when they are
not connected.

#### Scenario: Auto-connected on install

- **WHEN** the platform snap is installed
- **THEN** `network` and `network-bind` are automatically connected without
  operator action.

#### Scenario: Daemon starts without LXD interface

- **WHEN** the platform snap is installed and the `lxd` interface is not
  connected
- **THEN** the daemon still starts and the tutorial browser is accessible,
  but attempts to open a terminal session fail with a clear error.

#### Scenario: Daemon starts without content interface

- **WHEN** the platform snap is installed and no content interface is
  connected
- **THEN** the daemon starts and the tutorial-list endpoint returns an empty
  list rather than an error.

### Requirement: Session persistence across snap refresh

Session records SHALL survive a snap refresh of the platform snap. LXD
containers created by the platform SHALL also survive refresh, because they
live outside the snap in the host LXD daemon.

#### Scenario: Session record survives refresh

- **WHEN** the platform snap is refreshed to a new revision while a session
  exists
- **THEN** after the refresh, the same session record is readable and its
  associated container is still known to LXD.

#### Scenario: Fresh install initializes empty session store

- **WHEN** the platform snap is installed for the first time on a host
- **THEN** an empty session store is created with restricted permissions,
  and the platform starts without error.

### Requirement: Versioned content interface

The platform snap SHALL consume tutorial content through a **versioned
content interface**: a `content`-type snap interface whose content identifier
carries an explicit version tag. Content snaps producing a different version
MUST NOT satisfy the platform's plug. Introducing an incompatible content
format SHALL require declaring a new interface version, so operators with
older content packs are not silently exposed to breakage.

#### Scenario: Matching version connects

- **WHEN** a content snap declares the current content-interface version and
  is connected to the platform's plug
- **THEN** the connection succeeds and the platform reads content from the
  mount point.

#### Scenario: Mismatched version is rejected

- **WHEN** a content snap declares a different content-interface version than
  the platform expects
- **THEN** the snap system refuses to connect the interface, and the platform
  behaves as if no content were connected.

### Requirement: Operator content override

Operators SHALL be able to override the connected content snap by placing
tutorial content in a writable location within the platform's snap runtime,
which takes precedence over the content-interface mount at read time. The
override SHALL survive snap refresh. The precise resolution order between
override, content mount, and any development fallback is defined by the
`tutorial-format` capability's *Tutorials root resolution* requirement; this
requirement covers only the operator-facing existence and refresh survival
of that override path.

#### Scenario: Override survives refresh

- **WHEN** an operator writes tutorial content into the override location and
  then refreshes the platform snap
- **THEN** the override content is still present after refresh, and the
  platform continues to read it.

#### Scenario: No override present

- **WHEN** the override location contains no tutorial content
- **THEN** the platform reads content from the connected content snap
  instead, per `tutorial-format`'s resolution rules.

### Requirement: Daemon lifecycle

The platform snap SHALL expose its backend as a `simple` daemon that starts
automatically on install and refresh, and is manageable through standard
snap service commands (`snap start`, `snap stop`, `snap restart`,
`snap services`). Stopping the daemon MUST NOT destroy sessions or their
associated LXD containers; sessions become inaccessible only for as long as
the daemon is stopped.

#### Scenario: Daemon starts on install

- **WHEN** the platform snap is installed on a fresh system with all
  interfaces connected
- **THEN** the daemon is running and its port is bound, without any
  additional operator action.

#### Scenario: Daemon restart preserves sessions

- **WHEN** an operator stops and starts the platform snap daemon while
  sessions exist
- **THEN** after start, the session store is intact and containers can be
  reattached.
