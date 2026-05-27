---
title: "Observe the first confinement failure"
---

## Objective

Run the strictly confined snap and observe the first AppArmor denial. Understanding the error message — and where it comes from — is the first step to fixing it.

## Instructions

### Run the snap

```bash run
inspire
```

When prompted, enter a filename such as `~/quote.txt`.

You will see:

```
Network error: Could not resolve host: icanhazip.com
```

### Why did this happen?

Under strict confinement, AppArmor blocks **all outgoing network connections** by default. The snap has no `network` plug declared, so the kernel rejects the socket call before the DNS lookup can even happen.

### Inspect the AppArmor denial

The kernel logs every blocked call. Let's see it:

```bash run
journalctl --no-pager -g 'apparmor.*DENIED.*inspire' | tail -5
```

You will see a `DENIED` entry containing `operation="connect"` or similar — this is AppArmor enforcing the sandbox boundary.

> 📖 **Concept — AppArmor**  
> AppArmor is a Linux Security Module that enforces per-process access control profiles. Snapd generates an AppArmor profile for every strictly confined snap. Any call not explicitly allowed in the profile is denied and logged.  
> Official reference: https://snapcraft.io/docs/security-sandboxing

## What we learned

- Strict confinement is enforced at the kernel level by AppArmor — it is not optional or advisory.
- Every denial is logged and readable with `journalctl`. This is your primary debugging tool for confinement issues.
- The fix is not to relax confinement but to declare the correct *interface*.

## What's next

In the next step we will declare the `network` interface to allow outgoing connections and rebuild the snap.
