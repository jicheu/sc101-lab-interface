#!/bin/bash
# Remove problematic catch-all routes from server.js
sed -i '/app\.get.*\*/,/^}$/d' backend/server.js
# Also remove the static middleware lines that were added
sed -i '/process\.env\.SNAP.*{/,/^}$/d' backend/server.js