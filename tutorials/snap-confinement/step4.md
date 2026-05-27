---
title: "Switch to strict confinement"
---

## Objective

Enable strict confinement on the `inspire` snap, observe the AppArmor denials it produces, and fix each one by declaring the correct snap interface — learning exactly why each interface is needed.

## Prerequisites

- `~/inspire/snap/snapcraft.yaml` created with `confinement: devmode` (completed in the previous step).
- The `inspire` snap installed in devmode (completed in the previous step).

## Instructions

> 📖 **Concept — Strict Confinement**  
> A snap with `confinement: strict` is sandboxed by AppArmor and seccomp. It cannot access the network, filesystem, or any other resource unless it explicitly requests permission through snap interfaces.  
> Official reference: https://snapcraft.io/docs/snap-confinement#heading--strict

> 📖 **Concept — Snap Interfaces**  
> Interfaces are the mechanism through which a strictly confined snap requests access to system resources. Each interface grants a specific, auditable permission — nothing more.  
> Official reference: https://snapcraft.io/docs/interfaces

> 📖 **Concept — Plugs and Slots**  
> A snap declares a *plug* for each interface it needs. The system (or another snap) provides the matching *slot*. When a plug is connected to a slot, the permission is granted.  
> Official reference: https://snapcraft.io/docs/interface-management

---

### Part 1 — Enable strict confinement

Change `confinement` to `strict` and `grade` to `stable` in `snapcraft.yaml`:

```bash run
sed -i 's/confinement: devmode/confinement: strict/' ~/inspire/snap/snapcraft.yaml
sed -i 's/grade: devel/grade: stable/' ~/inspire/snap/snapcraft.yaml
```

Verify the changes:

```bash run
grep -E 'confinement|grade' ~/inspire/snap/snapcraft.yaml
```

Rebuild and reinstall:

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

---

### Part 2 — Run it and observe the first failure

```bash run
inspire.inspire
```

Enter any filename (e.g. `~/quote.txt`) when prompted.

You should see an error like:

```
Network error: Could not resolve host: zenquotes.io
```

**Why?** Strict confinement uses AppArmor to block all outgoing network connections by default. The snap has no `network` plug declared.

#### Check the AppArmor denial

```bash run
journalctl --no-pager -g 'apparmor.*DENIED.*inspire' | tail -5
```

You will see a `DENIED` entry for a socket syscall.

---

### Part 3 — Grant network access

> 📖 **Concept — network interface**  
> The `network` interface allows a snap to open outgoing network connections. Without it, all socket calls are blocked by AppArmor under strict confinement.  
> Official reference: https://snapcraft.io/docs/network-interface

Add the `network` plug to `snapcraft.yaml`. The file already exists from a previous step, so this is a targeted change — shown as a diff first, then applied with `sed`.

**Diff — add `network` plug:**

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

**Apply the change:**

```bash run
sed -i '/^    command: inspire/a\    plugs:\n      - network' ~/inspire/snap/snapcraft.yaml
```

**Verify:**

```bash run
grep -A4 'apps:' ~/inspire/snap/snapcraft.yaml
```

Rebuild and reinstall:

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

Run again:

```bash run
inspire.inspire
```

Enter a filename like `~/quote.txt` when prompted.

Now the network call succeeds — but you get a new error:

```
Cannot open file: Permission denied
```

**Why?** Strict confinement also blocks access to your home directory. The `network` plug only grants network access; file access is a separate interface.

---

### Part 4 — Grant home directory access

> 📖 **Concept — home interface**  
> The `home` interface allows a snap to read and write non-hidden files under the user's home directory (`~/`). It must be declared explicitly under strict confinement.  
> Official reference: https://snapcraft.io/docs/home-interface

Add the `home` plug alongside `network`. The file was modified in Part 3, so this is again a targeted change:

**Diff — add `home` plug:**

```diff
--- snapcraft.yaml
+++ snapcraft.yaml
@@ -20,4 +20,5 @@
     plugs:
       - network
+      - home
```

**Apply the change:**

```bash run
sed -i '/      - network/a\      - home' ~/inspire/snap/snapcraft.yaml
```

**Verify:**

```bash run
grep -A6 'apps:' ~/inspire/snap/snapcraft.yaml
```

Rebuild and reinstall:

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

---

### Part 5 — Connect the interface and run

After installation, manually connect the `home` interface (on Ubuntu Server this requires one command; on Ubuntu Desktop it is prompted automatically):

```bash run
snap connect inspire:home :home
```

Now run the app:

```bash run
inspire.inspire
```

Enter a path in your home directory (e.g. `~/quote-strict.txt`):

```bash run
cat ~/quote-strict.txt
```

🎉 The quote is written. The snap is **strictly confined** and works correctly.

### View the final interface connections

```bash run
snap connections inspire
```

You will see `inspire:network` and `inspire:home` listed as connected.

## What we learned

| Attempt | Result | Fix |
|---|---|---|
| `strict`, no interfaces | Network blocked | Add `plugs: [network]` |
| `strict` + `network` | File access blocked | Add `plugs: [home]` |
| `strict` + `network` + `home` | ✅ Works | — |

- Strict confinement blocks **every** resource by default — network and home directory access each require their own explicit interface declaration.
- File modifications to a previously created `snapcraft.yaml` are shown as diffs and applied with `sed`, so the change is auditable and surgical.
- `snap connections` shows exactly which permissions a snap holds at any point in time.
- On Ubuntu Core, every snap is strictly confined — correct interface declarations are a hard requirement, not optional.

## What's next

You have completed the Snap Confinement tutorial. You now know how to declare interfaces, observe AppArmor denials, and fix confinement failures one interface at a time.
