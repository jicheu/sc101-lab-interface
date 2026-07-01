# SC101 Lab Interface — Snap Installation Guide

This guide covers installing SC101 Lab Interface from pre-built snap packages.  
For building from source, see [SNAP_PACKAGING.md](./SNAP_PACKAGING.md).

---

## Prerequisites

### 1. snapd

snapd is included by default on Ubuntu 16.04+ and most modern Linux distributions.

```bash
# Verify snapd is running
snap version
```

If snapd is not installed:
```bash
sudo apt update && sudo apt install snapd
```

### 2. LXD

SC101 requires LXD to provision per-student terminal containers.

```bash
# Install LXD snap (if not already present)
sudo snap install lxd

# Initialise LXD (accept all defaults — press Enter through the prompts)
sudo lxd init --auto

# Add your user to the lxd group so you can run lxc commands without sudo
sudo usermod -aG lxd $USER
newgrp lxd          # apply group membership without logging out
```

> **Note:** If you skip LXD initialisation, terminal sessions will fail to start.  
> The rest of the platform (UI, tutorial browser) still works.

---

## Installation

SC101 Lab Interface ships as **two snaps** that work together:

| Snap | What it does |
|------|--------------|
| `sc101-lab-interface` | Platform — backend API, WebSocket server, and bundled frontend |
| `sc101-tutorials` | Tutorial content — the markdown labs displayed in the UI |

### Step 1 — Install the tutorials content snap

```bash
sudo snap install sc101-tutorials
```

> Until the snap is on the store, install from a local file:
> ```bash
> sudo snap install --dangerous sc101-tutorials_0.1.0_amd64.snap
> ```

### Step 2 — Install the platform snap

```bash
sudo snap install sc101-lab-interface
```

> Until the snap is on the store, install from a local file:
> ```bash
> sudo snap install --dangerous sc101-lab-interface_0.1.0_amd64.snap
> ```

### Step 3 — Connect the interfaces

Two interfaces must be connected manually (they are not auto-connected
because the snaps are from a third-party publisher):

```bash
# Allow the platform to manage LXD containers
sudo snap connect sc101-lab-interface:lxd lxd:lxd

# Mount the tutorials content into the platform
sudo snap connect sc101-lab-interface:sc101-tutorials sc101-tutorials:sc101-tutorials
```

Verify all connections are in place:

```bash
snap connections sc101-lab-interface
```

Expected output:

```
Interface          Plug                                    Slot                              Notes
content            sc101-lab-interface:sc101-tutorials     sc101-tutorials:sc101-tutorials   manual
lxd                sc101-lab-interface:lxd                 lxd:lxd                           manual
network            sc101-lab-interface:network             :network                          -
network-bind       sc101-lab-interface:network-bind        :network-bind                     -
```

---

## Starting the Service

The platform daemon starts automatically after installation. To manage it manually:

```bash
# Check whether the daemon is running
sudo snap services sc101-lab-interface

# Start
sudo snap start sc101-lab-interface

# Stop
sudo snap stop sc101-lab-interface

# Restart
sudo snap restart sc101-lab-interface
```

---

## Accessing the Interface

Once the daemon is running, open your browser:

```
http://localhost:3001
```

The backend serves the bundled frontend at that address — no separate web server needed.

---

## Verifying the Tutorial Content

Check that tutorials loaded correctly:

```bash
curl -s http://localhost:3001/api/tutorials | python3 -m json.tool | grep '"uid"'
```

If the list is empty (`[]`), confirm the content interface is connected:

```bash
snap connections sc101-lab-interface | grep sc101-tutorials
```

---

## Updating

### Update the platform

```bash
sudo snap refresh sc101-lab-interface
```

### Update the tutorials content

```bash
sudo snap refresh sc101-tutorials
```

The platform daemon does **not** need to restart after refreshing the tutorials snap —
tutorials are read from disk on every API request.

---

## Using a Custom Tutorial Pack

You can replace the bundled tutorials with your own pack at any time:

```bash
# Disconnect the default tutorials
sudo snap disconnect sc101-lab-interface:sc101-tutorials

# Install your custom tutorials snap
sudo snap install --dangerous my-tutorials_0.1.0_amd64.snap

# Connect the custom pack
sudo snap connect sc101-lab-interface:sc101-tutorials my-tutorials:sc101-tutorials
```

No restart required — switch back any time by reversing the connect commands.

For instructions on building a custom tutorials snap, see
[SNAP_PACKAGING.md § Creating a Custom Tutorial Pack](./SNAP_PACKAGING.md#creating-a-custom-tutorial-pack).

---

## Editing Tutorials Without Rebuilding a Snap

For quick local edits, place your tutorials in the writable override directory.
The platform checks this path first, before the content snap mount:

```bash
# Create the override directory
sudo mkdir -p /var/snap/sc101-lab-interface/common/tutorials

# Copy and edit tutorials there
sudo cp -r /snap/sc101-tutorials/current/tutorials/SC101_Lab_Interface_playground \
           /var/snap/sc101-lab-interface/common/tutorials/

sudo nano /var/snap/sc101-lab-interface/common/tutorials/SC101_Lab_Interface_playground/hello-snap/step1.md
```

Changes are visible immediately — no snap rebuild or restart needed.

> **Tip:** When you are happy with your edits, move them back into a proper tutorials snap
> so others can install them cleanly.

---

## Uninstalling

```bash
# Remove the platform (keeps session data by default)
sudo snap remove sc101-lab-interface

# Remove the tutorials content
sudo snap remove sc101-tutorials

# To also delete all saved session data
sudo snap remove --purge sc101-lab-interface
```

---

## Troubleshooting

### No tutorials appear in the UI

1. Check the content interface is connected:
   ```bash
   snap connections sc101-lab-interface | grep sc101-tutorials
   ```
2. Reconnect if missing:
   ```bash
   sudo snap connect sc101-lab-interface:sc101-tutorials sc101-tutorials:sc101-tutorials
   ```

### Terminal sessions fail to start

1. Confirm LXD is initialised:
   ```bash
   lxc list
   ```
2. Confirm the LXD interface is connected:
   ```bash
   snap connections sc101-lab-interface | grep lxd
   ```
3. Reconnect if missing:
   ```bash
   sudo snap connect sc101-lab-interface:lxd lxd:lxd
   ```

### Port 3001 already in use

```bash
# Find and kill whatever owns port 3001
sudo fuser -k 3001/tcp
# Then restart the service
sudo snap start sc101-lab-interface
```

### View live logs

```bash
sudo snap logs -f sc101-lab-interface
```
