---
title: Create your Ubuntu SSO account
---

## Objective

Create a Ubuntu Single Sign-On (SSO) account, upload an SSH public key, and accept the Snapcraft developer agreement. This account is required to publish snaps to the Snap Store and to log in with the `snap` and `snapcraft` CLI tools.

## Instructions

1. Open [https://login.ubuntu.com](https://login.ubuntu.com) in a browser and complete the registration form.

2. Reply to the confirmation email to verify your address.

3. Visit [https://dashboard.snapcraft.io](https://dashboard.snapcraft.io) and accept the developer terms and conditions when prompted.

4. Generate an SSH key pair if you do not already have one:

```bash run
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Accept the default file location (`~/.ssh/id_ed25519`) and set a passphrase when prompted.

5. Display your public key so you can copy it:

```bash run
cat ~/.ssh/id_ed25519.pub
```

6. Return to [https://login.ubuntu.com](https://login.ubuntu.com), navigate to **SSH keys**, and paste the output of the previous command.

> 📖 **Concept — Ubuntu SSO**  
> Ubuntu Single Sign-On is the identity provider used across Canonical services including the Snap Store, Launchpad, and Ubuntu One.  
> Official reference: https://ubuntu.com/tutorials

## What we learned

- Ubuntu SSO is the single identity used across all Canonical developer services.
- An SSH key is required to authenticate with login.ubuntu.com and is used by `snap login` and `snapcraft login`.
- The Snapcraft developer agreement must be accepted before you can publish snaps.

## What's next

With your account ready, the next step verifies that `snapd` — the snap runtime — is installed and working in the lab environment.
