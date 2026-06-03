# Step 3: Strict Confinement

## Objectives

We will switch our application to [strict confinement](https://snapcraft.io/docs/snap-confinement). In strict mode, the app runs in complete isolation and cannot access the host filesystem or network unless explicitly granted permission via [interfaces](https://snapcraft.io/docs/supported-interfaces).

## Install Tools

No new tools are required. We will use `sed` to patch `snapcraft.yaml`.

## Switch to strict confinement

Modify the `confinement` and `grade` fields in `snapcraft.yaml` using `sed` so you can clearly see what changes:

```bash
sed -i 's/grade: devel/grade: stable/' snapcraft.yaml
sed -i 's/confinement: devmode/confinement: strict/' snapcraft.yaml
``` run

Verify the patch was applied:

```bash
grep -E 'grade:|confinement:' snapcraft.yaml
``` run

Clean the previous build and rebuild:

```bash
snapcraft clean
snapcraft pack --destructive-mode
``` run

> **Reminder:** `--destructive-mode` is used here for speed in this tutorial environment. In production always run `snapcraft` without this flag so the build happens inside an isolated LXD or Multipass container. See [Build options – Snapcraft](https://snapcraft.io/docs/build-options).

Install the updated, strictly confined snap (note we no longer use `--devmode`):

```bash
sudo snap install inspire-me_1.0_amd64.snap --dangerous
``` run

Run the snap and try to write to `strict.txt`:

```bash
inspire-me
``` run

You should see: **"Error: Could not open file strict.txt for writing."**

This is expected — the strictly confined snap has no permission to access your home directory by default.

## Connect the required interfaces

Add the `home` and `network` plugs to `snapcraft.yaml`:

```bash
sed -i '/command: inspire_me/a \    plugs:\n      - home\n      - network' snapcraft.yaml
``` run

*(We need `network` as well because strict snaps require explicit permission for outbound network access, which `curl` uses.)*

Rebuild and reinstall:

```bash
snapcraft pack --destructive-mode  # tutorial shortcut — use plain `snapcraft` in production
sudo snap install inspire-me_1.0_amd64.snap --dangerous
``` run

Connect the interfaces to grant permission:

```bash
sudo snap connect inspire-me:home :home
sudo snap connect inspire-me:network :network
``` run

Run the snap again:

```bash
inspire-me
``` run

Enter `strict-working.txt` when prompted — it should now write the file successfully.

> **Further reading:** [Supported interfaces – Snapcraft](https://snapcraft.io/docs/supported-interfaces)

## Conclusion

You learned how strict confinement isolates an application and how to selectively grant permissions using snap interfaces. Your snap is production-ready. In the next step you will find out how to take it further and deploy it to a real Ubuntu Core device or emulator on your own machine.
