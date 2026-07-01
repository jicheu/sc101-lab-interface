---
title: "Developer Account Configuration & Authentication"
---

## Objective

In this step, you will generate cryptographic credential mappings and establish authenticated sessions connecting your terminal instance to the Canonical developer registry ecosystem.

## Instructions

1. Open your native workstation web browser and map out identity variables:
   * Navigate to `https://login.ubuntu.com` to establish your single identity credential profile.
   * Navigate to `https://dashboard.snapcraft.io` to sign the authoritative publisher agreement necessary to request snap namespace allocations.

2. Generate a secure cryptographic signature identity pair within your development terminal if an environment key pair does not currently exist:
```bash run
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
```

3. Print out your public credential component so that it can be uploaded and mirrored inside your profile settings at `login.ubuntu.com`:
```bash run
cat ~/.ssh/id_ed25519.pub
```

4. Authenticate the local `snapcraft` utility client to allow the local compilation engine to verify upload and management actions against your profile:
```bash run
snapcraft login
```

5. Interrogate the authorization token state to verify that your active identity tracking is live:
```bash run
snapcraft whoami
```

## What we learned

* The role of Single Sign-On namespaces across Canonical publishing engines.
* Generating cryptographic validation keys for secure environment validation.
* Linking local terminal utility states to online identity profiles via `snapcraft login`.

## What's next

In the next step, you will practice operational control methods on upstream repository assets using the primary client commands.
