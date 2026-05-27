---
id: uc-basic-image
title: "Create a basic Ubuntu Core image"
description: >
  Learn how to build a minimal Ubuntu Core image from scratch using
  ubuntu-image and a model assertion. This is the foundation for all
  Ubuntu Core customisation work.
difficulty: intermediate
time: 45
section: "Creating Ubuntu Core image"
tags: [ubuntu-core, ubuntu-image, model-assertion, gadget, kernel]

environment:
  dev:
    image: ubuntu:24.04
    prestart:
      - apt-get update -y

steps:
  - title: "Introduction"
    file: step1.md
  - title: "Set up the build environment"
    file: step2.md
  - title: "Write the model assertion"
    file: step3.md
  - title: "Build the image"
    file: step4.md
  - title: "Boot and verify"
    file: step5.md
---

## About this tutorial

> ⚠️ **This tutorial is a work in progress.** Content is coming soon.

This tutorial walks through creating a minimal Ubuntu Core image using
`ubuntu-image` and a signed model assertion.
