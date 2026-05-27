---
id: snap-confinement
title: "Understanding what confinement means"
description: >
  Build a C app that fetches an inspirational quote from the internet and
  writes it to a file. Package it as a snap — first unconfined, then strictly
  confined — and discover first-hand how snap interfaces grant and restrict
  access to system resources.
difficulty: intermediate
time: 45
tags: [snap, c, confinement, interfaces, network, home, ubuntu]
requires:
  - hello-snap

environment:
  dev:
    image: ubuntu:24.04
    prestart:
      - apt-get update -y
      - apt-get install -y build-essential libcurl4-openssl-dev snapd
      - snap install snapcraft --classic

steps:
  - file: step1.md
    title: "Introduction"
  - file: step2.md
    title: "Build the inspire app"
  - file: step3.md
    title: "Package as a devmode snap"
  - file: step4.md
    title: "Switch to strict confinement"
---

## About this tutorial

Snap confinement is one of the most powerful — and most misunderstood — features
of the snap ecosystem. In this lab you will experience it directly:

- Build a real C application that uses the **network** and the **filesystem**
- Watch it work perfectly as an unconfined snap
- See exactly which errors appear when you enable **strict confinement**
- Learn how to declare **snap interfaces** to grant only the permissions your app truly needs

By the end you will understand why confinement matters for Ubuntu Core and how
to configure it correctly.
