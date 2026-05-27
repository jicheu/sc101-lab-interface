---
title: "Introduction"
---

## Objective

Understand what this tutorial covers and what a snap is, so you are prepared for every hands-on step that follows.

## Instructions

Welcome to **Hello Snap** — a hands-on tutorial that takes you from a plain C program all the way to a fully confined snap package ready to run on **Ubuntu Core**.

> 📖 **Concept — Snap**  
> A snap is a self-contained application bundle for Linux. It includes the app and all its dependencies, runs in a sandbox, and can be installed on any snap-enabled system.  
> Official reference: https://snapcraft.io/docs/getting-started

> 📖 **Concept — Ubuntu Core**  
> Ubuntu Core is a minimal, fully snap-based Ubuntu OS designed for IoT and embedded devices. Every application on Ubuntu Core runs as a strictly confined snap.  
> Official reference: https://ubuntu.com/core/docs

### What you will build

You will compile a small C program, write a `snapcraft.yaml` recipe for it, build it into a `.snap` package, and install and verify it under strict confinement.

### What you will learn

- How to compile a C application on Ubuntu 24.04
- How snaps provide application confinement
- How to write a `snapcraft.yaml` descriptor
- How to build a snap with Snapcraft
- How to sideload and test a snap

### The environment

Your terminal on the right is a live **Ubuntu 24.04** container.

- Commands highlighted with a **▶ Run** button can be executed with a single click.
- You can also type directly in the terminal at any time.

Verify the environment is ready:

```bash run
cat /etc/os-release | grep PRETTY_NAME
```

You should see `Ubuntu 24.04`.

## What we learned

- A snap is a self-contained, sandboxed application bundle for Linux.
- Ubuntu Core is a minimal OS that runs only strictly confined snaps.
- This lab environment is an Ubuntu 24.04 container where all development takes place.

## What's next

In the next step you will install the C compiler and Snapcraft build tool needed throughout the tutorial.
