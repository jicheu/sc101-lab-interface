---
title: "Grant network access with the network interface"
---

## Objective

Declare the `network` snap interface so the strictly confined snap can open outgoing connections. Rebuild, reinstall, and run — then observe the next failure.

> 📖 **Concept — network interface**  
> The `network` interface allows a snap to open outgoing network connections (TCP, UDP). Without it, all socket calls are blocked by AppArmor under strict confinement.  
> Official reference: https://snapcraft.io/docs/network-interface

## Instructions

### Add the `network` plug to snapcraft.yaml

The file already exists from a previous step. We add only the lines we need:

**Diff:**

```diff
--- snapcraft.yaml
+++ snapcraft.yaml
@@ -18,3 +18,5 @@
 apps:
   inspire:
     command: inspire
+    plugs:
+      - network
```

**Apply:**

```bash run
sed -i '/^    command: inspire/a\    plugs:\n      - network' ~/inspire/snap/snapcraft.yaml
```

**Verify:**

```bash run
grep -A5 'apps:' ~/inspire/snap/snapcraft.yaml
```

### Rebuild and reinstall

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

### Run again

```bash run
inspire
```

Enter a filename like `~/quote.txt` when prompted.

The network call now succeeds — but you get a new error:

```
Cannot open file: Permission denied
```

### Why this new error?

The `network` interface granted network access only. Strict confinement also blocks access to your home directory — that is a completely separate interface.

Each interface grants exactly one type of permission. There is no "grant everything" shortcut under strict confinement.

## What we learned

- Interfaces are declared under `apps.<name>.plugs` in `snapcraft.yaml`.
- Each interface is additive and minimal — `network` grants only network access, nothing else.
- When one problem is fixed, confinement reveals the next one. This is expected and intentional.

## What's next

In the next step we will declare the `home` interface to allow writing to the user's home directory.
