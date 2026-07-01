# SC101 Lab Interface Snap Packaging Guide

## Prerequisites

1. **Install Snapcraft**:
   ```bash
   sudo snap install snapcraft --classic
   ```

2. **Set up build environment** (choose one):
   - **LXD** (recommended):
     ```bash
     sudo snap install lxd
     sudo lxd init --auto
     sudo usermod -aG lxd $USER
     newgrp lxd
     ```
   - **Multipass**:
     ```bash
     sudo snap install multipass
     ```

## Building the Snaps

This project ships as **two snaps** that work together:

| Snap | Purpose |
|------|--------------------|
| `sc101-lab-interface` | Platform (backend + frontend) |
| `sc101-tutorials` | Tutorial content pack |

### 1. Build the tutorials snap

```bash
cd snap-tutorials
snapcraft pack
# → sc101-tutorials_0.1.0_amd64.snap
cd ..
```

### 2. Build the platform snap

```bash
cd /path/to/sc101-lab-interface
snapcraft pack
# → sc101-lab-interface_0.1.0_amd64.snap
```

## Installing and Testing

### Initial Testing (DevMode)

First install in devmode to test basic functionality:

```bash
sudo snap install --devmode sc101-lab-interface_0.1.0_amd64.snap
```

### Required Interface Connections

Install both snaps and connect all required interfaces:

```bash
# Install tutorials content snap first
sudo snap install --dangerous snap-tutorials/sc101-tutorials_0.1.0_amd64.snap

# Install platform snap
sudo snap install --dangerous sc101-lab-interface_0.1.0_amd64.snap

# Connect LXD (REQUIRED for container management)
sudo snap connect sc101-lab-interface:lxd lxd:lxd

# Connect tutorials content interface (REQUIRED for tutorials to appear)
sudo snap connect sc101-lab-interface:sc101-tutorials sc101-tutorials:sc101-tutorials
```

The `network` and `network-bind` interfaces are auto-connected.

> **Note:** If tutorials are not connected, the API returns an empty list `[]` — the platform still starts normally.

## Running the Application

The snap runs as a daemon service that automatically starts on installation:

```bash
# Check service status
sudo snap services sc101-lab-interface

# View logs
sudo snap logs sc101-lab-interface

# Restart if needed
sudo snap restart sc101-lab-interface
```

Access the application at:
- Frontend + API: http://localhost:3001 (frontend is served as static files from the backend)

You can also run the backend CLI directly:
```bash
sc101-lab-interface.backend
```

## Troubleshooting

### AppArmor Denials

If you encounter permission issues, check for AppArmor denials:

```bash
# Run a shell in the snap's security context
sudo snap run --shell sc101-lab-interface

# Check system logs for denials
sudo journalctl -xe | grep denied

# Monitor denials in real-time
sudo dmesg -w | grep DENIED
```

### Common Issues

1. **LXD not connected**: If you see errors about LXD access, ensure the interface is connected:
   ```bash
   snap connections sc101-lab-interface
   ```

2. **Port conflicts**: If ports 3001 or 5173 are in use, stop conflicting services first.

3. **Node.js module issues**: The snap includes Node.js 20.x and all dependencies are bundled.

## Creating a Custom Tutorial Pack

Anyone can ship their own tutorials without modifying the platform snap:

```bash
# Copy the tutorials snap scaffold
cp -r snap-tutorials my-tutorials-snap
cd my-tutorials-snap

# Edit / add tutorials in the tutorials/ subfolder
# Each tutorial is a folder with index.md + stepN.md files
vim tutorials/my-new-course/hello-world/index.md

# Build your custom tutorials snap
snapcraft pack

# Install it
sudo snap install --dangerous my-tutorials-snap_*.snap

# Connect it (disconnects any previously connected tutorials snap first)
sudo snap disconnect sc101-lab-interface:sc101-tutorials
sudo snap connect sc101-lab-interface:sc101-tutorials my-tutorials-snap:sc101-tutorials
```

Tutorials are read on every API request — no platform restart needed after swapping snaps.

## Submitting to the Snap Store

Once testing is complete, both snaps can be published independently:

```bash
# Register and publish the platform
snapcraft register sc101-lab-interface
snapcraft upload sc101-lab-interface_0.1.0_amd64.snap
snapcraft release sc101-lab-interface 1 stable

# Register and publish the tutorials pack
snapcraft register sc101-tutorials
snapcraft upload snap-tutorials/sc101-tutorials_0.1.0_amd64.snap
snapcraft release sc101-tutorials 1 stable
```

Once both are on the store, uncomment `default-provider: sc101-tutorials` in
`snap/snapcraft.yaml` so that installing the platform snap auto-installs the
tutorials snap.

## Important Notes

- The application requires the LXD snap to be installed and initialized on the host system
- The 'lxd' interface must be manually connected after installation: `sudo snap connect sc101-lab-interface:lxd lxd:lxd`
- Frontend is pre-built during snap creation and served as static files
- The start.sh script manages both backend and frontend processes as a single daemon
- Session data is stored in $SNAP_DATA/sessions.json