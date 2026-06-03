# Step 2 – Acknowledge assertions and install the snap

## Objectives

In this step you will:

- Understand why assertions must be acknowledged before a snap can be installed
- Import the assertions into snapd's local database with `snap ack`
- Install the snap from the locally downloaded file with `snap install`

## Required tools

No additional tools are needed. `snap` is already available from the previous step.

## Acknowledge the assertions

Before snapd will install a locally downloaded snap, it must be able to verify the snap against its chain of trust. The `snap ack` command reads the `.assert` file and imports the signed assertion documents into snapd's local database.

```bash
snap ack hello-world_*.assert && echo "Assertions accepted" || echo "Failed to acknowledge assertions" >&2 # Ref: https://documentation.ubuntu.com/core/reference/assertions/
```

If the command produces no output, the assertions were accepted successfully.

> **Further reading:** [Snap assertions – Ubuntu Core documentation](https://documentation.ubuntu.com/core/reference/assertions/)

## Install the snap

Now that the assertions are in place, snapd can verify the downloaded snap file and install it:

```bash
snap install hello-world_*.snap
```

You should see output confirming the installation:

```
hello-world 6.4 from Canonical✓ installed
```

## Verify the installation

```bash
snap list hello-world
```

The `Tracking` column shows the channel and the `Publisher` column confirms it is from Canonical.

## Summary

You imported the snap's cryptographic assertions and installed it from a local file — the same workflow snapd uses internally when installing from the store. In the next step you will inspect the assertions file to understand what information each assertion type carries.
