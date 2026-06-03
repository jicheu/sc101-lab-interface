# Step 5 – Unsquash and explore the snap contents

## Objectives

In this step you will:

- Extract the SquashFS image with `unsquashfs`
- Explore the mandatory `meta/snap.yaml` manifest
- Understand the role of the optional `snap/manifest.yaml`

## Install the required tools

The `unsquashfs` command is provided by the `squashfs-tools` package, which is not installed by default:

```bash
apt-get install -y squashfs-tools
```

## Extract the snap

```bash
unsquashfs hello-world_*.snap
```

This creates a `squashfs-root/` directory in your current working directory containing the complete, uncompressed contents of the snap.

## Explore the directory structure

```bash
find squashfs-root/ -maxdepth 3
```

### `meta/snap.yaml` — the snap manifest

This is the **mandatory** metadata file. snapd reads it at install time to understand what the snap provides.

```bash
cat squashfs-root/meta/snap.yaml
```

It declares the snap's `name`, `version`, `summary`, and the `apps` it exposes (commands that become available as `snap run <snap>.<app>`).

### `bin/` — executables

```bash
ls -lh squashfs-root/bin/
```

This directory holds the binaries shipped with the snap. The `bin/` directory is a **convention** only — snaps may place executables anywhere inside the image and reference them via `snap.yaml`. The path is not special to snapd.

### What about `snap/manifest.yaml`?

Run:

```bash
ls squashfs-root/snap/ 2>/dev/null || echo "snap/ directory not present"
```

This file is **absent** in the `hello-world` snap. When present (built in by Snapcraft), it allows Ubuntu archive management tools to notify snap publishers about Ubuntu Security Notices that affect packages bundled inside the snap, so they can rebuild and release a fix.

> **Note:** The `meta/` directory is always present in every snap. The `bin/` layout is conventional, not mandatory. `snap/manifest.yaml` is optional and only present when the snap was built to include it.

> **Further reading:** [Debug snaps with snap try – Snapcraft](https://snapcraft.io/docs/snap-try)

## Repack a snap (preview)

Because you now have a plain directory that mirrors the snap's contents, you can modify any file and repack it — a powerful debugging technique. You will do exactly that in the next step.

## Summary

Snaps have a straightforward internal layout: a mandatory `meta/snap.yaml` manifest, the application binaries, and optional metadata under `snap/`. Extracting and re-packing a snap is a standard debugging workflow. In the next step you will modify nothing, but repack and install the snap to verify the round-trip.
