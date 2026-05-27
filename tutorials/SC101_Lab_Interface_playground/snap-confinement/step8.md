---
title: "Connect the interface and verify"
---

## Objective

Connect the `home` interface, run the fully confined snap successfully, and inspect its final permission set.

## Instructions

### Connect the home interface

On Ubuntu Server (and Ubuntu Core), the `home` interface is not auto-connected. Connect it manually:

```bash run
snap connect inspire:home :home
```

> On Ubuntu Desktop this step is not needed — the interface is connected automatically at install time.

### Run the snap

```bash run
inspire
```

Enter a path in your home directory, for example `~/quote-strict.txt`:

```bash run
cat ~/quote-strict.txt
```

🎉 The snap fetches your public IP and writes it to the file. It is **strictly confined** and works correctly.

### Inspect the final interface connections

```bash run
snap connections inspire
```

You will see both `inspire:network` and `inspire:home` listed as connected. Any interface **not** listed here is still blocked.

## What we learned

| Attempt | Result | Fix applied |
|---|---|---|
| `strict`, no interfaces | Network blocked by AppArmor | Add `plugs: [network]` |
| `strict` + `network` | File write blocked | Add `plugs: [home]` |
| `strict` + `network` + `home` connected | ✅ Works | — |

- Strict confinement blocks **every** resource by default. Each capability must be declared and connected separately.
- `snap connections` is the ground truth for what a snap is allowed to do at runtime.
- On Ubuntu Core, every snap is strictly confined — there is no devmode fallback. Correct interface declarations are a hard requirement.
- The iterative pattern (run → read the denial → add the interface → rebuild) is the standard workflow for fixing confinement issues.

## What's next

You have completed the **Understanding what confinement means** tutorial. You now know how to:
- Package a C app as a strictly confined snap
- Read AppArmor denial logs
- Declare snap interfaces precisely
- Connect interfaces on Ubuntu Server / Ubuntu Core

The next tutorial covers **Creating Ubuntu Core images** — where these confinement skills become essential.
