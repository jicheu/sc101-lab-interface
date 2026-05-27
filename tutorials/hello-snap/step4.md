---
title: "Write snapcraft.yaml"
---

## Objective

Write the `snapcraft.yaml` recipe that describes how Snapcraft should build and confine your snap.

## Prerequisites

- `~/hello-snap/src/hello.c` created and compiling (completed in the previous step).

## Instructions

> 📖 **Concept — snapcraft.yaml**  
> `snapcraft.yaml` is the declarative recipe for a snap. It defines the snap's identity, how to build each component, which Ubuntu base image to use, and what the snap is allowed to do at runtime.  
> Official reference: https://snapcraft.io/docs/snapcraft-yaml-reference

### Create the snap configuration directory

```bash run
mkdir -p ~/hello-snap/snap
```

### Write the recipe

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

> 📖 **Concept — Strict Confinement**  
> A snap with `confinement: strict` is sandboxed by AppArmor and seccomp. It cannot access the network, filesystem, or any other resource unless it explicitly requests permission through snap interfaces.  
> Official reference: https://snapcraft.io/docs/snap-confinement#heading--strict

### Inspect the file

```bash run
cat ~/hello-snap/snap/snapcraft.yaml
```

### Key fields explained

| Field | Meaning |
|-------|---------|
| `name` | The snap's unique identifier on the store |
| `base` | The Ubuntu base image to run against (`core24` = Ubuntu 24.04) |
| `confinement: strict` | The snap cannot access resources outside its sandbox |
| `parts` | How to build each component of the snap |
| `apps` | The commands exposed to the user after installation |

Our hello-world needs no special interfaces since it only writes to stdout — strict confinement is safe with no additional declarations.

## What we learned

- `snapcraft.yaml` is the single source of truth for how a snap is built and confined.
- `confinement: strict` enforces an AppArmor/seccomp sandbox at runtime.
- The `parts` section maps to build steps; `apps` maps to user-facing commands.

## What's next

In the next step you will run Snapcraft to build the `.snap` package from this recipe.
