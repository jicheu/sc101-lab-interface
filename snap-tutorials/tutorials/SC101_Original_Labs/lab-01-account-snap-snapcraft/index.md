---
id: lab-01-account-snap-snapcraft
title: "Lab 01 — Ubuntu SSO Account, Snap and Snapcraft"
description: Set up your Ubuntu developer account, explore snap package management, install Snapcraft, and prepare your Git environment for the Snapcraft 101 labs.
difficulty: beginner
time: 60
tags:
  - snap
  - snapcraft
  - ubuntu
  - sso
  - git
environment:
  image: ubuntu:24.04
  prestart:
    - sudo apt update -y
steps:
  - title: Create your Ubuntu SSO account
    file: step1.md
  - title: Explore snapd
    file: step2.md
  - title: Discover snaps with the snap CLI
    file: step3.md
  - title: Install snaps and inspect connections
    file: step4.md
  - title: Switch channels, refresh, and remove snaps
    file: step5.md
  - title: Install and use Snapcraft
    file: step6.md
  - title: Set up Git and clone the lab repository
    file: step7.md
---

This tutorial walks you through the foundational setup required for the Snapcraft 101 lab series. You will create a Ubuntu Single Sign-On (SSO) developer account, explore the `snap` command-line tool, install and manage snaps across channels, get started with `snapcraft`, and clone the lab source repository using Git.

By the end you will have a fully configured developer environment ready for the hands-on snap packaging labs that follow.
