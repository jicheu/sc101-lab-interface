---
title: "Analyzing the Snap File Format & Mounts"
---

## Objective

In this step, you will examine the concrete binary filesystem format of a snap package and observe how `snapd` securely mounts installed snaps as isolated, read-only structures.

## Prerequisites

- Step 1 complete (`snapd` installed).
- A local `simple-server_*.snap` file present in your current working directory.

## Instructions

1. Use the standard Linux `file` utility to identify what a `.snap` file physically consists of:
```bash run
file simple-server_*.snap
```

The output confirms that a snap is not a simple tarball, but a compressed **Squashfs filesystem** archive. Squashfs filesystems are natively read-only.

2. Install the local `simple-server` snap package. Because this file is a local build that does not possess an official cryptographic assertion chain signed by the Snap Store, you must include the `--dangerous` flag to acknowledge that you trust this unsigned package:
```bash run
sudo snap install simple-server_*.snap --dangerous
```

3. Verify where and how `snapd` maps this compressed archive onto your active operating system environment:
```bash run
mount | grep simple-server
```

Observe the `ro` flag inside the loopback mount definition output. This confirms that the snap is mounted entirely read-only. Files cannot be modified or replaced inside a running snap package, which ensures consistency and security across deployments.

## What we learned

* A snap file is explicitly a compressed, read-only Squashfs filesystem image.
* Installed snaps are dynamically mounted into the system hierarchy under `/snap/<name>/`.
* The `--dangerous` flag is required when deploying unasserted local snap packages.

## What's next

In the next step, we will bypass the active runtime mount restrictions by unpacking the squashfs block directly to analyze its internal control structure.
