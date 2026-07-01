---
title: Install and use Snapcraft
---

## Objective

Install Snapcraft, log in with your Ubuntu SSO account, and explore the Snapcraft CLI — the tool used to build and publish snap packages.

## Prerequisites

- `snapd` is installed and running (Step 2).
- You have a Ubuntu SSO account (Step 1).

## Install required tools

Snapcraft requires the `--classic` flag because it needs access to the full system to build snaps in a build container:

```bash run
snap install snapcraft --classic
```

> 📖 **Concept — Classic confinement**  
> Classic confinement gives a snap the same level of system access as a traditionally installed application — it is not sandboxed. It is only granted for developer tools and other applications with legitimate needs.  
> Official reference: https://snapcraft.io/docs/snap-confinement#heading--classic

Verify the installation:

```bash run
snapcraft --version
```

## Instructions

1. Log in to the Snap Store with your Ubuntu SSO credentials:

```bash run
snapcraft login
```

2. Confirm the logged-in identity:

```bash run
snapcraft whoami
```

3. Explore the top-level help:

```bash run
snapcraft --help
```

4. Get help for any individual sub-command:

```bash run
snapcraft pack --help
```

5. *(Collaborators only)* The `status` command shows the published revisions across all channels and architectures. The following output is an example — you can only run this for snaps where your account is listed as a collaborator:

```
$ snapcraft status learnit
Track    Arch    Channel    Version    Revision
latest   amd64   stable     0.4        6
                 candidate  0.2        2
                 beta       0.2        2
                 edge       0.4        10
         arm64   stable     0.4        7
                 candidate  ↑          ↑
                 beta       ↑          ↑
                 edge       0.4        7
         armhf   stable     0.6        15
```

The `↑` symbol means the channel tracks the revision of the channel above it (promotion).

## What we learned

- `snapcraft` is installed as a classic-confined snap because it needs to orchestrate builds outside the snap sandbox.
- `snapcraft login` reuses Ubuntu SSO credentials, the same identity as `snap login`.
- `snapcraft status` provides a cross-architecture channel map for snaps you collaborate on.

## What's next

The final step installs Git and clones the Snapcraft 101 lab repository that contains the source code used in all subsequent labs.
