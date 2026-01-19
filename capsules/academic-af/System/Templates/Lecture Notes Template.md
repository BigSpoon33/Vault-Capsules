<%*
// 1. EXTRACT COURSE CODE
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

// 3. CLEAN TITLE
let title = fileName;
if (courseCode) title = fileName.replace(courseCode, "").trim();
_%>
---
tags: 
  - note
  - lecture
categories:
  - "[[Coursework]]"
class: "<% classLink %>"
type: note
status: done
date: <% tp.date.now("YYYY-MM-DD") %>
topics: []
---

# 🎙️ <% title %>

```datacorejsx
const { CourseworkView } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-courseworkView.jsx"));
return <CourseworkView />;
```

## 🧠 Key Concepts

## 📝 Notes

> [!tip] Summary

## 🔗 References