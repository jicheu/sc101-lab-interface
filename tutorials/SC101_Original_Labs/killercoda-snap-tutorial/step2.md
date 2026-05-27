# Step 2: Create an Unconfined Snap

## Objectives

We will package our application as a snap. For initial testing, we will build it in `devmode` ([developer mode](https://snapcraft.io/docs/devmode)). A devmode snap runs without the security restrictions of strict confinement, which is useful for debugging.

## Install Tools

Ensure `snapd` is up to date, and install `snapcraft` to build our snap:

```bash
sudo apt update && sudo apt install -y snapd
sudo snap install snapcraft --classic
``` run

## Create the snap

Create a `snapcraft.yaml` file. Note that `curl` is added to `stage-packages` because our application relies on it to fetch quotes:

```bash
cat << 'EOF' > snapcraft.yaml
name: inspire-me
base: core24
version: '1.0'
summary: A C++ app that writes inspirational quotes
description: |
  This application asks for a filename and writes a random 
  inspirational quote to it.

grade: devel
confinement: devmode

parts:
  inspire:
    plugin: dump
    source: .
    override-build: |
      g++ main.cpp -o $SNAPCRAFT_PART_INSTALL/inspire_me
    build-packages:
      - g++
    stage-packages:
      - curl
      - sed

apps:
  inspire-me:
    command: inspire_me
EOF
``` run

Build the snap:

```bash
snapcraft pack --destructive-mode
``` run

> **Why `--destructive-mode`?**
> In this tutorial we pass `--destructive-mode` so that Snapcraft builds directly on the host, which is much faster inside a Killercoda VM.
> In real-world usage you would simply run:
> ```
> snapcraft
> ```
> Without this flag, Snapcraft automatically spins up an isolated build container (using **LXD** or **Multipass**) that exactly matches the snap's `base`. This guarantees a clean, reproducible build environment and prevents host-system libraries from leaking into the snap — which is what you always want in production.
>
> **Further reading:** [Build options – Snapcraft](https://snapcraft.io/docs/build-options)

Install the snap. Since we built it with `devmode`, we must use `--devmode` and `--dangerous`:

```bash
sudo snap install inspire-me_1.0_amd64.snap --devmode --dangerous
``` run

Run the snap:

```bash
inspire-me
``` run

Enter `output.txt` when prompted. Because the snap is in `devmode`, it has full access to your filesystem and will successfully write the file. Verify it:

```bash
cat output.txt
``` run

## Conclusion

The application is now packaged as a snap and running in `devmode`. In the next step, you will enforce strict confinement and observe what happens when the snap tries to access the filesystem without explicit permission.
