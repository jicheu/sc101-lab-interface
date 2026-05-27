---
title: "Write hello.c"
---

## Objective

Create and compile a minimal C program that will later be packaged as a snap.

## Prerequisites

- GCC installed (completed in the previous step).

## Instructions

### Create the project directory

```bash run
mkdir -p ~/hello-snap/src
```

```bash run
cd ~/hello-snap
```

### Create the C source file

```bash run
cat > ~/hello-snap/src/hello.c << 'EOF'
#include <stdio.h>

int main(void) {
    printf("Hello from a confined snap!\n");
    return 0;
}
EOF
```

### Verify the file was created

```bash run
cat ~/hello-snap/src/hello.c
```

### Compile and test locally

Before snapping anything, make sure the code compiles and runs:

```bash run
gcc -o ~/hello-snap/src/hello ~/hello-snap/src/hello.c
```

```bash run
~/hello-snap/src/hello
```

You should see:

```
Hello from a confined snap!
```

## What we learned

- The project lives under `~/hello-snap/src/`.
- The C program compiles and runs correctly as a native binary.
- Testing locally before packaging saves time — if it does not work natively, it will not work as a snap either.

## What's next

In the next step you will write the `snapcraft.yaml` recipe that tells Snapcraft how to package this binary as a snap.
