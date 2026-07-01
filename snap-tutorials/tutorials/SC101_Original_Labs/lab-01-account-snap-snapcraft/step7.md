---
title: Set up Git and clone the lab repository
---

## Objective

Install Git and clone the `snapcraft-101-labs` repository, which contains the source code used in all subsequent labs in this series.

## Install required tools

```bash run
sudo apt install -y git
```

Verify the installation:

```bash run
git --version
```

## Instructions

1. Clone the official Snapcraft 101 labs repository:

```bash run
git clone https://github.com/canonical/snapcraft-101-labs
```

2. Move into the cloned directory and list its contents:

```bash run
cd snapcraft-101-labs && ls -la
```

Each sub-directory corresponds to a lab in the series. You will work inside these directories in the labs that follow.

## What we learned

- Git is not pre-installed in the base Ubuntu 24.04 lab environment and must be explicitly installed.
- The `snapcraft-101-labs` repository from Canonical's GitHub organisation is the single source of truth for all lab exercises.

## What's next

Your environment is now fully configured. You have a Ubuntu SSO account, `snapd` running, `snapcraft` installed, and the lab source code cloned locally. You are ready to start building snaps in Lab 02.
