---
title: "Enable strict confinement"
---

## Objective

Switch the `inspire` snap from `devmode` to `strict` confinement. Strict confinement activates AppArmor and seccomp sandboxing — the snap will no longer be allowed to access any resource it hasn't explicitly declared.

> 📖 **Concept — Strict Confinement**  
> A snap with `confinement: strict` is sandboxed by AppArmor and seccomp. It cannot access the network, filesystem, or any other resource unless it explicitly requests permission through snap interfaces.  
> Official reference: https://snapcraft.io/docs/snap-confinement#heading--strict

> 📖 **Concept — Snap Interfaces**  
> Interfaces are the mechanism through which a strictly confined snap requests access to system resources. Each interface grants a specific, auditable permission — nothing more.  
> Official reference: https://snapcraft.io/docs/interfaces

> 📖 **Concept — Plugs and Slots**  
> A snap declares a *plug* for each interface it needs. The system provides the matching *slot*. When a plug is connected to a slot, the permission is granted.  
> Official reference: https://snapcraft.io/docs/interface-management

## Instructions

### Update snapcraft.yaml

The file already exists from the previous step. We patch it with `sed` instead of overwriting it so you can see exactly what changed.

**Diff:**

```diff
--- snapcraft.yaml
+++ snapcraft.yaml
@@ -8,2 +8,2 @@
-grade: devel
-confinement: devmode
+grade: stable
+confinement: strict
```

**Apply:**

```bash run
sed -i 's/confinement: devmode/confinement: strict/' ~/inspire/snap/snapcraft.yaml
sed -i 's/grade: devel/grade: stable/' ~/inspire/snap/snapcraft.yaml
```

**Verify:**

```bash run
grep -E 'confinement|grade' ~/inspire/snap/snapcraft.yaml
```

You should see:
```
grade: stable
confinement: strict
```

### Rebuild and reinstall

```bash run
cd ~/inspire && snapcraft pack --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

## What we learned

- `confinement: strict` activates the AppArmor and seccomp sandbox. From this point forward the snap cannot access any resource it hasn't declared.
- We patch existing files with `sed` to make changes visible and auditable.

## What's next

The snap is built and installed under strict confinement. In the next step we will run it and see what breaks.
