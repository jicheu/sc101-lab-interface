---
title: "Modifying, Repacking, & Reinstalling a Snap"
---

## Objective

In this step, you will modify the extracted application script, compile the modified directory tree back into a functional snap filesystem package, and test your custom build live.

## Prerequisites

- Step 3 complete (extracted `squashfs-root/` structure present).

## Install required tools

Testing the server response requires the network utility tool `nc` (netcat). Install the OpenBSD variant before proceeding:

```bash run
sudo apt install -y netcat-openbsd
```

## Instructions

Because a snap is simply a directory layout packed into a Squashfs container, you can perform direct debugging by altering file components on disk and re-compressing them.

1. Modify the internal server response script. Apply the following patch to insert a custom string marker prefix inside the fallback server routine:

```diff
--- squashfs-root/bin/simple-server.sh
+++ squashfs-root/bin/simple-server.sh
@@ -10,3 +10,3 @@
 get_content() {
-    echo "Hello, world!"
+    echo "[CUSTOM LAB REPACK] Hello, world!"
 }
```

Execute this automated stream modification on the file directly:
```bash run
sed -i 's/echo "Hello, world!"/echo "[CUSTOM LAB REPACK] Hello, world!"/g' squashfs-root/bin/simple-server.sh
```

2. Compress the mutable workspace directory back into a deployable, standalone `.snap` format file:
```bash run
snap pack squashfs-root/
```

3. Test how `snapd` enforces signature validation. Attempt to install your modified package without safe validation bypass flags:
```bash run
sudo snap install simple-server_*.snap
```

Observe the signature metadata missing verification error. Because you have modified the archive, any original store hash checks are now broken and invalidated.

4. Install your customized local build securely using dangerous mode to override signature checking:
```bash run
sudo snap install simple-server_*.snap --dangerous
```

5. Confirm that the background socket daemon configuration defined by the snap is running successfully:
```bash run
snap services simple-server
```

6. Stream the active execution system log loops from the daemon to ensure smooth startup behavior:
```bash run
snap logs simple-server.simple-server
```

7. Use netcat to request a response directly from the exposed local port asset to confirm that your tracking string edit is live:
```bash run
nc 127.0.0.1 4321
```

You should see your modified string `[CUSTOM LAB REPACK] Hello, world!` printed out in the terminal response.

## What we learned

* Snaps are regular files and folder structures compressed using low-level container methods.
* How to use `snap pack` to bundle a directory back into a ready-to-run Squashfs package.
* Testing local modifications requires bypassing validation using the `--dangerous` runtime flag.
* Validating running snap services via `snap services`, `snap logs`, and host networking commands.

## What's next

You have successfully dissected, inspected, and modified an operational snap package. In the next tutorial bundle, you will shift from manual manipulation to automated generation by drafting your own declarative project structure from scratch using `snapcraft`.
