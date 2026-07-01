---
title: Repack and install an unasserted snap
---

## Objective

Repack the extracted `squashfs-root` directory into a new snap file and install it in dangerous mode — a technique used when testing locally built snaps that have not been through the Snap Store.

## Prerequisites

- `~/lab02/squashfs-root/` exists from the previous step.
- `snapd` is installed and running.

## Instructions

> 📖 **Concept — Unasserted snaps**  
> A snap file that has never been uploaded to the Snap Store has no assertion chain. Installing it requires `--dangerous`, which tells `snapd` to skip assertion verification. This is the normal workflow for locally built snaps during development.  
> Official reference: https://snapcraft.io/docs/install-modes

1. Repack the `squashfs-root` directory into a new snap file. The argument is the directory to pack:

```bash run
cd ~/lab02 && snap pack squashfs-root
```

`snap pack` creates a `.snap` file in the current directory. List the result:

```bash run
ls -lh ~/lab02/*.snap
```

You will see the original downloaded snap alongside the newly created one. The new file has no revision in its name — it is identified only by name and version from `meta/snap.yaml`.

2. Install the repacked snap in dangerous mode:

```bash run
snap install ~/lab02/hello-world_*.snap --dangerous
```

> **Note:** If `hello-world` is already installed from Step 1, remove it first:
> ```bash run
> snap remove hello-world
> ```
> Then re-run the install command above.

3. Verify the snap is installed:

```bash run
snap list hello-world
```

The `Notes` column will show `try` or no store association, confirming this is an unasserted local install.

4. *(Optional)* Run the snap to confirm it works:

```bash run
hello-world
```

## What we learned

- `snap pack <directory>` creates a valid squashfs-format snap from any directory that contains a `meta/snap.yaml`.
- Repacking is a useful debugging technique: extract, modify, repack, test — without going through the Snap Store publish cycle.
- `snap install --dangerous` bypasses assertion verification and is the correct way to sideload locally built snaps during development.

## What's next

You now understand the complete physical structure of a snap: its squashfs filesystem, assertion chain, and metadata. The next labs will use `snapcraft` to build snaps from source.
