---
id: lab-02-snap-packaging-introduction
title: "Lab 02 — Snap Packaging Introduction"
description: Explore the internal structure of a snap package — assertions, the squashfs file format, snap metadata, and how to repack and sideload an unasserted snap.
difficulty: beginner
time: 45
tags:
  - snap
  - snapcraft
  - squashfs
  - assertions
  - ubuntu
environment:
  image: ubuntu:24.04
  prestart:
    - sudo apt update -y
requires:
  - lab-01-account-snap-snapcraft
steps:
  - title: Download and locally install a snap
    file: step1.md
  - title: Explore snap assertions
    file: step2.md
  - title: Identify the snap file format
    file: step3.md
  - title: Unsquash and explore snap contents
    file: step4.md
  - title: Repack and install an unasserted snap
    file: step5.md
---

This tutorial takes apart a real snap package to show you what is inside. You will download the `hello-world` snap directly from the Snap Store, inspect its assertion chain, examine the squashfs filesystem that every snap is built on, walk through the mandatory `meta/snap.yaml` metadata, and finally repack the directory into a new snap and install it in dangerous mode.

By the end you will understand the physical structure of a snap, what assertions guarantee its integrity, and how to sideload locally built snaps — foundational knowledge for the packaging labs that follow.
