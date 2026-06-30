## Step 2: Create a Hello World App
Let's create a directory for our project:
```bash run
mkdir my-snap && cd my-snap
```

Create a simple Bash script that will be our "app":
```bash run
cat <<EOF > hello.sh
#!/bin/bash
echo "Hello from a confined Snap!"
EOF
chmod +x hello.sh
``` 

Now, initialize the Snapcraft config:
```bash run
snapcraft init
```
