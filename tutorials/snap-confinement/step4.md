---
title: "Switch to strict confinement"
---

Time to enable **strict confinement** and understand what it actually blocks.
We will hit two errors deliberately — then fix each one by declaring the right
snap interface.

---

## Part 1 — Enable strict confinement

Edit `snapcraft.yaml` and change `confinement` to `strict` and `grade` to `stable`:

```bash run
sed -i 's/confinement: devmode/confinement: strict/' ~/inspire/snap/snapcraft.yaml
sed -i 's/grade: devel/grade: stable/' ~/inspire/snap/snapcraft.yaml
```

Verify the change:

```bash run
grep -E 'confinement|grade' ~/inspire/snap/snapcraft.yaml
```

Rebuild and reinstall:

```bash run
cd ~/inspire && snapcraft --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

---

## Part 2 — Run it and observe the first failure

```bash run
inspire.inspire
```

Enter any filename (e.g. `~/quote.txt`) when prompted.

You should see an error like:

```
Network error: Could not resolve host: zenquotes.io
```

or

```
Network error: Failed to connect to zenquotes.io
```

**Why?** Strict confinement uses AppArmor to block all outgoing network
connections by default. The snap has no `network` plug declared.

### Check the AppArmor denial

```bash run
journalctl --no-pager -g 'apparmor.*DENIED.*inspire' | tail -5
```

You will see a `DENIED` entry for a socket syscall.

---

## Part 3 — Grant network access

Add the `network` plug to `snapcraft.yaml`:

```bash run
cat > ~/inspire/snap/snapcraft.yaml << 'EOF'
name: inspire
base: core24
version: '1.0'
summary: Fetch an inspirational quote and save it to a file
description: |
  inspire asks for a filename, fetches a random quote from
  zenquotes.io, and writes it to the specified file.

grade: stable
confinement: strict

parts:
  inspire:
    plugin: make
    source: src/
    build-packages:
      - libcurl4-openssl-dev
    stage-packages:
      - libcurl4

apps:
  inspire:
    command: inspire
    plugs:
      - network
EOF
```

Rebuild and reinstall:

```bash run
cd ~/inspire && snapcraft --destructive-mode
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

**Why?** Strict confinement also blocks access to your home directory.
The `network` plug only grants network access; file access is a separate interface.

---

## Part 4 — Grant home directory access

The `home` interface allows a snap to read and write non-hidden files under `~/`.
Add it alongside `network`:

```bash run
cat > ~/inspire/snap/snapcraft.yaml << 'EOF'
name: inspire
base: core24
version: '1.0'
summary: Fetch an inspirational quote and save it to a file
description: |
  inspire asks for a filename, fetches a random quote from
  zenquotes.io, and writes it to the specified file.

grade: stable
confinement: strict

parts:
  inspire:
    plugin: make
    source: src/
    build-packages:
      - libcurl4-openssl-dev
    stage-packages:
      - libcurl4

apps:
  inspire:
    command: inspire
    plugs:
      - network
      - home
EOF
```

Rebuild and reinstall:

```bash run
cd ~/inspire && snapcraft --destructive-mode
```

```bash run
snap install --dangerous ~/inspire/inspire_1.0_amd64.snap
```

---

## Part 5 — Connect the interface and run

After installation, manually connect the `home` interface
(on Ubuntu Desktop this is prompted automatically; on server it requires one command):

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

---

## What you learned

| Attempt | Result | Fix |
|---|---|---|
| `strict`, no interfaces | Network blocked | Add `plugs: [network]` |
| `strict` + `network` | File access blocked | Add `plugs: [home]` |
| `strict` + `network` + `home` | ✅ Works | — |

### Why this matters on Ubuntu Core

On Ubuntu Core, **every snap is strictly confined by default**.
Your app must explicitly declare every interface it needs.
The snap store reviews these declarations — this is how Ubuntu Core guarantees
that installed snaps cannot access resources they were not granted permission for.

### View the final interface connections

```bash run
snap connections inspire
```

You will see `inspire:network` and `inspire:home` listed as connected.

---

**Congratulations!** You have now experienced snap confinement hands-on and know
exactly how to declare interfaces to grant precise, auditable permissions.
