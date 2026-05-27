---
id: hello-snap
title: "Hello Snap — C App on Ubuntu Core"
description: >
  Build a C "hello world" program from scratch, package it as a
  strictly-confined snap with Snapcraft, and run it on Ubuntu Core 24.
difficulty: beginner
time: 30
tags: [snap, c, ubuntu-core, lxd, snapcraft]

environment:
  dev:
    image: ubuntu:24.04
    # Container name will be sc101-<username>; this is the environment
    # where the student compiles code and builds the snap.
    prestart:
      - apt-get update -y
      - apt-get install -y build-essential snapd
      - snap install snapcraft --classic
  # Uncomment when Ubuntu Core support is ready (see TODO.md)
  # test:
  #   image: ubuntu-core:24
  #   # Second container used in the final step to install the snap
  #   # on a real Ubuntu Core system.

steps:
  - file: step1.md
    title: "Introduction"
  - file: step2.md
    title: "Set up build tools"
  - file: step3.md
    title: "Write hello.c"
  - file: step4.md
    title: "Write snapcraft.yaml"
  - file: step5.md
    title: "Build the snap"
  - file: step6.md
    title: "Install & test"
---

## About this tutorial

**Hello Snap** is the foundational SC101 lab exercise. Starting from a minimal C program, you will learn how the snap packaging ecosystem works and how Ubuntu Core enforces strict application confinement.

By the end you will have:

- A compiled C binary running inside an LXD container
- A `snapcraft.yaml` recipe that describes your snap
- A signed `.snap` package built with Snapcraft
- The snap installed and running under **strict confinement**

This description is shown on the tutorial selection screen.
