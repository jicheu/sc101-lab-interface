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

AppArmor writes denials to the kernel ring buffer. Read it with:

```bash run
dmesg | grep -i 'apparmor.*DENIED' | tail -5
```

You should see a line like:

```
[...] audit: type=1400 audit(...): apparmor="DENIED" operation="connect" profile="snap.inspire.inspire" ...
```

Key fields to notice:
- `apparmor="DENIED"` — the action was blocked
- `profile="snap.inspire.inspire"` — the sandboxed process (`<snap>.<app>`)
- `operation="connect"` — a network socket call was attempted

If `dmesg` shows nothing, try reading from the journal's kernel facility:

```bash run
journalctl -k --no-pager | grep -i apparmor | tail -5
```

> 📖 **Concept — AppArmor**  
> AppArmor is a Linux Security Module that enforces per-process access control profiles. Snapd generates an AppArmor profile for every strictly confined snap. Any call not explicitly allowed in the profile is denied and logged to the kernel ring buffer.  
> Official reference: https://snapcraft.io/docs/security-sandboxing

## What we learned

- Strict confinement is enforced at the kernel level by AppArmor — it is not optional or advisory.
- Every denial is logged and readable with `journalctl`. This is your primary debugging tool for confinement issues.
- The fix is not to relax confinement but to declare the correct *interface*.

## What's next

In the next step we will declare the `network` interface to allow outgoing connections and rebuild the snap.
