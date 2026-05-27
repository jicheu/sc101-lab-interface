---
title: "Introduction"
---

## What you will build

An application called **inspire** — a C program that:

1. Asks you for a filename
2. Fetches a random inspirational quote from a free public API ([ZenQuotes](https://zenquotes.io))
3. Writes the quote and its author to the file you specified

Simple enough — but it touches **two resources that snap confinement controls**:

| Resource | Interface required |
|---|---|
| Outgoing network connection (HTTPS) | `network` |
| Writing files in your home directory | `home` |

## The plan

| Step | What happens |
|---|---|
| **Step 2** | Build and test the app natively (no snap) |
| **Step 3** | Package it as a snap in `devmode` (unconfined) — everything works |
| **Step 4** | Switch to `strict` confinement — watch it break, then fix it one interface at a time |

## Why this matters

On **Ubuntu Core**, every application runs as a strictly confined snap.
If your app needs the network or filesystem access, you must declare it explicitly.
This tutorial makes that concrete and hands-on.

Click **Next →** to start building.
