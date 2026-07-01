---
title: "Acquiring Code Repositories & Inspecting Release History"
---

## Objective

In this step, you will clone the master course workspace code assets using git and explore upstream architecture release history maps using the publishing client tool.

## Prerequisites

- Step 1 complete (`git` tool installed).
- Step 2 complete (`snapcraft` toolchain authenticated).

## Instructions

1. Clone the master course code workspace mapping paths containing all declarative blueprints and scripts for subsequent training steps:
```bash run
git clone https://github.com/Cruzh3r2107/snapcraft-101-lab.git
```

2. Confirm the directory structure was cleanly established inside your workspace:
```bash run
ls -lh snapcraft-101-lab/
```

3. Evaluate the distribution matrices of an active package to see exactly which versions are mapped across multiple architectures and release tracks:
```bash run
snapcraft status hello-world
```

This matrix provides visibility into the release tracks across all system configurations (such as `amd64`, `arm64`, etc.), confirming what code builds are live for specific deployment targets.

## What we learned

* How to pull down external code definitions safely into the target workspace.
* Interrogating remote multi-architecture mapping matrix sheets using `snapcraft status`.

## What's next

You have successfully completed the core workspace configuration lab! You now possess a validated developer workspace identity, functional low-level runtime engines, and verified commands. In the next lab module, you will write your first declarative configuration blueprint from scratch.
