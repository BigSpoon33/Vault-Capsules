---
categories:
  - "Coursework"
type: "lesson"
status: "done"
due: null
grade: null
class: "[[Introduction to Linux]]"
capsule-id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
module-id: "lesson-02-filesystem"
order: 1
prerequisites:
  - "lesson-01-terminal"
source: "inkwell-export"
exported-at: "2026-07-06T03:43:31.732Z"
---

# The Linux File System

## Learning Objectives

- Understand the Linux directory hierarchy
- Navigate between directories using `cd`
- Create, copy, move, and delete files and directories
- Understand absolute vs relative paths

## The Directory Tree

Linux organizes everything as a tree starting from `/` (root):

```
/
├── home/        ← Your personal files
│   └── user/
├── etc/         ← System configuration
├── var/         ← Variable data (logs, databases)
├── usr/         ← User programs and utilities
├── tmp/         ← Temporary files
└── bin/         ← Essential command binaries
```

## Navigating with `cd`

### Change Directory

```bash
cd /home           # Go to /home (absolute path)
cd Documents       # Go into Documents (relative path)
cd ..              # Go up one level
cd ~               # Go to your home directory
cd -               # Go back to previous directory
```

### Absolute vs Relative Paths

- **Absolute**: Starts from root `/` — e.g., `/home/user/Documents`
- **Relative**: Starts from current directory — e.g., `Documents/projects`

## File Operations

### Creating

```bash
mkdir my-folder           # Create a directory
mkdir -p a/b/c            # Create nested directories
touch myfile.txt          # Create an empty file
```

### Copying

```bash
cp file.txt backup.txt           # Copy a file
cp -r folder/ backup-folder/     # Copy a directory (recursive)
```

### Moving / Renaming

```bash
mv file.txt new-name.txt         # Rename
mv file.txt ~/Documents/         # Move to Documents
```

### Deleting

```bash
rm file.txt                      # Delete a file
rm -r folder/                    # Delete a directory
```

**Warning**: Linux doesn't have a trash can by default. `rm` is permanent!

## Summary

You now understand the Linux file system structure and can navigate, create, copy, move, and delete files. Time to practice in the lab!
