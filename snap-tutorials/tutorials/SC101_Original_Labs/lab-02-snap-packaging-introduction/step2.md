---
title: Explore snap assertions
---

## Objective

Read the `.assert` file downloaded in the previous step and understand the three assertion types that form a snap's cryptographic trust chain.

## Prerequisites

- `hello-world_*.assert` exists in `~/lab02/` (Step 1).

## Instructions

1. Open the assertions file with `less` (press `q` to quit):

```bash run
less ~/lab02/hello-world_*.assert
```

The file contains multiple assertion blocks separated by blank lines. Each block has a header section of key-value fields and ends with a base64-encoded cryptographic signature.

2. Extract and count the assertion types present in the file:

```bash run
grep "^type:" ~/lab02/hello-world_*.assert
```

Expected output:

```
type: account-key
type: snap-declaration
type: snap-revision
```

> 📖 **Concept — Snap Assertion Types**  
> Every snap published to the Snap Store is accompanied by a chain of signed assertions. Together they let `snapd` verify that a snap binary came from its declared publisher and has not been tampered with.  
> Official reference: https://snapcraft.io/docs/assertions

The three assertion types for snaps are:

| Type | Purpose |
|------|---------|
| `account-key` | Declares and verifies the public key used to sign the other assertions. Without this, snapd cannot trust the signatures on the assertions that follow. |
| `snap-declaration` | Contains key metadata about the snap: its snap-id, publisher, and which interfaces (if any) are auto-connected on install. |
| `snap-revision` | Ties a specific snap binary (identified by its SHA3-384 hash) to a revision number in the Store, preventing downgrade or substitution attacks. |

3. Inspect the `snap-declaration` block more closely to see the snap's declared interfaces:

```bash run
grep -A 30 "^type: snap-declaration" ~/lab02/hello-world_*.assert | head -40
```

## What we learned

- The `.assert` file is a chain of three signed blocks: `account-key` → `snap-declaration` → `snap-revision`.
- `snapd` verifies this entire chain before allowing installation, binding the binary to its Store identity.
- The `snap-declaration` assertion is where auto-connected interface plugs are declared.

## What's next

The next step examines the `.snap` binary file itself and identifies its filesystem format.
