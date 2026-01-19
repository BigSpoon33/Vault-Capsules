<%*
// 1. EXTRACT COURSE CODE
// Filename format expected: "ACU-101 Assignment 10-24"
const fileName = tp.file.title;
const codeMatch = fileName.match(/^([A-Z]+-\d+)/);
let courseCode = codeMatch ? codeMatch[1] : "";
let classLink = "";

// 2. FIND LINKED CLASS FILE
if (courseCode) {
    const classFile = app.vault.getMarkdownFiles().find(f => {
        const c = app.metadataCache.getFileCache(f);
        return c?.frontmatter?.["course-code"] === courseCode;
    });
    if (classFile) classLink = `[[${classFile.basename}]]`;
}

// 3. SET DEFAULTS
const createdDate = tp.date.now("YYYY-MM-DD");
const dueDate = tp.date.now("YYYY-MM-DD", 7);
let type = "assignment";
if (fileName.toLowerCase().includes("exam")) type = "exam";
if (fileName.toLowerCase().includes("project")) type = "project";

// 4. CLEAN TITLE
let title = fileName;
if (courseCode) title = fileName.replace(courseCode, "").trim();
_%>
---
tags: 
  - task 
  - <% type %>
categories:
  - "[[Coursework]]"
class: "<% classLink %>"
type: <% type %>
status: none
priority: normal
due: <% dueDate %>
created: <% createdDate %>
grade: 
---

# 📝 <% title %>

```datacorejsx
const { CourseworkView } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-courseworkView.jsx"));
return <CourseworkView />;
```
## 📋 Requirements

- [ ]
    

## ✍️ Work


