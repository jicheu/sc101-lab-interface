---
title: "Set up build tools"
---

Before writing any code we need a C compiler and Snapcraft installed in the container.

## Update the package list

```bash run
apt-get update -y
```

## Install GCC and essential build tools

```bash run
apt-get install -y build-essential
```

## Install Snapcraft

Snapcraft is distributed as a snap itself. Install it along with `snapd`:

```bash run
apt-get install -y snapd
```

```bash run
snap install snapcraft --classic
```

> **Note:** The `--classic` flag is required for build tools that need unrestricted filesystem access to compile snaps.

## Verify the installation

```bash run
gcc --version
```

```bash run
snapcraft --version
```

Both commands should print version numbers. Once you see them, you are ready to write the application.

Click **Next →** to create your first C source file.
