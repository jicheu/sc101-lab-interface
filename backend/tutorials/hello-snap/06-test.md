# Install & test the snap

The snap file is built. Now install it and verify it runs correctly under strict confinement.

## Install the snap locally (sideloading)

Because this snap has not been published to the Snap Store, install it with the `--dangerous` flag to bypass store signature verification:

```bash run
snap install --dangerous ~/hello-snap/hello-snap_1.0_amd64.snap
```

## Run the snap

```bash run
hello-snap.hello
```

You should see:

```
Hello from a confined snap!
```

## Confirm confinement is active

```bash run
snap connections hello-snap
```

The output will list the snap's interfaces. Since `hello-snap` requests no special interfaces, it runs with the minimal sandbox — it cannot access your network, filesystem, or other resources.

## Check the snap info

```bash run
snap info hello-snap
```

## What's next — Ubuntu Core

In the next phase of this lab you will:

1. Launch an **Ubuntu Core 24** VM with LXD
2. Transfer the `.snap` file to the VM
3. Install and run it on Ubuntu Core — a fully immutable, snap-only OS

Ubuntu Core uses the same snap runtime, so a snap that works here will work there too.

---

🎉 **Congratulations!** You have successfully:

- Written a C application
- Defined a snap recipe with strict confinement
- Built the snap with Snapcraft
- Installed and ran it on Ubuntu 24.04

You are now ready to deploy to Ubuntu Core!
