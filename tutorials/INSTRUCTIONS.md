# Tutorial Authoring Instructions

> **This file is authoritative guidance for anyone — human or AI — creating a new tutorial for this platform.**
> When asked to create a tutorial, follow every rule in this document without exception.

---

## Audience

The student is an **experienced Ubuntu developer**.  
**Do not** assume any prior knowledge of snaps, snap confinement, snapcraft, or Ubuntu Core.  
Introduce these concepts from first principles, with official references, each time they appear.

---

## Target Environment

- **OS**: Ubuntu 24.04 LTS
- **Platform**: This lab interface (LXD container), modelled after the KillerCoda Ubuntu 24.04 environment
- **Important**: The base image does **not** come with `snapd`, `snapcraft`, or other snap tooling pre-installed. Always explicitly install every tool a step requires before using it.

---

## General Rules

### 1 — Official references only

Every concept, command, and configuration option you introduce **must** link to an official source.  
Acceptable domains:

- `https://canonical.com`
- `https://snapcraft.io/docs`
- `https://ubuntu.com/tutorials` / `https://ubuntu.com/core/docs`

**No other external sources are permitted** (no Stack Overflow, Medium, blog posts, third-party wikis, etc.).

### 2 — Verify tool availability before use

Before writing any command into a step, confirm the tool exists on a stock Ubuntu 24.04 image.  
If it does not, add an explicit installation sub-step **within the same step** before the tool is first used.

Examples of tools that require explicit installation:

| Tool | Install command |
|------|-----------------|
| `snapd` | `sudo apt install -y snapd` |
| `snapcraft` | `sudo snap install snapcraft --classic` |
| `lxd` | `sudo snap install lxd` |
| `build-essential` | `sudo apt install -y build-essential` |

### 3 — File modifications use patches, not overwrites

When a step requires changing a file that was created in a **previous** step:

- **Do not** offer to replace the whole file.
- Show the change as a **diff/patch** so the student can see exactly what changed and why.
- Use the following format in your Markdown code block:

  ````markdown
  ```diff
  --- snapcraft.yaml
  +++ snapcraft.yaml
  @@ -10,3 +10,5 @@
     confinement: devmode
  +  plugs:
  +    - network
  +    - home
  ```
  ````

- Then provide the `patch` command or a `sed` one-liner so the trainee can apply it without manual editing.

### 4 — Concept introductions require documentation links

The first time any of the following concepts appears in a tutorial, add a callout block with a link to its official documentation:

| Concept | Reference URL |
|---------|---------------|
| Snap confinement | https://snapcraft.io/docs/snap-confinement |
| Snap interfaces | https://snapcraft.io/docs/interfaces |
| Plugs and slots | https://snapcraft.io/docs/interface-management |
| snapcraft.yaml format | https://snapcraft.io/docs/snapcraft-yaml-reference |
| Ubuntu Core | https://ubuntu.com/core/docs |
| Classic confinement | https://snapcraft.io/docs/snap-confinement#heading--classic |
| Strict confinement | https://snapcraft.io/docs/snap-confinement#heading--strict |
| devmode | https://snapcraft.io/docs/snap-confinement#heading--devmode |

Format the callout as:

```markdown
> 📖 **Concept — Snap Confinement**  
> Confinement defines what system resources a snap can access.  
> Official reference: https://snapcraft.io/docs/snap-confinement
```

---

## Step Structure

Every step **must** be atomic — it achieves one clearly stated learning objective.

### Atomicity test

Ask yourself: *"Can a student fail halfway through this step and not know what state they are in?"*  
If yes, split the step into smaller steps.

### Required structure for every step

Each step file (`stepN.md`) must follow this layout:

```markdown
---
title: <short title shown in the UI>
---

## Objective

One or two sentences describing **what the student will do** and **what they will learn**.

## Prerequisites

*(Omit this section if the step has no additional prerequisites beyond the tutorial itself.)*

- List any tools or files that must exist from a previous step.

## Install required tools

*(Omit this section if no new tools are needed.)*

Install each tool needed for this step and verify it is working:

\```bash run
sudo apt install -y <package>
\```

## Instructions

Numbered, ordered commands to achieve the objective. Each command block that should
be executable in the terminal must use the `run` annotation:

\```bash run
<command>
\```

When introducing a concept for the first time, include the concept callout (see Rule 4).

## What we learned

Bullet-point summary of what the student achieved and understood in this step.

## What's next

One sentence previewing the next step.
```

---

## Tutorial `index.md` Frontmatter Requirements

Every tutorial folder must contain an `index.md` with this frontmatter:

```yaml
---
id: <kebab-case-unique-id>
title: <Human-readable title>
description: <One sentence summary>
difficulty: beginner | intermediate | advanced
time: <estimated minutes as integer>
tags:
  - snap
  - <other relevant tags>
environment:
  image: ubuntu:24.04
  prestart:
    - sudo apt update -y
requires:           # omit if no prerequisites
  - <prerequisite-tutorial-id>
steps:
  - title: <Step 1 title>
    file: step1.md
  - title: <Step 2 title>
    file: step2.md
---
```

---

## Splitting a Non-Atomic Step

If a prompt describes a step that covers more than one objective (e.g., "install snapcraft and build the snap and test it"):

1. **Identify** each distinct objective.
2. **Propose** the split to the author before writing content:

   > The requested step covers three distinct objectives (install, build, test).  
   > I will split it into three atomic steps: Step N, Step N+1, Step N+2.  
   > Proceeding with this structure.

3. Write each sub-step following the required structure above.

---

## Checklist Before Submitting a Tutorial

- [ ] All commands tested against a stock Ubuntu 24.04 environment
- [ ] Every tool explicitly installed before first use
- [ ] Every concept linked to an official Canonical/Ubuntu/Snapcraft reference
- [ ] All file modifications shown as diffs (no silent overwrites)
- [ ] Each step passes the atomicity test
- [ ] `index.md` frontmatter is complete and valid
- [ ] Tutorial added to the `tutorials/` folder with a unique kebab-case ID
