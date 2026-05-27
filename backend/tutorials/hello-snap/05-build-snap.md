# Build the snap

With the source code and recipe in place, it is time to run Snapcraft.

## Navigate to the project directory

```bash run
cd ~/hello-snap
```

## Build the snap

Snapcraft will pull the `core24` base, compile your C code, and assemble a `.snap` file:

```bash run
snapcraft --destructive-mode
```

> `--destructive-mode` builds directly in the current environment instead of launching a separate build container. This is fine for our Ubuntu 24.04 LXD container.

The build typically takes 1–3 minutes the first time (downloading the base image). You will see output like:

```
Pulling hello
Building hello
Staging hello
Priming hello
Snapping |
Created snap package hello-snap_1.0_amd64.snap
```

## Verify the snap file was created

```bash run
ls -lh ~/hello-snap/*.snap
```

You should see `hello-snap_1.0_amd64.snap` (or similar). 

## Inspect the snap contents (optional)

```bash run
unsquashfs -l ~/hello-snap/hello-snap_1.0_amd64.snap
```

This shows the internal layout of the snap package: the binary, metadata, and snap configuration.

Ready to install and test? Click **Next →**.
