---
title: "Install & test"
---

## Objective

Install the snap locally and verify it runs correctly under strict confinement, then inspect its interface connections.

## Prerequisites

- `~/hello-snap/hello-snap_1.0_amd64.snap` built (completed in the previous step).

## Instructions

### Install the snap locally (sideloading)

Because this snap has not been published to the Snap Store, install it with the `--dangerous` flag to bypass store signature verification:

```bash run
snap install --dangerous ~/hello-snap/hello-snap_1.0_amd64.snap
```

### Run the snap

```bash run
hello-snap.hello
```

You should see:

```
Hello from a confined snap!
```

### Confirm confinement is active

> 📖 **Concept — Snap Interfaces**  
> Interfaces are the mechanism through which a strictly confined snap requests access to system resources (network, files, hardware, etc.). A snap declares the interfaces it needs; the system connects them at install time or on demand.  
> Official reference: https://snapcraft.io/docs/interfaces

```bash run
snap connections hello-snap
```

The output lists the snap's interface connections. Since `hello-snap` requests no special interfaces, it runs with the minimal sandbox — it cannot access your network, filesystem, or other resources.

### Check the snap info

```bash run
snap info hello-snap
```

## What we learned

- `snap install --dangerous` installs a locally built snap that has not been signed by the store.
- A strictly confined snap with no declared interfaces can only write to stdout — no network, no filesystem outside its own data directory.
- `snap connections` shows which interfaces a snap has connected.

## What's next

Continue to the **Snap Confinement** tutorial, where you will build a snap that requires network and home directory access, deliberately break it under strict confinement, and fix it one interface at a time.
