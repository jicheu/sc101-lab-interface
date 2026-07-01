# Congratulations!

You have completed the **Snap Packaging Introduction** lab.

## What you learned

In this scenario you:

- Used `snap download` to fetch a snap and its assertions from the Snap Store without installing it
- Acknowledged assertions with `snap ack` and installed the snap offline
- Inspected the three core assertion types: `account-key`, `snap-declaration`, and `snap-revision`
- Confirmed that a `.snap` file is a SquashFS compressed filesystem image
- Extracted the snap with `unsquashfs` and explored the internal layout (`meta/snap.yaml`, `bin/`, `snap/manifest.yaml`)
- Repacked the snap directory with `snap pack` and installed the resulting unasserted snap using `--dangerous` mode

## Key concepts to remember

| Concept | Summary |
|---|---|
| Assertions | Digitally signed documents that link a snap to its publisher and store revision |
| SquashFS | The compressed, read-only filesystem format used for all snaps |
| `snap pack` | Repacks a directory into a `.snap` file — useful for debugging |
| `--dangerous` | Bypasses assertion/signature checks for local or unsigned snaps |

## Next steps

- [Craft your first snap – Snapcraft tutorial](https://documentation.ubuntu.com/snapcraft/stable/tutorials/craft-a-snap/)
- [Snap assertions reference – Ubuntu Core](https://documentation.ubuntu.com/core/reference/assertions/)
- [Snap install modes – Snapcraft](https://snapcraft.io/docs/install-modes)
- [Debug snaps with snap try – Snapcraft](https://snapcraft.io/docs/snap-try)
