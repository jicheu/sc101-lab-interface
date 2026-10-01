# Manual testing recipes — teaching sessions

Poke-the-endpoint recipes for teaching sessions and multi-user terminal behavior.
Curl and DevTools snippets you can copy-paste against a dev backend.

For the behavior itself, see
[`openspec/specs/teaching-sessions/spec.md`](../openspec/specs/teaching-sessions/spec.md).
For dev setup, see [`HACKING.md`](../HACKING.md).

---

## Preflight

Start the backend and frontend as described in [`HACKING.md`](../HACKING.md):

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Open http://localhost:5173.

---

## Method 1: Browser DevTools

### Teacher — create a teaching session

1. Open http://localhost:5173 in **Browser 1**.
2. Press **F12** → Console.
3. Log in normally (any username, e.g. `Teacher`).
4. Once logged in, paste in the Console:

```javascript
// Create a teaching session
fetch('/api/sessions/teaching', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'Teacher',
    allowStudentWrite: false  // Students can't type by default
  })
}).then(r => r.json()).then(session => {
  console.log('Teaching Session Created!')
  console.log('Join Code:', session.joinCode)
  console.log('Session ID:', session.id)
  console.log('Full session:', session)

  window.teachingSession = session

  // Switch this browser to the new session
  localStorage.setItem('sc101_session_id', session.id)
  location.reload()
})
```

Copy the join code from the console (e.g. `abc123`).

### Student — join with the code

1. Open http://localhost:5173 in **Browser 2** (or Incognito).
2. Press **F12** → Console.
3. Paste (replace `abc123`):

```javascript
fetch('/api/sessions/lookup?joinCode=abc123')
  .then(r => r.json())
  .then(session => {
    return fetch(`/api/sessions/${session.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Student1', role: 'student' })
    })
  })
  .then(r => r.json())
  .then(result => {
    console.log('Joined!', result)
    localStorage.setItem('sc101_session_id', result.session.id)
    location.reload()
  })
```

Both browsers now share the same terminal. Teacher can type; student sees output
live but cannot type (read-only overlay). Presence avatars appear in the terminal
header.

---

## Method 2: curl

### Create the teaching session

```bash
curl -X POST http://localhost:3001/api/sessions/teaching \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Teacher",
    "tutorialId": null,
    "allowStudentWrite": false
  }'
```

Copy `joinCode` from the response.

### Look up and join

```bash
curl "http://localhost:3001/api/sessions/lookup?joinCode=abc123"
```

Then, with the session id from the response:

```bash
curl -X POST http://localhost:3001/api/sessions/{SESSION_ID}/join \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Student1",
    "role": "student"
  }'
```

Then set the returned session id into the target browser's `localStorage`
(`sc101_session_id`) and reload.

---

## Toggling write permission live

The permission change takes effect on already-open WebSocket connections without
reconnect (see the write-permission-model requirement in the spec).

### Grant write

Teacher's browser Console:

```javascript
fetch(`/api/sessions/${window.teachingSession.id}/participants/Student1/permissions`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ canWrite: true })
}).then(r => r.json()).then(console.log)
```

The student's read-only badge disappears; the student can type.

### Revoke write

```javascript
fetch(`/api/sessions/${window.teachingSession.id}/participants/Student1/permissions`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ canWrite: false })
}).then(r => r.json()).then(console.log)
```

Student is back to read-only.

---

## Multiple students

Repeat the join flow in additional windows/tabs:

```javascript
fetch('/api/sessions/lookup?joinCode=abc123')
  .then(r => r.json())
  .then(session => {
    return fetch(`/api/sessions/${session.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Student2', role: 'student' })
    })
  })
  .then(r => r.json())
  .then(result => {
    localStorage.setItem('sc101_session_id', result.session.id)
    location.reload()
  })
```

Multiple avatars appear in the terminal header.

---

## What to verify

- **Terminal header** shows one avatar per connected participant. Teacher marker
  is orange with a crown; students are blue.
- **Read-only overlay** appears at the bottom of the terminal for participants
  whose `canWrite` is false.
- **Presence updates** are pushed live to every open connection when someone joins,
  leaves, or has permissions changed. Look for `{"type":"presence",...}` in the
  Network tab's WebSocket frames.
- **Session events** (`teacher-joined`, `teacher-left`, `student-left`) are pushed
  as `{"type":"session-event",...}` messages.

---

## Troubleshooting

**"Session not found"** — backend not running on 3001, or the join code is wrong.

**"Already joined"** — each username can only be present once per session. Use a
different username, or use the same session id in localStorage and reload (rejoin
scenario replaces the prior participant entry).

**Can't type as teacher** — check the browser console for errors; verify the
WebSocket connection is established (the terminal header shows a green connection
indicator when live).

**No presence updates** — inspect the Network tab, filter WebSocket, look for
frames matching `{"type":"presence",...}`. If they aren't arriving, the socket
may be closed.

---

## Reverting to single-user mode

Regular sessions are the same wire format minus `joinCode`. Create one directly:

```javascript
fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Solo' })
}).then(r => r.json()).then(session => {
  localStorage.setItem('sc101_session_id', session.id)
  location.reload()
})
```
