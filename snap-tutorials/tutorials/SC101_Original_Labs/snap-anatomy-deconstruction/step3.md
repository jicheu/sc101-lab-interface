---
title: "Unpacking & Inspecting Snap Internals"
---

## Objective

In this step, you will unpack the snap's squashfs archive onto disk to investigate its internal runtime control manifests, execution hooks, and binary components.

## Prerequisites

- Step 2 complete.
- A local `simple-server_*.snap` file present in the directory.

## Install required tools

Unpacking a Squashfs archive requires the `unsquashfs` extraction utility. Install it via the `squashfs-tools` package:

```bash run
sudo apt install -y squashfs-tools
```

## Instructions

To see how a snap operates or to debug its runtime behavior, you can extract its contents into a standard mutable directory layout.

1. Extract the contents of the `simple-server` snap filesystem archive:
```bash run
unsquashfs simple-server_*.snap
```

2. List the root contents of the generated `squashfs-root/` output folder to see its structural anatomy:
```bash run
ls squashfs-root/
```

Every extracted snap follows a strict convention:
* `bin/`: Contains application binaries or wrappers exposed by the snap.
* `meta/`: Contains vital system metadata instructions and control scripts.
* `usr/`: Contains dependencies, shared libraries, or packages bundled inside the workspace.

3. Inspect the foundational configuration layout file generated during compilation. This is the low-level metadata schema read directly by `snapd`:
```bash run
cat squashfs-root/meta/snap.yaml
```

4. Examine the lifecycle `hooks/` directory. Hooks are scripts triggered by `snapd` when configuration events occur:
```bash run
ls -la squashfs-root/meta/hooks/
```

5. Read the `configure` hook script to observe how it captures options applied to the snap:
```bash run
cat squashfs-root/meta/hooks/configure
```

6. Inspect the primary internal execution logic, which in this case is a standalone application shell script:
```bash run
cat squashfs-root/bin/simple-server.sh
```

Notice how the script utilizes the system binary tool `snapctl` to query values directly from the host daemon.

## What we learned

* How to inspect structural snap parameters using the `unsquashfs` utility.
* The significance of `meta/snap.yaml` as the authoritative definition file for the runtime daemon.
* How lifecycle hooks and scripts utilize `snapctl` variables to configure internal behavior dynamically.

## What's next

In the next step, we will make a functional change to the application script, repack it back into an archive, and deploy our custom modification.
