---
title: "Managing Store Snaps with Core Commands"
---

## Objective

In this step, you will exercise standard management paradigms using an explicit store application package to explore system listings, detached assertions, explicit configuration channels, and removal loops.

## Instructions

1. Interrogate the local platform state to see all active packages deployed to the container:
```bash run
snap list
```

2. Fetch a target verification package file along with its detached validation statements into your current folder directory path without introducing it to your live system runtime:
```bash run
snap download hello-world
```

3. Scan the directory to see the resulting detached architecture files:
```bash run
ls -lh hello-world*
```

Notice the presence of both the `.snap` filesystem container payload and the companion `.assert` metadata verification file.

4. Print out the structure of the assertion wrapper blocks to observe the cryptographic signature metadata lines:
```bash run
cat hello-world_*.assert
```

5. Install the application package cleanly directly from the online store mirrors:
```bash run
sudo snap install hello-world
```

6. Query comprehensive upstream catalog configuration mappings, channel paths, and metadata definitions tied to the active deployment name:
```bash run
snap info hello-world
```

7. Alter the release channel track settings for this application to monitor alternative testing or pre-release streams:
```bash run
snap switch hello-world --channel=candidate
```

8. Force a synchronization verification pass to evaluate whether the local installation package needs updates relative to the newly targeted stream:
```bash run
snap refresh hello-world
```

9. Perform a clean removal operation to purge the validation snap package completely from the machine environment:
```bash run
snap remove hello-world
```

## What we learned

* How to interactively list, download, and trace metadata layouts of remote snaps.
* How to use tracking channels to separate production code lines from test candidate tracks.
* Deleting runtime spaces safely using native removal routines.

## What's next

In the next step, you will learn how to handle risks when deploying unasserted local package builds and audit secure communication sandboxes.
