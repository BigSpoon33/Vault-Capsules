<%*
const planName = await tp.system.prompt("Plan Name (e.g. Budget Week)", "New Meal Plan");
await tp.file.rename(planName);
%>---
categories:
  - "[[Meal Plans]]"
monday-break: 
monday-lunch: 
monday-dinner: 
tuesday-break: 
tuesday-lunch: 
tuesday-dinner: 
wednesday-break: 
wednesday-lunch: 
wednesday-dinner: 
thursday-break: 
thursday-lunch: 
thursday-dinner: 
friday-break: 
friday-lunch: 
friday-dinner: 
saturday-break: 
saturday-lunch: 
saturday-dinner: 
sunday-break: 
sunday-lunch: 
sunday-dinner: 
---

# 🗓️ <% planName %>

```datacorejsx
const script = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-mealPlanner.jsx"));
return function View() { return script.Func(); }
```

*A saved configuration for the Kitchen OS.*

### Notes
-