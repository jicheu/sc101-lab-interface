---
title: "Introduction"
---

## Objective

Understand what this tutorial covers and why snap confinement matters, so you are prepared for every hands-on step that follows.

## Prerequisites

- Completed the **Hello Snap** tutorial (snap, snapd, Snapcraft, and GCC already installed).

## Instructions

Welcome to **Snap Confinement** — a hands-on tutorial that makes AppArmor sandboxing concrete by deliberately breaking a snap and fixing it one interface at a time.

> 📖 **Concept — Snap Confinement**  
> Confinement defines what system resources a snap can access. There are three levels: `strict` (fully sandboxed), `devmode` (unconfined, for development), and `classic` (unrestricted, like a traditional package).  
> Official reference: https://snapcraft.io/docs/snap-confinement

> 📖 **Concept — Ubuntu Core**  
> Ubuntu Core is a minimal, fully snap-based Ubuntu OS designed for IoT and embedded devices. Every application on Ubuntu Core runs as a strictly confined snap — making correct interface declarations a hard requirement.  
> Official reference: https://ubuntu.com/core/docs

### What you will build

An application called **inspire** — a C program that:

1. Asks you for a filename
2. Fetches a random inspirational quote from a free public API ([ZenQuotes](https://zenquotes.io))
3. Writes the quote and its author to the file you specified

This app touches **two resources that snap confinement controls**:

| Resource | Interface required |
|---|---|
| Outgoing network connection (HTTPS) | `network` |
| Writing files in your home directory | `home` |

### The plan

| Step | What happens |
|---|---|
| **Step 2** | Build and test the app natively (no snap) |
| **Step 3** | Package it as a snap in `devmode` (unconfined) — everything works |
| **Step 4** | Switch to `strict` confinement — watch it break, then fix it one interface at a time |

### Why this matters on Ubuntu Core

On **Ubuntu Core**, every application runs as a strictly confined snap.
If your app needs the network or filesystem access, you must declare it explicitly.
This tutorial makes that concrete and hands-on.

## What we learned

- Snap confinement is enforced by AppArmor and seccomp at the kernel level.
- `strict` confinement is the default on Ubuntu Core — no network or filesystem access without explicit declarations.
- This tutorial uses the `inspire` app to demonstrate exactly which interfaces are needed and why.

## What's next

In the next step you will install the required build dependencies and compile the `inspire` C application.
