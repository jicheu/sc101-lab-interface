---
title: "Build the snap"
---

## Objective

Run Snapcraft to compile the C code and assemble it into a `.snap` package file.

## Prerequisites

- `~/hello-snap/snap/snapcraft.yaml` created (completed in the previous step).
- Snapcraft installed (completed in step 2).

## Instructions

### Navigate to the project directory

```bash run
cd ~/hello-snap
```

### Build the snap

Snapcraft will pull the `core24` base, compile your C code, and assemble a `.snap` file.

> The `--destructive-mode` flag builds directly in the current environment instead of launching a separate build container. This is appropriate for this Ubuntu 24.04 lab environment.  
> Official reference: https://snapcraft.io/docs/build-options

```bash run
snapcraft pack --destructive-mode
```

The build typically takes 1–3 minutes the first time (downloading the base image). You will see output like:

```
Pulling hello
Building hello
Staging hello
Priming hello
Snapping |
Created snap package hello-snap_1.0_amd64.snap
```

### Verify the snap file was created

```bash run
ls -lh ~/hello-snap/*.snap
```

You should see `hello-snap_1.0_amd64.snap` (or similar).

### Inspect the snap contents (optional)

```bash run
unsquashfs -l ~/hello-snap/hello-snap_1.0_amd64.snap
```

This shows the internal layout of the snap package: the binary, metadata, and snap configuration.

## What we learned

- `snapcraft pack --destructive-mode` builds the snap directly in the current environment without a separate container.
- The output is a `.snap` file (a SquashFS archive) containing the binary, metadata, and all declared dependencies.
- `unsquashfs -l` lets you inspect the contents of a snap without installing it.

## What's next

In the next step you will install the snap locally and verify it runs correctly under strict confinement.
