# Step 1 – Download the hello-world snap

## Objectives

In this step you will:

- Download a snap package and its assertions from the Snap Store **without** installing it
- Understand the two files that `snap download` produces

## Required tools

`snapd` (which provides the `snap` CLI) is pre-installed and started in the background for you.

`snapd` is pre‑installed by `background.sh` – no extra install needed.

## Download the snap

The `snap download` command fetches a snap and its signed assertions from the Snap Store without installing it. This is useful when you want to inspect or sideload a snap offline.

```bash
snap download hello-world
```

You should see output similar to:

```
Fetching snap "hello-world"
Fetching assertions for "hello-world"
```

```bash
# Tools (g++, curl) are already installed by background.sh – you can skip this step in Killercoda.
``` run

Two files are written to your current directory:

| File | Description |
|---|---|
| `hello-world_<rev>.snap` | The snap package itself — a compressed SquashFS image |
| `hello-world_<rev>.assert` | A bundle of signed assertions from the Snap Store |

> **Note:** The revision number (e.g. `_29`) reflects the latest published revision and may differ from the examples in this lab. Subsequent steps use shell globs (`hello-world_*.snap`) to handle this automatically.

Verify the files are present:

```bash
ls -lh hello-world_*
```

Both the `.snap` and `.assert` files should be listed.

> **Further reading:** [Getting started with snaps – Snapcraft](https://snapcraft.io/docs/tutorials/get-started/)

## Summary

You used `snap download` to fetch the `hello-world` snap without installing it. The result is two files: the snap package (a SquashFS image) and a signed assertions bundle. In the next step you will use these files to install the snap locally.
