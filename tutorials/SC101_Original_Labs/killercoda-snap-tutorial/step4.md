# Step 4: Going further — deploying to Ubuntu Core

## Objectives

In this step you will:

- Understand what [Ubuntu Core](https://ubuntu.com/core) is and why it is the natural deployment target for strictly confined snaps
- Know the prerequisites needed before deploying to Ubuntu Core
- Have ready-to-use instructions for two deployment paths: QEMU on your own machine, and Raspberry Pi

## Required tools

This step is a reference guide — no commands run in this terminal. All instructions below apply to **your own machine** outside this lab environment.

> **Why not here?**
> Ubuntu Core runs as a full OS image. Emulating it with QEMU requires hardware-assisted virtualisation (KVM on Linux, HVF on macOS). This shared lab environment does not expose KVM, so Ubuntu Core cannot be emulated here. The snap you built in the previous steps is fully ready — you just need a KVM-capable host to deploy it.

## What is Ubuntu Core?

[Ubuntu Core](https://ubuntu.com/core) is a minimal, fully snap-based version of Ubuntu designed for IoT and embedded devices. There is no `apt`, no traditional package manager — every piece of software, including the kernel and base OS components, is delivered and updated as a snap. Strict confinement is enforced by default.

The snap you built in Step 3 is already compatible with Ubuntu Core. The confinement model is identical to what you tested here.

> **Further reading:** [Ubuntu Core documentation – ubuntu.com/core/docs](https://ubuntu.com/core/docs)

## Prerequisite: Ubuntu SSO account and SSH key

Ubuntu Core uses [`console-conf`](https://ubuntu.com/core/docs/use-console-conf) for first-boot device provisioning. It fetches your SSH public key from your Launchpad profile and injects it into the device, making your Ubuntu SSO **username** the login name.

Before booting any Ubuntu Core image you must:

1. Create a free account at [login.ubuntu.com](https://login.ubuntu.com) and note your username.
2. Generate an SSH key pair if you don't have one:
   ```bash
   ssh-keygen -t ed25519 -C "ubuntu-core" -N "" -f ~/.ssh/id_ed25519
   ```
3. Upload your public key to Launchpad: go to `https://launchpad.net/~YOUR_USERNAME/+editsshkeys`, paste the contents of `~/.ssh/id_ed25519.pub`, and click **Import**.

> **Further reading:** [Testing Ubuntu Core with QEMU – ubuntu.com/core/docs](https://documentation.ubuntu.com/core/how-to-guides/manage-ubuntu-core/test-on-qemu/)

---

## Option 1: QEMU on your own machine (Linux with KVM)

### Install dependencies

```bash
sudo apt install -y qemu-system-x86 ovmf
```

### Download the Ubuntu Core 24 image

```bash
wget https://cdimage.ubuntu.com/ubuntu-core/24/stable/current/ubuntu-core-24-amd64.img.xz
unxz ubuntu-core-24-amd64.img.xz
cp /usr/share/OVMF/OVMF_VARS_4M.ms.fd ~/OVMF_VARS_4M.ms.fd
```

### Launch the VM

```bash
qemu-system-x86_64 \
  -enable-kvm \
  -smp 1 \
  -m 2048 \
  -machine q35 \
  -cpu host \
  -global ICH9-LPC.disable_s3=1 \
  -net nic,model=virtio \
  -net user,hostfwd=tcp::8022-:22 \
  -drive file=/usr/share/OVMF/OVMF_CODE_4M.secboot.fd,if=pflash,format=raw,unit=0,readonly=on \
  -drive file=~/OVMF_VARS_4M.ms.fd,if=pflash,format=raw,unit=1 \
  -drive file=ubuntu-core-24-amd64.img,if=none,format=raw,id=disk1 \
  -device virtio-blk-pci,drive=disk1,bootindex=1 \
  -serial mon:stdio
```

### Complete console-conf and deploy

When `console-conf` appears, enter your Ubuntu SSO email address. Once the device is configured, copy your snap and install it:

```bash
scp -P 8022 inspire-me_1.0_amd64.snap YOUR_SSO_USERNAME@localhost:
ssh -p 8022 YOUR_SSO_USERNAME@localhost \
  "sudo snap install inspire-me_1.0_amd64.snap --dangerous && \
   sudo snap connect inspire-me:home :home && \
   sudo snap connect inspire-me:network :network && \
   inspire-me"
```

> **Further reading:** [Testing Ubuntu Core with QEMU – ubuntu.com/core/docs](https://documentation.ubuntu.com/core/how-to-guides/manage-ubuntu-core/test-on-qemu/)

---

## Option 2: Raspberry Pi

Ubuntu Core 24 runs on Raspberry Pi 2, 3, 4, and 5.

1. Download the appropriate image from [ubuntu.com/download/raspberry-pi-core](https://ubuntu.com/download/raspberry-pi-core).
2. Flash it to a microSD card:
   ```bash
   xzcat ubuntu-core-24-arm64+raspi.img.xz | sudo dd of=/dev/sdX bs=32M status=progress
   ```
   *(Replace `/dev/sdX` with your card device — check with `lsblk`.)*
3. Insert the card, boot the Pi, and complete `console-conf` over a monitor and keyboard or serial console.
4. Once configured, copy and install your snap via SSH:
   ```bash
   scp inspire-me_1.0_amd64.snap YOUR_SSO_USERNAME@<pi-ip>:
   ssh YOUR_SSO_USERNAME@<pi-ip> \
     "sudo snap install inspire-me_1.0_amd64.snap --dangerous && \
      sudo snap connect inspire-me:home :home && \
      sudo snap connect inspire-me:network :network && \
      inspire-me"
   ```

> **Note:** The Raspberry Pi image is `arm64`. The snap built in this tutorial targets `amd64`. To deploy on a Pi, rebuild the snap on an arm64 machine or cross-compile using `snapcraft remote-build`. See [Remote build – Snapcraft](https://snapcraft.io/docs/remote-build).

> **Further reading:** [Ubuntu Core on Raspberry Pi – ubuntu.com/core/docs](https://ubuntu.com/core/docs/install-raspberry-pi)

---

## Option 3: Other certified hardware

Ubuntu Core is certified on a range of boards and devices beyond Raspberry Pi.

> **Further reading:** [Supported platforms – ubuntu.com/core/docs](https://ubuntu.com/core/docs/supported-platforms)

## Conclusion

You have all the tools to deploy your strictly confined snap to a real Ubuntu Core environment. The snap behaves identically on Ubuntu Core as it did on this host — strict confinement, interface connections, and all. The only difference is that on Ubuntu Core there is nothing else: every piece of software runs as a snap.
