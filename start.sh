#!/bin/bash
#
# SC101 Lab Interface - dev launcher
#
# Runs the backend and the Vite frontend dev server in parallel.
# Ctrl-C (SIGINT), SIGTERM, or normal exit stops both children.
#
# For prerequisites, ports, and everything else about developing on this
# platform, see HACKING.md.

set -u

# Kill every child in this shell's process group on exit or signal.
# `kill 0` targets the process group (of which this script is the leader),
# so backgrounded `npm run dev:*` and everything they spawned go down together.
cleanup() {
    trap - INT TERM EXIT
    kill 0 2>/dev/null || true
}
trap cleanup INT TERM EXIT

npm run dev:backend &
npm run dev:frontend &

wait
