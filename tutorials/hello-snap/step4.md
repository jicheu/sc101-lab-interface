---
title: "Write snapcraft.yaml"
---

The `snapcraft.yaml` file is the recipe that describes your snap: its name, version, how to build it, and what it is allowed to do at runtime.

## Create the snapcraft configuration file

```bash run
mkdir -p ~/hello-snap/snap
```

```bash run
cat > ~/hello-snap/snap/snapcraft.yaml << 'EOF'
name: hello-snap
base: core24
version: '1.0'
summary: Hello World C application
description: |
  A minimal C program packaged as a strictly confined snap.
  Built as part of the SC101 lab tutorial.

grade: stable
confinement: strict

parts:
  hello:
    plugin: make
    source: src/
    override-build: |
      gcc -o $CRAFT_PART_INSTALL/hello hello.c

apps:
  hello:
    command: hello
EOF
```

## Inspect the file

```bash run
cat ~/hello-snap/snap/snapcraft.yaml
```

## Key fields explained

| Field | Meaning |
|-------|---------|
| `name` | The snap's unique identifier on the store |
| `base` | The Ubuntu base image to run against (`core24` = Ubuntu 24.04) |
| `confinement: strict` | The snap cannot access resources outside its sandbox |
| `parts` | How to build each component of the snap |
| `apps` | The commands exposed to the user after installation |

> **Strict confinement** means the snap can only access what it explicitly requests via *interfaces*. Our hello-world needs no special interfaces since it only writes to stdout.

Click **Next →** to build the snap.
