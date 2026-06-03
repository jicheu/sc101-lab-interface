# Step 3 – Inspect the assertions file

## Objectives

In this step you will:

- Examine the structure of a snap assertions bundle
- Identify the three assertion types present in a store-downloaded snap
- Understand the purpose of each assertion type

## Required tools

`less` and `grep` are standard utilities already available on Ubuntu. No installation is needed.

## View the full assertions file

The `.assert` file is a plain-text bundle of digitally signed documents. Each document has a set of key-value headers, optional body content, and a base64-encoded cryptographic signature at the bottom.

```bash
less hello-world_*.assert
```

> Press `q` to quit `less`.

Scroll through the file and notice that it contains several blocks separated by blank lines. Each block starts with a `type:` header, an `authority-id:` line, and ends with a signature.

## Identify the assertion types

```bash
grep "^type:" hello-world_*.assert
```

You will see exactly three assertion types:

```
type: account-key
type: snap-declaration
type: snap-revision
```

Here is what each type does:

| Assertion type | Purpose |
|---|---|
| `account-key` | Specifies and verifies the public key used to sign the other assertions in this bundle |
| `snap-declaration` | Contains key metadata about the snap: its name, publisher, and which interfaces (if any) are auto-connected on install |
| `snap-revision` | Acknowledges a specific revision of the snap as received and stored by the Snap Store |

> **Further reading:** [Snap assertions – Ubuntu Core documentation](https://documentation.ubuntu.com/core/reference/assertions/)

## Summary

The assertions bundle is a chain of trust: the `account-key` assertion establishes the signing key, `snap-declaration` describes the snap's identity and policies, and `snap-revision` ties a specific build to the store record. Together these allow snapd to verify that what you downloaded is exactly what the publisher uploaded. In the next step you will look at the snap file itself.
