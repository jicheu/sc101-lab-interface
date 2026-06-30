## Step 3: Configure and Build
By default, snaps might use `devmode`. To make it production-ready, we use **strict** confinement. 

Run this to update your `snapcraft.yaml`:
```yaml run
cat <<EOF > snap/snapcraft.yaml
name: my-hello-snap
base: core22
version: '0.1'
summary: A simple hello world snap
description: |
  This is a tutorial snap building exercise.

confinement: strict
grade: devel

parts:
  hello-part:
    plugin: dump
    source: .

apps:
  hello:
    command: hello.sh
EOF
``` 

### Build the Snap
Now, let's build it. This will take a minute as it sets up the build environment:
```bash run
snapcraft pack
``` 

### Install and Test
Once finished, install your local snap file:
```bash run 
sudo snap install \
  my-hello-snap_0.1_amd64.snap \
  --dangerous
``` 

Run it:
```bash run
my-hello-snap.hello
``` 
