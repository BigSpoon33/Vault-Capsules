---
categories:
  - "Coursework"
type: "guided-conversation"
status: "todo"
due: null
grade: null
class: "[[Introduction to Linux]]"
capsule-id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
module-id: "conversation-01-permissions"
order: 6
prerequisites:
  - "lesson-02-filesystem"
source: "inkwell-export"
exported-at: "2026-07-06T03:43:31.732Z"
---

# File Permissions — Guided Conversation

---

## 1. Permission Basics

**Question:**
What are the three types of file permissions in Linux?

**Key Concepts to Cover:**
- Read, Write, Execute
- Owner, Group, Others

**Assessment Criteria:**
- Can name all three permission types?
- Can explain the three scopes?

**Reference Content:**
Linux uses read (r/4), write (w/2), and execute (x/1) permissions. These are applied at three levels: the file owner (user), the group, and others (everyone else). You can view permissions with `ls -l`, which shows them as a string like `rwxr-xr--`.

---

## 2. Numeric Notation

**Question:**
How does the numeric (octal) permission system work? What does `chmod 755` mean?

**Key Concepts to Cover:**
- r=4, w=2, x=1
- Three digits: owner, group, others
- Common patterns: 755, 644, 700

**Assessment Criteria:**
- Can explain the numeric values for r, w, x?
- Can decode a three-digit permission like 755?

**Reference Content:**
Each permission has a numeric value: read=4, write=2, execute=1. You sum them for each scope. So 7 (4+2+1) = rwx, 5 (4+1) = r-x, 4 = r--. `chmod 755` means the owner gets full access (rwx), while group and others get read and execute (r-x). Common patterns: 644 for regular files, 755 for executables, 700 for private files.

---

## 3. Changing Permissions

**Question:**
How do you use the `chmod` command with symbolic notation to add execute permission for the file owner?

**Key Concepts to Cover:**
- Symbolic notation: u/g/o and +/-/=
- chmod u+x adds execute for owner
- chmod go-w removes write for group and others

**Assessment Criteria:**
- Can construct a symbolic chmod command?
- Understands the difference between +, -, and =?

**Reference Content:**
Symbolic notation uses letters for scope (u=user/owner, g=group, o=others, a=all) and operators (+, -, =) with permission letters (r, w, x). `chmod u+x file` adds execute permission for the owner. `chmod go-w file` removes write permission for group and others. `chmod a=r file` sets read-only for everyone, removing all other permissions.
