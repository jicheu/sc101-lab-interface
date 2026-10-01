## Purpose

Teaching sessions let one user (the owner) share a single live terminal with additional
users (participants) over the same running LXD container, with the owner controlling who
can type and who is view-only.

## ADDED Requirements

### Requirement: Session model

The system SHALL support two kinds of session that share a common shape: a **regular
session** owned by one user with an initially empty participant list and no join code,
and a **teaching session** which additionally has a join code generated at creation
time and a configurable default write permission for future participants. Every session,
regardless of kind, MUST expose an `owner` (with `username` and `role`), a
`participants` array (each with `username`, `role`, `canWrite`, `joinedAt`), a
`settings` object containing `allowStudentWrite` and `maxParticipants`, and lifecycle
timestamps (`createdAt`, `lastActiveAt`). A regular session's `joinCode` MUST be `null`;
a teaching session's `joinCode` MUST be a short, opaque, unique string.

#### Scenario: Creating a regular session

- **WHEN** a client requests creation of a regular session with a username
- **THEN** the system creates a session whose `owner.username` is the caller, whose
  `participants` list is empty, whose `joinCode` is `null`, and returns the session
  record.

#### Scenario: Creating a teaching session

- **WHEN** a client requests creation of a teaching session with a username and an
  optional `allowStudentWrite` flag
- **THEN** the system creates a session with `owner.role: 'teacher'`, an auto-generated
  non-null `joinCode`, and `settings.allowStudentWrite` set to the provided flag
  (defaulting to `false` when omitted).

#### Scenario: Missing username

- **WHEN** a session-creation request omits the username or provides only whitespace
- **THEN** the system rejects the request with a client error and does not create a
  session.

---

### Requirement: Joining by join code

The system SHALL let a non-owner user look up a session by join code and then join it
as a participant. Looking up a non-existent join code MUST NOT reveal information about
other sessions.

#### Scenario: Successful lookup and join

- **WHEN** a client presents a valid join code and then requests to join the referenced
  session with a fresh username and a role
- **THEN** the system adds the user to the `participants` list with `canWrite` set from
  `settings.allowStudentWrite` at join time, updates `lastActiveAt`, and returns the
  participant record and updated session.

#### Scenario: Unknown join code

- **WHEN** a client presents a join code that matches no session
- **THEN** the system returns a not-found response and no session is modified.

#### Scenario: Owner cannot join their own session

- **WHEN** the caller's username matches the session's `owner.username`
- **THEN** the join request is rejected with a client error.

#### Scenario: Rejoin replaces prior participant record

- **WHEN** a user with the same username re-joins a session they are already listed in
- **THEN** the prior participant entry for that username is removed and replaced with
  a fresh one carrying the new `joinedAt` timestamp.

#### Scenario: Session at capacity

- **WHEN** a join would bring the number of participants above `settings.maxParticipants`
- **THEN** the join is rejected with a client error and the session is not modified.

---

### Requirement: Write permission model

The system SHALL derive each connection's ability to send terminal input from the
session record: the owner is always allowed to write, and any other user's ability to
write is exactly their participant record's `canWrite` flag. A separate operation MUST
allow the owner (or any authorized caller) to toggle a specific participant's
`canWrite`, and that change MUST take effect on all already-established WebSocket
connections for that participant without requiring reconnection.

#### Scenario: Owner is always writable

- **WHEN** the terminal socket is opened for the session owner
- **THEN** the connection is granted write permission regardless of any participant
  record.

#### Scenario: Participant default at join time

- **WHEN** a participant joins a session whose `settings.allowStudentWrite` is `false`
- **THEN** the participant record is created with `canWrite: false` and any subsequent
  input attempt from that participant is rejected until the flag is changed.

#### Scenario: Live permission grant

- **WHEN** the participant's `canWrite` is toggled from `false` to `true` while the
  participant already has an open terminal WebSocket
- **THEN** the participant's next `input` message is accepted, without the socket being
  closed or reconnected.

#### Scenario: Live permission revocation

- **WHEN** the participant's `canWrite` is toggled from `true` to `false` while the
  participant already has an open terminal WebSocket
- **THEN** subsequent `input` messages from that connection are rejected with a
  permission error, and the connection is not closed by the server.

#### Scenario: Read-only input rejection

- **WHEN** a connection whose `canWrite` is `false` sends an `input` message
- **THEN** the server replies with an error message describing the missing permission
  and does not forward the input to the terminal.

---

### Requirement: Shared-terminal semantics

The system SHALL run at most one shell process per container regardless of how many
users are connected to that container's session. All output produced by that shell
MUST be broadcast to every open connection for that container. Terminal resize
requests MUST be reconciled so that the effective size is at least as large as any
connected client asks for, so no client's viewport is silently truncated.

#### Scenario: Shared output

- **WHEN** two users are connected to the same session and any input produces output
- **THEN** both users receive the same output stream at the same time.

#### Scenario: Second user joins mid-session

- **WHEN** a user connects to a session whose shell is already running
- **THEN** the new connection is attached to the existing shell rather than starting
  a new one, and any subsequent shell output is broadcast to the new connection too.

#### Scenario: Single active connection per username

- **WHEN** a user opens a new terminal WebSocket for a session while they already have
  an open WebSocket for that same session
- **THEN** the prior connection is closed by the server before the new one is added.

#### Scenario: Resize reconciliation

- **WHEN** two connected clients report different terminal dimensions
- **THEN** the shell is resized to at least the largest reported columns and rows.

---

### Requirement: Presence and session-event broadcasts

The system SHALL emit two kinds of message on the terminal WebSocket in addition to
raw shell output: a **presence message** listing the current set of connected users
with their role and current `canWrite`, and a **session-event message** for
higher-level lifecycle events. Presence MUST be broadcast whenever the set of
connections or their permissions changes.

#### Scenario: Presence on join

- **WHEN** a new client connects to a session's terminal
- **THEN** every open connection for that session (including the new one) receives a
  presence message reflecting the updated participant list.

#### Scenario: Presence on permission change

- **WHEN** any participant's `canWrite` is changed via the permissions operation
- **THEN** every open connection for that session receives an updated presence
  message.

#### Scenario: Teacher-joined event

- **WHEN** a user connects as a non-owner teacher
- **THEN** in addition to the presence broadcast, a session-event message announcing
  the teacher join is broadcast to every open connection.

#### Scenario: Owner-disconnect side effect

- **WHEN** the owner disconnects from the terminal while at least one other user is
  still connected and a tutorial is active on the session
- **THEN** the session's `tutorialId` is cleared, and a session-event announcing the
  owner's departure is broadcast to the remaining connections.

---

### Requirement: Sessions dashboard stream

The system SHALL expose a dedicated WebSocket endpoint that any client can subscribe
to in order to receive a live view of the full session list. Subscribers MUST receive
a snapshot immediately on connect and an updated snapshot whenever any session is
created, joined, left, updated, or removed.

#### Scenario: Initial snapshot

- **WHEN** a client connects to the sessions dashboard WebSocket
- **THEN** the client immediately receives one message containing the current list of
  sessions.

#### Scenario: Broadcast on session mutation

- **WHEN** any session is created, mutated, joined, left, or removed
- **THEN** every subscriber receives an updated session-list message reflecting the
  new state.

---

### Requirement: Idle and expiry lifecycle

The system SHALL keep the underlying container running while at least one user is
connected to its session, stop the container after a bounded idle period once the
last connection closes, and additionally stop containers whose session has been
inactive beyond a longer expiry threshold. Session records MUST survive both idle
stops and expiry stops; only the container is stopped.

#### Scenario: Idle stop after last disconnect

- **WHEN** the last connection to a session's terminal closes
- **THEN** after a bounded idle delay with no new connections, the container is
  stopped, but the session record remains available for future resume.

#### Scenario: Reconnect within idle delay

- **WHEN** a user reconnects to a session's terminal within the idle delay after the
  last disconnect
- **THEN** the container is not stopped and the shell process is preserved.

#### Scenario: Long-idle session expiry

- **WHEN** a session's `lastActiveAt` is older than the expiry threshold and its
  container is still running
- **THEN** the container is stopped and the session record is retained.
