---
title: "Package as a devmode snap"
---

Now package the app as a snap. We will start with **`devmode`** confinement —
also called *unconfined* — so we can verify the snap works before adding
any restrictions.

## What is devmode?

`devmode` is a special confinement level used during development:

- The snap runs **without any sandbox restrictions**
- All file, network, and device access is allowed
- Security violations are **logged** but not blocked
- Snaps installed with `--devmode` cannot be published to the Snap Store

This is the ideal starting point: get the app working as a snap first, then
tighten confinement one step at a time.

## Create the snap directory

```bash run
mkdir -p ~/inspire/snap
```

## Write snapcraft.yaml

```bash run
cat > ~/inspire/snap/snapcraft.yaml << 'EOF'
name: inspire
base: core24
version: '1.0'
summary: Fetch an inspirational quote and save it to a file
description: |
  inspire asks for a filename, fetches a random quote from
  zenquotes.io, and writes it to the specified file.

grade: devel
confinement: devmode

parts:
  inspire:
    plugin: make
    source: src/
    build-packages:
      - libcurl4-openssl-dev
    stage-packages:
      - libcurl4

apps:
  inspire:
    command: inspire
EOF
```

> **`stage-packages`** bundles the runtime library (`libcurl4`) inside the snap
> so it does not depend on what is installed on the host system.

## Build the snap

```bash run
cd ~/inspire && snapcraft --destructive-mode
```

The build downloads `core24`, compiles the app, and bundles libcurl.
This takes a couple of minutes on the first run.

## Install in devmode

```bash run
snap install --devmode ~/inspire/inspire_1.0_amd64.snap
```

## Run it

```bash run
inspire.inspire
```

Enter a path like `~/quote-devmode.txt` when prompted.

```bash run
cat ~/quote-devmode.txt
```

The snap fetches the quote and writes the file — no restrictions, everything works.

## Check the logs (optional)

Even in devmode, the kernel logs any access that *would* have been denied under
strict confinement:

```bash run
journalctl --no-pager -g 'apparmor.*inspire' | tail -20
```

You may already see entries for `network` and `home` access.
These are warnings only — in the next step, they become hard blocks.

Click **Next →** to switch to strict confinement.
