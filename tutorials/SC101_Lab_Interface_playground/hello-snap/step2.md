---
title: "Set up build tools"
---

## Objective

Install GCC and Snapcraft so you can compile C code and build snap packages in subsequent steps.

## Install required tools

Before writing any code, install a C compiler and Snapcraft.

### Update the package list

```bash run
apt-get update -y
```

### Install GCC and essential build tools

```bash run
apt-get install -y build-essential
```

### Install snapd

```bash run
apt-get install -y snapd
```

### Install Snapcraft

> 📖 **Concept — Snapcraft**  
> Snapcraft is the official build tool for creating snap packages. It reads a `snapcraft.yaml` recipe and produces a `.snap` file.  
> Official reference: https://snapcraft.io/docs/snapcraft-overview

```bash run
snap install snapcraft --classic
```

> 📖 **Concept — Classic Confinement**  
> The `--classic` flag installs a snap with classic confinement, meaning it has unrestricted access to the host filesystem — just like a traditionally installed package. Build tools such as Snapcraft require this because they must read and write arbitrary paths when compiling snaps.  
> Official reference: https://snapcraft.io/docs/snap-confinement#heading--classic

## Instructions

Verify both tools are installed and print their versions:

```bash run
gcc --version
```

```bash run
snapcraft --version
```

Both commands should print version numbers.

## What we learned

- `build-essential` provides GCC and standard compilation tools on Ubuntu.
- `snapd` is the daemon that manages snap packages on the host.
- Snapcraft is installed as a snap itself, using `--classic` confinement because it needs unrestricted filesystem access during builds.

## What's next

In the next step you will write the C source file that this tutorial packages as a snap.
