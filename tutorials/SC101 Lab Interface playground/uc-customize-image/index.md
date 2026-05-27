---
id: uc-customize-image
title: "Customize the image to add your snaps"
description: >
  Learn how to pre-install your own snaps into an Ubuntu Core image at
  build time using a model assertion, so they are present from first boot.
difficulty: advanced
time: 60
section: "Creating Ubuntu Core image"
tags: [ubuntu-core, ubuntu-image, model-assertion, preinstalled-snaps, customization]
requires:
  - uc-basic-image

environment:
  dev:
    image: ubuntu:24.04
    prestart:
      - apt-get update -y

steps:
  - title: "Introduction"
    file: step1.md
  - title: "Publish a snap to the store (or use a local snap)"
    file: step2.md
  - title: "Update the model assertion"
    file: step3.md
  - title: "Rebuild the image"
    file: step4.md
  - title: "Verify the snap is present at first boot"
    file: step5.md
---

## About this tutorial

> ⚠️ **This tutorial is a work in progress.** Content is coming soon.

This tutorial shows how to customise an Ubuntu Core image to include
your own snaps, pre-installed and ready to use on first boot.
