---
id: uc-user-assertion
title: "Add a user assertion to connect to the image"
description: >
  Learn how to create a user assertion so you can log in to your Ubuntu
  Core image over SSH using your Ubuntu SSO account.
difficulty: intermediate
time: 30
section: "Creating Ubuntu Core image"
tags: [ubuntu-core, user-assertion, ssh, ubuntu-sso, snapd]
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
  - title: "Create an Ubuntu SSO account"
    file: step2.md
  - title: "Generate the user assertion"
    file: step3.md
  - title: "Inject the assertion into the image"
    file: step4.md
  - title: "Connect and verify"
    file: step5.md
---

## About this tutorial

> ⚠️ **This tutorial is a work in progress.** Content is coming soon.

This tutorial covers adding a user assertion to an Ubuntu Core image
so you can SSH in with your Ubuntu SSO credentials.
