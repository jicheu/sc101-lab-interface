# Snap Packaging Introduction

> **Environment:** Ubuntu 24.04 LTS. The required tools (`snapd` and `squashfs-tools`) are configuring in the background.

In this lab you will explore the internals of snap packages by working hands-on with the `hello-world` snap.

By the end of this scenario you will be able to:

- Download a snap and its assertions from the Snap Store
- Understand the role and types of snap assertions
- Inspect the SquashFS-based snap file format
- Explore the internal directory layout of a snap
- Repack a modified snap and install it in dangerous mode

**Reference documentation (Canonical/Ubuntu only):**

- [Snap assertions – Ubuntu Core](https://documentation.ubuntu.com/core/reference/assertions/)
- [Snap install modes – Snapcraft](https://snapcraft.io/docs/install-modes)
- [Debug snaps with snap try – Snapcraft](https://snapcraft.io/docs/snap-try)
- [Getting started with snaps – Snapcraft](https://snapcraft.io/docs/tutorials/get-started/)

Let's get started!
