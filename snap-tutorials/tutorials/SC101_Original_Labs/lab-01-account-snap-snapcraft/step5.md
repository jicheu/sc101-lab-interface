---
title: Switch channels, refresh, and remove snaps
---

## Objective

Switch a snap to a different release channel, refresh it to receive the channel's version, restart a snap service, and cleanly remove a snap from the system.

## Prerequisites

- `learnit` and `multipass` are installed (Step 4).

> 📖 **Concept — Snap Channels**  
> Every snap in the Snap Store is published across up to four risk levels: `stable`, `candidate`, `beta`, and `edge`. A *track* groups a set of channels for a specific major version (e.g., `latest`). Switching channels lets you test pre-release versions without reinstalling.  
> Official reference: https://snapcraft.io/docs/channels

## Instructions

1. Switch `learnit` from its current channel (stable) to `candidate`:

```bash run
snap switch learnit --channel=candidate
```

2. Refresh `learnit` to pull the version from the candidate channel:

```bash run
snap refresh learnit
```

3. Confirm the installed revision and channel have changed:

```bash run
snap list
```

```bash run
snap info learnit
```

4. Restart the `multipassd` service managed by the `multipass` snap:

```bash run
snap restart multipass.multipassd
```

`snap restart` is the correct way to restart a snap service — do not use `systemctl restart` directly, as the snap daemon manages the service lifecycle.

5. Remove `learnit` from the system:

```bash run
snap remove learnit
```

6. Confirm it no longer appears in the installed list:

```bash run
snap list
```

## What we learned

- `snap switch --channel=` changes the tracking channel without immediately updating the snap.
- `snap refresh` applies pending updates for one snap or, when run without arguments, for all installed snaps.
- `snap restart <snap>.<service>` restarts a service through the snap daemon, preserving snap confinement.
- `snap remove` uninstalls a snap and deletes its data.

## What's next

The next step installs Snapcraft, the build tool used to create snap packages, and explores its command-line interface.
