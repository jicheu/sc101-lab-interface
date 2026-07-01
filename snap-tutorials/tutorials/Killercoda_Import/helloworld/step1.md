## Step 1: Install Snapcraft
First, we need to install the Snapcraft tool itself. We'll also install `LXD` because Snapcraft uses containers to ensure clean builds.

Click this command to install:
```bash run
snap install snapcraft --classic
```

As you can see, it fails because snap is not installed itself. Install it:
`apt install snapd`

Now, initialize LXD (just press Enter for all defaults):
```bash run
lxd init --auto
```
