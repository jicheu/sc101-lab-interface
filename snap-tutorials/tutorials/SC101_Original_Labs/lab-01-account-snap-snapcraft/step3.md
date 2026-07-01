---
title: Discover snaps with the snap CLI
---

## Objective

Log in to the Snap Store from the command line and use `snap` discovery commands to inspect snaps, query system configuration, and navigate the built-in help system.

## Prerequisites

- `snapd` is installed and running (Step 2).
- You have a Ubuntu SSO account (Step 1).

## Instructions

1. Log in to the Snap Store using your Ubuntu SSO credentials:

```bash run
snap login
```

2. Verify the login succeeded:

```bash run
snap whoami
```

> **Note:** Once you are logged in with `snap login`, most subsequent `snap` commands no longer require `sudo`.

3. List all currently installed snaps. The optional `--all` flag also shows disabled (rolled-back) revisions:

```bash run
snap list
```

```bash run
snap list --all
```

4. Inspect detailed metadata for the `core24` base snap. Add `--verbose` to see all available fields:

```bash run
snap info core24
```

```bash run
snap info core24 --verbose
```

5. Read the top-level snap system configuration. The `-d` flag outputs the result as JSON:

```bash run
snap get system
```

```bash run
snap get system -d
```

6. Retrieve a specific configuration key and drill down into nested keys:

```bash run
snap get system seed
```

```bash run
snap get system seed.loaded
```

The `seed.loaded` key reports whether the initial set of seeded snaps has finished installing — useful when scripting post-install checks.

7. Explore the built-in help:

```bash run
snap --help
```

```bash run
snap help --all
```

To get help for any individual sub-command, use either form:

```bash run
snap info --help
```

```bash run
snap help info
```

## What we learned

- `snap login` authenticates against the Snap Store using Ubuntu SSO credentials and removes the need for `sudo` on most commands.
- `snap list [--all]` shows installed snaps and, with `--all`, all stored revisions.
- `snap info` exposes full metadata — channels, sizes, contact details — for any snap in the store.
- `snap get system` reads snap daemon configuration at any level of key granularity.
- `snap help` and `snap COMMAND --help` are the primary self-documentation tools.

## What's next

The next step installs snaps and inspects their connections and system services.
