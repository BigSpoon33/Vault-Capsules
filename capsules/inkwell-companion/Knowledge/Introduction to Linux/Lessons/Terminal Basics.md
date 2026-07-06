---
categories:
  - "Coursework"
type: "lesson"
status: "done"
due: null
grade: null
class: "[[Introduction to Linux]]"
capsule-id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
module-id: "lesson-01-terminal"
order: 0
prerequisites: []
source: "inkwell-export"
exported-at: "2026-07-06T03:43:31.732Z"
---

# Terminal Basics

## Learning Objectives

- Understand what a terminal emulator is
- Open a terminal on your system
- Execute your first commands
- Understand command structure: `command [options] [arguments]`

## What is the Terminal?

The terminal (also called the command line, shell, or console) is a text-based interface to your computer. Instead of clicking icons and menus, you type commands to tell the computer what to do.

Think of it like texting your computer — you send it a message (command), and it responds with the result.

## Opening a Terminal

- **Ubuntu/Debian**: Press `Ctrl+Alt+T`
- **Arch Linux**: Use your window manager's terminal keybind
- **macOS**: Spotlight → Terminal (but we're focusing on Linux here!)

## Your First Commands

### `pwd` — Print Working Directory

Shows where you currently are in the file system:

```bash
pwd
# Output: /home/yourusername
```

### `ls` — List Files

Shows the contents of the current directory:

```bash
ls
# Output: Desktop  Documents  Downloads  Music  Pictures
```

Add `-la` to see hidden files and details:

```bash
ls -la
```

### `echo` — Print Text

Displays text in the terminal:

```bash
echo "Hello, Linux!"
# Output: Hello, Linux!
```

### `clear` — Clear Screen

Clears the terminal screen. You can also use `Ctrl+L`.

## Command Structure

Every Linux command follows this pattern:

```
command [options] [arguments]
```

- **command**: The program to run (`ls`, `cd`, `pwd`)
- **options**: Modify behavior, usually start with `-` or `--` (`-l`, `--all`)
- **arguments**: What the command operates on (`/home`, `file.txt`)

## Summary

You now know how to open a terminal and run basic commands. In the next lesson, we'll explore the Linux file system.
