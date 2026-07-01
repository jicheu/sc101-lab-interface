---
title: Explore snapd
---

## Objective

Install `snapd`, the snap runtime daemon, and verify it is working correctly by inspecting version information.

> 📖 **Concept — snapd**  
> `snapd` is the background service that manages snap packages on Linux. It handles installation, updates, confinement, and interfaces for all snaps on the system.  
> Official reference: https://snapcraft.io/docs/installing-snapd

## Install required tools

The base Ubuntu 24.04 environment used in this lab does not include `snapd` by default. Install it now:

```bash run
sudo apt install -y snapd
```

Confirm the service is running:

```bash run
sudo systemctl enable --now snapd.socket
```

## Instructions

1. Check the installed versions of the `snap` client, the `snapd` daemon, and the series (Ubuntu core base):

```bash run
snap version
```

Expected output (versions may differ):

```
snap     2.63+24.04ubuntu0.1
snapd    2.63+24.04ubuntu0.1
series   16
ubuntu   24.04
kernel   6.8.0-39-generic
```

The three key fields are:
- **snap** — the CLI client version
- **snapd** — the background daemon version
- **series** — the snap platform series (always 16 for current Ubuntu releases)

## What we learned

- `snapd` must be installed explicitly in the lab container environment.
- `snap version` reports the client, daemon, and platform series versions, which are useful for debugging compatibility issues.

## What's next

With `snapd` running, the next step explores the `snap` CLI to search for, inspect, and discover snaps.
