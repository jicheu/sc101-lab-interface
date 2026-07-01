---
title: Identify the snap file format
---

## Objective

Use the `file` command to identify the filesystem format used inside a `.snap` file and understand why snaps are packaged this way.

## Prerequisites

- `hello-world_*.snap` exists in `~/lab02/` (Step 1).

## Instructions

1. Run `file` against the snap binary:

```bash run
file ~/lab02/hello-world_*.snap
```

Expected output (sizes and dates will differ):

```
hello-world_29.snap: Squashfs filesystem, little endian, version 4.0,
19330 bytes, 10 inodes, blocksize: 131072 bytes,
created: Wed Apr 17 15:16:46 2019
```

> 📖 **Concept — Squashfs**  
> Squashfs is a compressed, read-only filesystem format. Snaps use it because it combines deduplication-friendly block compression with a cryptographic integrity check over the entire image, enabling snapd to verify a snap's contents before mounting it.  
> Official reference: https://snapcraft.io/docs/snap-format

Key fields in the output:

| Field | What it tells you |
|-------|-------------------|
| `Squashfs filesystem` | Every `.snap` file is a squashfs image, not a plain archive. |
| `version 4.0` | squashfs v4 is the standard format used by all snaps. |
| `blocksize: 131072` | The 128 KB block size controls compression granularity. |
| `created: ...` | The timestamp embedded in the image — reflects when the snap was built. |

2. Confirm the snap is not a zip or tar archive:

```bash run
file ~/lab02/hello-world_*.assert
```

The `.assert` file is plain text; the `.snap` is binary. Knowing both formats helps when debugging or scripting snap workflows.

## What we learned

- Every `.snap` file is a squashfs v4 read-only filesystem image.
- The squashfs format provides built-in compression and allows `snapd` to mount the snap directly without extracting it to disk.
- `file` is a quick, reliable way to confirm the format of any unknown binary.

## What's next

The next step uses `unsquashfs` to extract the snap's contents and walk through its directory structure.
