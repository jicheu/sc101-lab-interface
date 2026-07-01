---
title: "Inspecting Snap Assertions"
---

## Objective

In this step, you will download an official snap along with its assertion file from the Snap Store, and inspect the cryptographic statements that verify its publisher identity and system integrity.

## Prerequisites

None.

## Install required tools

The base target environment does not come with snap management tools pre-installed. Install the `snapd` background service to enable interaction with the snap system:

```bash run
sudo apt install -y snapd
```

## Instructions

Every snap downloaded from the Snap Store is accompanied by a signed statement called an assertion. These assertions let the local management daemon verify a snap's validity without needing to trust the raw file itself.

1. Download the `hello-world` snap package and its corresponding assertion file directly from the store into your workspace:
```bash run
snap download hello-world
```

2. Filter the downloaded assertion file to list the cryptographic metadata statements bundled within it:
```bash run
grep "type:" hello-world_*.assert
```

You will observe three primary assertion types:
* **account-key**: Certifies the public key used to sign all subsequent assertions.
* **snap-declaration**: Records the unique identity of the snap, its publisher name, and interface access rules.
* **snap-revision**: Cryptographically binds this specific file hash to a channel revision number to prevent unauthorized substitutions.

3. Import the assertion statements into `snapd`'s local database. This tells your machine to trust this specific signature sequence:
```bash run
snap ack hello-world_*.assert
```

4. Install the snap locally using the pre-downloaded file. Because the signatures were already acknowledged in the database, `snapd` validates and installs it without needing an active connection back to the store:
```bash run
snap install hello-world_*.snap
```

5. Confirm that the snap is installed correctly and matches the expected revision:
```bash run
snap list hello-world
```

## What we learned

* Snaps use detached, cryptographically signed assertions to guarantee integrity and provenance.
* The roles of `account-key`, `snap-declaration`, and `snap-revision` metadata statements.
* How to use `snap ack` to seed the daemon database for offline or local validated installations.

## What's next

In the next step, we will inspect the physical storage format of a snap and verify how it interacts with the system loopback mounts.
