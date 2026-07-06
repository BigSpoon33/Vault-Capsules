---
categories:
  - "Coursework"
type: "slides"
status: "todo"
due: null
grade: null
class: "[[Introduction to Linux]]"
capsule-id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
module-id: "slides-01-overview"
order: 5
prerequisites: []
source: "inkwell-export"
exported-at: "2026-07-06T03:43:31.732Z"
---

---
theme: black
---

# Introduction to Linux
## A Beginner's Guide

---

## What is Linux?
- Free and open-source operating system
- Created by Linus Torvalds in 1991
- Powers servers, phones (Android), IoT devices
- Many distributions: Ubuntu, Fedora, Arch, Debian

---

## The Terminal
- Text-based interface to your computer
- More powerful than graphical interfaces
- Essential for system administration
- Commands follow: `command [options] [arguments]`

---

## The File System
- Everything is a file (even devices!)
- Tree structure starting from `/` (root)
- Key directories: `/home`, `/etc`, `/var`, `/usr`
- No drive letters — mount points instead

---

## Essential Commands
- `pwd` — Where am I?
- `ls` — What's here?
- `cd` — Go somewhere
- `cat` — Show file contents
- `mkdir` — Create directory
- `rm` — Remove files

---

## File Permissions
- Three types: Read (r), Write (w), Execute (x)
- Three scopes: Owner, Group, Others
- Numeric notation: 7=rwx, 6=rw-, 5=r-x, 4=r--
- `chmod 755 file` — owner:rwx, group:r-x, others:r-x
