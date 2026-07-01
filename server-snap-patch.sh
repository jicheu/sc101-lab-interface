#!/bin/bash
# Patch server.js for snap environment

# Check if already patched
if grep -q "process.env.SNAP" backend/server.js; then
  echo "Server already patched for snap environment"
else
  # Find line with "const app = express()" and add frontend serving after it
  LINE=$(grep -n "const app = express()" backend/server.js | cut -d: -f1 | head -1)
  if [ -n "$LINE" ]; then
    sed -i "${LINE}a\\
\\
// Serve frontend static files when running as a snap\\
if (process.env.SNAP) {\\
  const frontendPath = path.join(process.env.SNAP, 'frontend')\\
  app.use(express.static(frontendPath))\\
}" backend/server.js
  fi
  
  # Add catch-all route before the server.listen line
  LISTEN_LINE=$(grep -n "server.listen" backend/server.js | cut -d: -f1 | tail -1)
  if [ -n "$LISTEN_LINE" ]; then
    sed -i "${LISTEN_LINE}i\\
// Catch-all route for client-side routing when running as snap\\
if (process.env.SNAP) {\\
  app.get('/*', (req, res) => {\\
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {\\
      const frontendPath = path.join(process.env.SNAP, 'frontend')\\
      res.sendFile(path.join(frontendPath, 'index.html'))\\
    }\\
  })\\
}\\
" backend/server.js
  fi
fi

# Patch sessions.js for snap data directory
sed -i "s|path.join(__dirname, 'data', 'sessions.json')|process.env.SNAP_DATA ? path.join(process.env.SNAP_DATA, 'data', 'sessions.json') : path.join(__dirname, 'data', 'sessions.json')|g" backend/sessions.js