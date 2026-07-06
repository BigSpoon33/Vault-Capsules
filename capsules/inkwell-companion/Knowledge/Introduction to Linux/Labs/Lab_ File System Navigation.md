---
categories:
  - "Coursework"
type: "lab"
status: "in-progress"
due: null
grade: null
class: "[[Introduction to Linux]]"
capsule-id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
module-id: "lab-01-navigation"
order: 2
prerequisites:
  - "lesson-02-filesystem"
source: "inkwell-export"
exported-at: "2026-07-06T03:43:31.732Z"
---

# Lab: File System Navigation

## Objective

Practice navigating the Linux file system, creating directory structures, and managing files using the commands you learned.

## Setup

Open a terminal and navigate to your home directory:

```bash
cd ~
```

## Step 1: Create a Project Structure

Create the following directory tree:

```bash
mkdir -p linux-lab/src linux-lab/docs linux-lab/tests
```

Verify with `ls -R linux-lab`:

```
linux-lab/
├── docs/
├── src/
└── tests/
```

## Step 2: Create Files

```bash
touch linux-lab/src/main.sh
touch linux-lab/docs/README.md
touch linux-lab/tests/test-01.sh
```

## Step 3: Navigate and Verify

- [ ] `cd` into `linux-lab/src` and run `pwd` — confirm you're in the right place
- [ ] Use `cd ..` to go back to `linux-lab`
- [ ] Use `ls -la` to see all files including hidden ones
- [ ] Use `cd -` to toggle between two directories

## Step 4: Copy and Move

- [ ] Copy `src/main.sh` to `src/main-backup.sh`
- [ ] Move `docs/README.md` to `linux-lab/README.md` (one level up)
- [ ] Verify the move worked with `ls`

## Step 5: Clean Up

- [ ] Remove the `tests` directory: `rm -r linux-lab/tests`
- [ ] Verify it's gone with `ls linux-lab`

## Completion Criteria

You've completed this lab when you can:
- Navigate confidently with `cd`, `pwd`, and `ls`
- Create files and directories
- Copy, move, and delete items
