---
title: "Package as a devmode snap"
---

## Objective

Package the `inspire` app as a snap using `devmode` confinement to verify it works correctly inside a snap environment before applying any restrictions.

## Prerequisites

- `~/inspire/src/inspire.c` compiled and tested (completed in the previous step).
- Snapcraft installed (completed in the Hello Snap tutorial).

## Instructions

> 📖 **Concept — devmode**  
> `devmode` is a special confinement level for development. The snap runs without any sandbox restrictions, but the kernel logs any access that *would* have been blocked under strict confinement. Snaps installed with `--devmode` cannot be published to the Snap Store.  
> Official reference: https://snapcraft.io/docs/snap-confinement#heading--devmode

### Create the snap directory

```bash run
mkdir -p ~/inspire/snap
```

### Write snapcraft.yaml

```bash run
cat > ~/inspire/snap/snapcraft.yaml << 'EOF'
name: inspire
base: core24
version: '1.0'
summary: Fetch an inspirational quote and save it to a file
description: |
  inspire asks for a filename, fetches a random trivia fact from
  numbersapi.com, and writes it to the specified file.

grade: devel
confinement: devmode

parts:
  inspire:
    plugin: nil
    source: src/
    build-packages:
      - gcc
      - libcurl4-openssl-dev
    stage-packages:
      - libcurl4
    override-build: |
      make
      install -m755 inspire "$CRAFT_PART_INSTALL/"

apps:
  inspire:
    command: inspire
EOF
```

> `stage-packages` bundles the runtime library (`libcurl4`) inside the snap so it does not depend on what is installed on the host system.

### Build the snap

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

The build downloads `core24`, compiles the app, and bundles libcurl. This takes a couple of minutes on the first run.

### Install in devmode

```bash run
snap install --devmode ~/inspire/inspire_1.0_amd64.snap
```

### Run it

```bash run
inspire
```

Enter a path like `~/quote-devmode.txt` when prompted.

```bash run
cat ~/quote-devmode.txt
```

The snap fetches the quote and writes the file — no restrictions, everything works.

### Check the logs (optional)

Even in devmode, the kernel logs any access that *would* have been denied under strict confinement:

```bash run
journalctl --no-pager -g 'apparmor.*inspire' | tail -20
```

You may already see entries for `network` and `home` access. These are warnings only — in the next step, they become hard blocks.

## What we learned

- `devmode` lets you verify the snap works before applying confinement.
- `stage-packages` ensures runtime libraries are bundled inside the snap, making it self-contained.
- The kernel already logs potential confinement violations in devmode — these become real denials under `strict`.

## What's next

In the next step you will switch to `strict` confinement, observe the resulting errors, and fix them by declaring the correct snap interfaces.
