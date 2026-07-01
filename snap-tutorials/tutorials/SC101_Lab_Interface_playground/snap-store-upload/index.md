---
id: snap-store-upload
title: "How to upload a snap to the Snap Store"
description: >
  Learn how to create a Snap Store account, register a snap name,
  and publish your first snap so it can be installed on any Linux system.
difficulty: beginner
time: 20
section: "Publishing Snaps"
tags: [snap, snapcraft, snap-store, publish, release]

environment:
  dev:
    image: ubuntu:24.04
    prestart:
      - apt-get update -y
      - apt-get install -y snapd
      - snap install snapcraft --classic

steps:
  - title: "Introduction"
    file: step1.md
  - title: "Create a Snap Store account"
    file: step2.md
  - title: "Register your snap name"
    file: step3.md
  - title: "Log in with snapcraft"
    file: step4.md
  - title: "Upload and release"
    file: step5.md
---

## About this tutorial

> ⚠️ **This tutorial is a work in progress.** Content is coming soon.

This tutorial covers the full journey from a built `.snap` file to a
publicly available release on the Snap Store.
