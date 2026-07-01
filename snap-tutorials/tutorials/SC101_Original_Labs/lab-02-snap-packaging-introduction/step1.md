---
title: Download and locally install a snap
---

## Objective

Download the `hello-world` snap and its assertions directly from the Snap Store to disk, then install it from those local files — bypassing the normal `snap install` network path.

## Prerequisites

- `snapd` is installed and running (Lab 01, Step 2).
- You are logged in with `snap login` (Lab 01, Step 3).

## Instructions

1. Create a working directory and move into it:

```bash run
mkdir ~/lab02 && cd ~/lab02
```

2. Download the snap and its assertion file to the current directory:

```bash run
snap download hello-world
```

Expected output:

```
Fetching snap "hello-world"
Fetching assertions for "hello-world"
```

Two files are created: a `.snap` file and a `.assert` file. List them:

```bash run
ls -lh ~/lab02/
```

> **Note:** The revision number in the filenames (e.g., `hello-world_29.snap`) reflects the current revision in the stable channel and will be higher than the examples shown here. Substitute the actual filenames in the commands below.

3. Register the assertions with `snapd`. This adds the cryptographic trust chain to the local snapd database before installing:

```bash run
snap ack hello-world_*.assert
```

> 📖 **Concept — Snap Assertions**  
> Assertions are signed, machine-verifiable statements that form the trust chain for every snap. `snap ack` loads them into the local snapd database so the daemon can verify the snap file before installation.  
> Official reference: https://snapcraft.io/docs/assertions

4. Install the snap from the local `.snap` file:

```bash run
snap install hello-world_*.snap
```

5. Confirm it is installed:

```bash run
snap list hello-world
```

## What we learned

- `snap download` fetches both the `.snap` binary and the `.assert` trust-chain file without installing.
- `snap ack` must be run before installing from a local file so snapd can verify the snap's signatures.
- `snap install <file>` installs from a local path rather than fetching from the Store.

## What's next

The next step opens the `.assert` file and explains the three assertion types that make up the trust chain.
