---
title: "Write hello.c"
---

Time to create the application. It is intentionally simple — a classic "Hello, World!" program in C.

## Create the project directory

```bash run
mkdir -p ~/hello-snap/src
```

```bash run
cd ~/hello-snap
```

## Create the C source file

```bash run
cat > ~/hello-snap/src/hello.c << 'EOF'
#include <stdio.h>

int main(void) {
    printf("Hello from a confined snap!\n");
    return 0;
}
EOF
```

## Verify the file was created

```bash run
cat ~/hello-snap/src/hello.c
```

## Compile and test locally

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

The binary works. Next we will tell Snapcraft how to package it.
