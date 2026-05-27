# Step 1: Create a C++ Application

## Objectives

In this step you will:

- Write a C++ program that fetches a random inspirational message from a web API and writes it to a file
- Compile and run it natively to confirm it works before packaging it as a snap

## Install Tools

`g++` and `curl` have been installed for you by the background script. In the real world you would run:

```bash
sudo apt update && sudo apt install -y g++ curl
```

## Create the application

Create a file named `main.cpp`:

```bash
cat << 'EOF' > main.cpp
#include <iostream>
#include <fstream>
#include <string>
#include <cstdio>
#include <memory>
#include <array>

std::string exec(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        return "Could not fetch quote.";
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    if (!result.empty() && result.back() == '\n') {
        result.pop_back();
    }
    return result;
}

int main() {
    std::string command = "curl -s https://zenquotes.io/api/random | sed -n 's/.*\"q\":\"\\([^\"]*\\)\".*/\\1/p'";
    std::string message = exec(command.c_str());

    if (message.empty()) {
        message = "Keep calm and snap on.";
    }

    std::cout << "Enter the filename to write the message to: ";
    std::string filename;
    std::cin >> filename;

    std::ofstream outfile(filename);
    if (outfile.is_open()) {
        outfile << message << std::endl;
        outfile.close();
        std::cout << "Message written successfully to " << filename << std::endl;
    } else {
        std::cerr << "Error: Could not open file " << filename << " for writing." << std::endl;
        return 1;
    }

    return 0;
}
EOF
``` run

## Compile and test

```bash
g++ main.cpp -o inspire_me
./inspire_me
``` run

When prompted, enter a filename such as `test.txt`. Verify the output:

```bash
cat test.txt
``` run

## Conclusion

The application fetches an external resource with `curl` and writes to the filesystem — two operations that will require explicit snap interface permissions once we enforce strict confinement. Next, you will package it as a snap in `devmode` to test it without restrictions first.
