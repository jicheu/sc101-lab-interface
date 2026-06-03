# Step 4 – Explore the snap file format

## Objectives

In this step you will:

- Confirm that a `.snap` file is a standard SquashFS filesystem image
- Understand why snaps use SquashFS and what that means for runtime behaviour

## Required tools

The `file` command is a standard utility already present on Ubuntu. No installation is needed.

## Check the file type

```bash
file hello-world_*.snap
```

The output will look similar to:

```
hello-world_29.snap: Squashfs filesystem, little endian, version 4.0, 19330 bytes, 10 inodes, blocksize: 131072 bytes, created: Wed Apr 17 15:16:46 2019
```

This confirms the snap is a standard **SquashFS** compressed filesystem image.

## Why SquashFS?

When snapd installs a snap it mounts the SquashFS image as a read-only loopback device under `/snap/<name>/<revision>/`. This design has three important consequences:

| Property | Effect |
|---|---|
| **Read-only at runtime** | The snap's files cannot be modified while it is running — a key part of the snap security model |
| **Compressed** | Snaps are smaller on disk and download faster than equivalent tarballs |
| **Atomic updates** | A new revision is a new SquashFS image; rolling back means re-mounting the previous image |

You can verify that the installed snap is mounted as a loopback device:

```bash
mount | grep hello-world
```

> **Further reading:** [Snap documentation overview – Snapcraft](https://snapcraft.io/docs/)

## Summary

A `.snap` file is nothing more than a SquashFS image. snapd mounts it read-only at install time, which gives snaps their integrity guarantees and makes rollbacks trivial. In the next step you will extract the image and explore its internal directory layout.
