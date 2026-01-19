<%*
// 1. GET TERM INFO
// We look for files tagged #term to populate the dropdown
const termFiles = app.vault.getMarkdownFiles().filter(f => {
    const c = app.metadataCache.getFileCache(f);
    return c?.frontmatter?.tags?.includes("term");
});
// Create a dropdown of available terms
const termOptions = termFiles.map(f => f.basename);
const selectedTermName = await tp.system.suggester(termOptions, termOptions);
const selectedTermFile = termFiles.find(f => f.basename === selectedTermName);

// Read the start/end dates from the Term Note
const termCache = app.metadataCache.getFileCache(selectedTermFile);
const termStart = termCache?.frontmatter?.start || tp.date.now("YYYY-MM-DD");
const termEnd = termCache?.frontmatter?.end || tp.date.now("YYYY-MM-DD");

// 2. GET CLASS DETAILS
const courseCode = await tp.system.prompt("Course Code (e.g., ACU-101):");
const courseName = await tp.system.prompt("Course Name:");
const classDays = await tp.system.prompt("Days (MO,TU,WE,TH,FR) - Comma separated:", "MO,WE");
const classTime = await tp.system.prompt("Start Time (HH:MM) 24h format:", "18:00");

// Optional class details
const instructor = await tp.system.prompt("Instructor (optional):", "");
const credits = await tp.system.prompt("Credits (optional):", "");

// 3. GENERATE RECURRENCE STRING (TaskNotes / iCal Format)
// Format: DTSTART:20260105T180000Z;FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20260419
const cleanDate = (d) => d.replaceAll("-", "");
const cleanTime = (t) => t.replaceAll(":", "") + "00";
const recurrenceString = `DTSTART:${cleanDate(termStart)}T${cleanTime(classTime)}Z;FREQ=WEEKLY;BYDAY=${classDays.toUpperCase()};UNTIL=${cleanDate(termEnd)}`;
const scheduledString = `${termStart}T${classTime}`;

// 4. FILE PLACEMENT
const fileName = `${courseCode} ${courseName}`;
const rootFolder = "System/Academic/Classes";
const classFolder = `${rootFolder}/${fileName}`; 

if (!app.vault.getAbstractFileByPath(rootFolder)) await app.vault.createFolder(rootFolder);
if (!app.vault.getAbstractFileByPath(classFolder)) await app.vault.createFolder(classFolder);

await tp.file.rename(fileName);
await tp.file.move(`${classFolder}/${fileName}`);
_%>
---
categories:
  - "[[Classes]]"
term: "[[<% selectedTermName %>]]"
course-code: <% courseCode %>
course-name: <% courseName %>
instructor: <% instructor %>
credits: <% credits ? parseInt(credits) : "" %>
semester: <% selectedTermName %>
# TASKNOTES CONFIGURATION
tags: [task, class]
status: open
priority: normal
scheduled: <% scheduledString %>
recurrence: <% recurrenceString %>
recurrence_anchor: scheduled
# END TASKNOTES
cssclasses: dashboard
---

# 📚 <% courseCode %> - <% courseName %>

```datacorejsx
const { ClassView } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-classView.jsx"));
return <ClassView />;
```

![[Coursework.base#By Class|embed-clean]]