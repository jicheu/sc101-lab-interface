# Multi-User Terminal Sessions - Testing Guide

## Quick Start

### Step 1: Start the Application

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

Open: http://localhost:5173

---

## Method 1: Browser DevTools (Easiest)

### Teacher: Create a Teaching Session

1. Open http://localhost:5173 in **Browser 1**
2. Press **F12** to open Developer Tools → Console tab
3. Create a regular session normally (login with any username, e.g., "Teacher")
4. Once logged in, paste this in the Console:

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
  console.log('Teaching Session Created!');
  console.log('Join Code:', session.joinCode);
  console.log('Session ID:', session.id);
  console.log('Full session:', session);
  
  // Store it so you can access the session
  window.teachingSession = session;
  
  // Save to localStorage to use this session
  localStorage.setItem('sc101_session_id', session.id);
  
  // Reload to connect to this session
  location.reload();
})
```

5. **Copy the join code** from the console output (e.g., `abc123`)

### Student: Join the Session

1. Open http://localhost:5173 in **Browser 2** (or Incognito window)
2. Press **F12** → Console
3. Paste this (replace `abc123` with your actual join code):

```javascript
// Look up session by join code
fetch('/api/sessions/lookup?joinCode=abc123')
  .then(r => r.json())
  .then(session => {
    console.log('Found session:', session.id);
    
    // Join as a student
    return fetch(`/api/sessions/${session.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Student1', role: 'student' })
    });
  })
  .then(r => r.json())
  .then(result => {
    console.log('Joined!', result);
    localStorage.setItem('sc101_session_id', result.session.id);
    location.reload();
  });
```

### Result
✅ Both browsers now share the same terminal!
- Teacher can type commands
- Student sees output in real-time (but can't type - read-only mode)
- You'll see presence indicators (avatars) in the terminal header

---

## Method 2: Using curl (API Testing)

### Teacher: Create Teaching Session

```bash
curl -X POST http://localhost:3001/api/sessions/teaching \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Teacher",
    "tutorialId": null,
    "allowStudentWrite": false
  }'
```

Copy the `joinCode` from the response (e.g., `"joinCode": "abc123"`)

### Student: Join Session

First, look up the session by join code:

```bash
curl "http://localhost:3001/api/sessions/lookup?joinCode=abc123"
```

Copy the `id` from response, then join:

```bash
curl -X POST http://localhost:3001/api/sessions/{SESSION_ID}/join \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Student1",
    "role": "student"
  }'
```

Now use the session ID in your browser's localStorage and reload.

---

## Testing Permission Toggling

### Teacher: Grant Write Permission to Student

In Teacher's browser console:

```javascript
// Grant write permission to Student1
fetch(`/api/sessions/${window.teachingSession.id}/participants/Student1/permissions`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ canWrite: true })
}).then(r => r.json()).then(console.log);
```

🎯 **The student can now type in the terminal!** (The "Read-only" badge disappears)

### Teacher: Revoke Write Permission

```javascript
// Revoke write permission
fetch(`/api/sessions/${window.teachingSession.id}/participants/Student1/permissions`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ canWrite: false })
}).then(r => r.json()).then(console.log);
```

🎯 **Student is back to read-only mode**

---

## Testing Multiple Students

Repeat the join process in more browser windows/tabs:

```javascript
// Student 2
fetch('/api/sessions/lookup?joinCode=abc123')
  .then(r => r.json())
  .then(session => {
    return fetch(`/api/sessions/${session.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Student2', role: 'student' })
    });
  })
  .then(r => r.json())
  .then(result => {
    localStorage.setItem('sc101_session_id', result.session.id);
    location.reload();
  });
```

You'll see multiple avatars in the terminal header!

---

## What You Should See

### Terminal Header
```
┌─ Container Name [Read-only] ──────────────────┐
│  [T👑] [S] [S]  connected                     │
└───────────────────────────────────────────────┘
```
- **T** with crown (👑) = Teacher (orange)
- **S** = Student (blue)

### Read-Only Overlay (for students)
At the bottom of terminal:
```
👁️ View-only mode — Teacher is controlling the terminal
```

### Presence Updates
When someone joins/leaves, all participants see their indicators update in real-time.

---

## Troubleshooting

**Problem: "Session not found"**
- Make sure backend is running on port 3001
- Check the join code is correct

**Problem: "Already joined"**
- Each username can only join once
- Use a different username or logout first

**Problem: Can't type even as teacher**
- Check the browser console for errors
- Verify WebSocket connection is established (green dot in terminal header)

**Problem: Not seeing other participants**
- Check Network tab for WebSocket messages
- Look for presence updates: `{"type":"presence","participants":[...]}`

---

## Reverting to Single-User Mode

Regular sessions still work as before:

```javascript
fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Solo' })
}).then(r => r.json()).then(session => {
  localStorage.setItem('sc101_session_id', session.id);
  location.reload();
});
```

---

## Next Steps: Building the UI

To make this more user-friendly, you could add:

1. **"Create Teaching Session" button** on login screen
2. **"Join Session" tab** with join code input
3. **Teacher controls panel** in settings to manage participants
4. **Chat sidebar** for Q&A during sessions
5. **Hand raise** notification system

The backend is ready - just needs frontend components!
