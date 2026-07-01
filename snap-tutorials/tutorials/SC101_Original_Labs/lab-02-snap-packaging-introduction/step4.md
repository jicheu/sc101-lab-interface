---
title: Unsquash and explore snap contents
---

## Objective

Extract the snap's squashfs image to disk and examine the mandatory directory structure inside every snap package.

## Prerequisites

- `hello-world_*.snap` exists in `~/lab02/` (Step 1).

## Install required tools

`unsquashfs` is part of the `squashfs-tools` package, which is not installed by default:

```bash run
sudo apt install -y squashfs-tools
```

Optionally, install `squashfuse` to mount the squashfs image without extracting it:

```bash run
sudo apt install -y squashfuse
```

## Instructions

1. Extract the snap into a `squashfs-root` directory:

```bash run
cd ~/lab02 && unsquashfs hello-world_*.snap
```

Expected output ends with a line like:

```
created 10 files
```

2. List the top-level directory structure:

```bash run
ls -la ~/lab02/squashfs-root/
```

3. Inspect the mandatory `meta/snap.yaml` file — the snap's primary metadata descriptor:

```bash run
cat ~/lab02/squashfs-root/meta/snap.yaml
```

> 📖 **Concept — snapcraft.yaml / snap.yaml**  
> `snap.yaml` (inside the snap) is the built artefact of the `snapcraft.yaml` you write as a developer. It declares the snap's name, version, confinement level, apps, and interfaces. `snapd` reads it at install time.  
> Official reference: https://snapcraft.io/docs/snapcraft-yaml-reference

4. List the snap's application binaries:

```bash run
ls -la ~/lab02/squashfs-root/bin/
```

The `bin/` directory is a convention, not a requirement. Application executables can live anywhere inside the snap as long as `snap.yaml` points to them correctly.

5. Check for an optional `snap/manifest.yaml` file:

```bash run
ls ~/lab02/squashfs-root/snap/ 2>/dev/null || echo "snap/ directory not present in this snap"
```

> **Note — manifest.yaml**  
> When present, `snap/manifest.yaml` allows Ubuntu archive management tools to notify a snap's publisher of Ubuntu Security Notices (USNs) that affect packages bundled inside the snap, so they can rebuild and republish. It is generated automatically by `snapcraft` when the `--enable-manifest` flag is used (or by default in newer Snapcraft versions).

## What we learned

- Every snap contains a `meta/` directory — this is the only mandatory top-level directory.
- `meta/snap.yaml` is the runtime metadata file `snapd` reads; it is produced from your `snapcraft.yaml` at build time.
- `bin/` is a common convention for executable wrappers but is not required.
- `snap/manifest.yaml`, when present, enables security notification tracking for bundled Ubuntu packages.

## What's next

The next step modifies the extracted directory, repacks it into a new snap file, and installs it without Store assertions.
