---
id: uc-gadget-snap
title: "Modifying the gadget"
description: >
  Learn what a gadget snap is, how it controls hardware and boot configuration
  on Ubuntu Core, and how to modify it to customise a device image.
difficulty: intermediate
time: 45
section: "Creating Ubuntu Core image"
tags: [ubuntu-core, gadget, snap, hardware, boot]

environment:
  dev:
    image: ubuntu:24.04
    prestart:
      - apt-get update -y
      - apt-get install -y snapd git

steps:
  - file: step1.md
    title: "Introduction"
  - file: step2.md
    title: "What is a gadget snap?"
  - file: step3.md
    title: "Inspect a reference gadget"
---

## About this tutorial

> ⚠️ **This tutorial is a work in progress.** Content is coming soon.

The gadget snap is the mechanism Ubuntu Core uses to define and control
hardware-specific behaviour: partition layout, bootloader configuration,
and device-specific defaults.

In this tutorial you will learn how the gadget snap is structured and
how to make targeted modifications to customise a device image.
