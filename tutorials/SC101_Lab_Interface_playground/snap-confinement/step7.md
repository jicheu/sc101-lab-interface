---
title: "Grant home directory access with the home interface"
---

## Objective

Declare the `home` snap interface so the strictly confined snap can write files to the user's home directory. Rebuild and reinstall.

> 📖 **Concept — home interface**  
> The `home` interface allows a snap to read and write non-hidden files under the user's home directory (`~/`). Hidden directories (`.config`, `.ssh`, etc.) remain off-limits.  
> It must be declared explicitly and, on Ubuntu Server, manually connected after installation.  
> Official reference: https://snapcraft.io/docs/home-interface

## Instructions

### Add the `home` plug to snapcraft.yaml

The `network` plug was added in the previous step. We now add `home` alongside it:

**Diff:**

```diff
--- snapcraft.yaml
+++ snapcraft.yaml
@@ -20,4 +20,5 @@
     plugs:
       - network
+      - home
```

**Apply:**

```bash run
sed -i '/      - network/a\      - home' ~/inspire/snap/snapcraft.yaml
```

**Verify:**

```bash run
grep -A7 'apps:' ~/inspire/snap/snapcraft.yaml
```

You should see both `network` and `home` listed under `plugs`.

### Rebuild and reinstall

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

## What we learned

- The `home` interface grants access to `~/` but not to hidden directories — this is intentional and part of the security model.
- Multiple interfaces are simply listed under `plugs`. Each is connected independently.
- On Ubuntu Desktop, the `home` interface is auto-connected at install time. On Ubuntu Server (and Ubuntu Core), it must be connected manually.

## What's next

The snap now declares both `network` and `home`. In the next step we connect the `home` interface and run the app successfully.
