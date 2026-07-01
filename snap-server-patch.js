// Add this to backend/server.js after the express setup
// to serve the pre-built frontend in production

// Serve frontend static files when running as a snap
if (process.env.SNAP) {
  const frontendPath = path.join(process.env.SNAP, 'frontend')
  app.use(express.static(frontendPath))
  
  // Catch-all route to serve index.html for client-side routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(frontendPath, 'index.html'))
    }
  })
}

// Also update sessions.js data path when running as snap
// Change:
// const dataFile = path.join(__dirname, 'data', 'sessions.json')
// To:
// const dataFile = process.env.SNAP_DATA 
//   ? path.join(process.env.SNAP_DATA, 'data', 'sessions.json')
//   : path.join(__dirname, 'data', 'sessions.json')