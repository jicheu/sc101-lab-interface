---
title: "Build the inspire app"
---

## Objective

Install the required C build dependencies, write the `inspire` C source file and Makefile, then compile and test the application natively before packaging it as a snap.

## Install required tools

The app uses **libcurl** to make HTTPS requests to the ZenQuotes API.

```bash run
apt-get update -y && apt-get install -y build-essential libcurl4-openssl-dev
```

Verify the library is available:

```bash run
dpkg -l libcurl4-openssl-dev | grep '^ii'
```

## Instructions

### Create the project

```bash run
mkdir -p ~/inspire/src && cd ~/inspire
```

### Write the C source

The program fetches a quote, parses the JSON response, and writes the result to a file.

```bash run
cat > ~/inspire/src/inspire.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>

/* Growable buffer for curl response */
struct Buffer {
    char  *data;
    size_t size;
};

static size_t write_cb(void *ptr, size_t size, size_t nmemb, void *userp)
{
    size_t realsize = size * nmemb;
    struct Buffer *buf = (struct Buffer *)userp;
    char *tmp = realloc(buf->data, buf->size + realsize + 1);
    if (!tmp) return 0;
    buf->data = tmp;
    memcpy(buf->data + buf->size, ptr, realsize);
    buf->size += realsize;
    buf->data[buf->size] = '\0';
    return realsize;
}

/* Extract a string value from the simple JSON ZenQuotes returns:
   [{"q":"...","a":"...","h":"..."}]  */
static void extract(const char *json, const char *key, char *out, size_t outlen)
{
    char needle[64];
    snprintf(needle, sizeof(needle), "\"%s\":\"", key);
    const char *p = strstr(json, needle);
    if (!p) { strncpy(out, "(unknown)", outlen); return; }
    p += strlen(needle);
    size_t i = 0;
    while (*p && *p != '"' && i < outlen - 1) {
        if (*p == '\\' && *(p + 1)) p++;   /* skip escape char */
        out[i++] = *p++;
    }
    out[i] = '\0';
}

int main(void)
{
    char filename[512];
    printf("Enter the filename to save the message to: ");
    fflush(stdout);
    if (!fgets(filename, sizeof(filename), stdin)) return 1;
    filename[strcspn(filename, "\n")] = '\0';
    if (filename[0] == '\0') { fprintf(stderr, "No filename given.\n"); return 1; }

    /* Fetch quote */
    CURL *curl = curl_easy_init();
    if (!curl) { fprintf(stderr, "curl_easy_init failed\n"); return 1; }

    struct Buffer buf = {0};
    curl_easy_setopt(curl, CURLOPT_URL, "https://api.quotable.io/random");
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &buf);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "inspire-snap/1.0");
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

    CURLcode rc = curl_easy_perform(curl);
    curl_easy_cleanup(curl);

    if (rc != CURLE_OK) {
        fprintf(stderr, "Network error: %s\n", curl_easy_strerror(rc));
        free(buf.data);
        return 1;
    }

    char quote[1024] = {0}, author[256] = {0};
    extract(buf.data, "content", quote, sizeof(quote));
    extract(buf.data, "author", author, sizeof(author));
    free(buf.data);

    /* Write to file */
    FILE *f = fopen(filename, "w");
    if (!f) { perror("Cannot open file"); return 1; }
    fprintf(f, "\"%s\"\n    — %s\n", quote, author);
    fclose(f);

    printf("\nSaved to %s:\n\n\"%s\"\n    — %s\n\n", filename, quote, author);
    return 0;
}
EOF
```

### Write the Makefile

```bash run
printf 'CC      = gcc\nCFLAGS  = -Wall -O2\nLDFLAGS = -lcurl\n\ninspire: inspire.c\n\t$(CC) $(CFLAGS) -o inspire inspire.c $(LDFLAGS)\n\nclean:\n\trm -f inspire\n' > ~/inspire/src/Makefile
```

### Compile and test

```bash run
cd ~/inspire/src && make
```

```bash run
~/inspire/src/inspire
```

When prompted, enter a filename such as `~/quote-native.txt`.  
The app will fetch a live quote and write it to the file.

```bash run
cat ~/quote-native.txt
```

> If you see a quote and an author name, the app is working correctly.

## What we learned

- `libcurl4-openssl-dev` provides both the headers (for compilation) and the shared library (for linking) needed to make HTTPS requests in C.
- The `inspire` binary works natively: it can reach the network and write to the home directory without any restrictions.
- This native baseline confirms the application logic is correct before we add snap packaging.

## What's next

In the next step you will package `inspire` as a snap using `devmode` confinement to verify the snap works before adding any restrictions.
