---
title: Install snaps and inspect connections
---

## Objective

Install snaps from the Snap Store, run a snap application, and inspect the interface connections and systemd services that snaps expose.

## Prerequisites

- You are logged in with `snap login` (Step 3).

## Instructions

1. Inspect the `learnit` snap in the store before installing it:

```bash run
snap info learnit
```

This shows the available channels, publisher, and description without downloading the snap.

2. Install `learnit` and confirm it appears in the installed list:

```bash run
snap install learnit
```

```bash run
snap list
```

3. Run the snap application (press **Ctrl+C** to exit without completing it):

```bash run
learnit
```

> 📖 **Concept — Snap Interfaces**  
> Interfaces define the communication channels between snaps and the host system (or between snaps). A *plug* is a consumer endpoint; a *slot* is a provider endpoint. The snap daemon mediates all connections.  
> Official reference: https://snapcraft.io/docs/interfaces

4. List all interface connections on the system:

```bash run
snap connections
```

5. List only the connections for `learnit`:

```bash run
snap connections learnit
```

The output shows which plugs are connected to slots, and which are disconnected.

6. Install `multipass`, a snap that registers systemd services:

```bash run
snap install multipass
```

> 📖 **Concept — Plugs and slots**  
> When a snap declares a plug (e.g. `network`) and the system provides a matching slot, the snap daemon can connect them automatically or on request.  
> Official reference: https://snapcraft.io/docs/interface-management

7. List the systemd services registered by the `multipass` snap:

```bash run
snap services multipass
```

The output lists each service, its startup type (`enabled`/`disabled`), and its current state (`active`/`inactive`).

## What we learned

- `snap info` queries Store metadata without installing the snap.
- `snap install` downloads and installs a snap from the default (stable) channel.
- `snap connections [snap-name]` shows which interfaces are connected or disconnected for a snap.
- Snaps can register systemd services visible via `snap services`.

## What's next

The next step switches a snap to a different release channel, refreshes it to the new version, and removes it.
