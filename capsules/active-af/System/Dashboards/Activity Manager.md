---
created: 2025-12-28
tags:
  - dashboards
---

## 📊 Activity Manager

Manage your tracked activities below. Add, edit, or remove activities that appear in your daily notes and dashboard.

```datacorejsx
const scriptPath = "System/Scripts/Widgets/dc-activityManager.jsx";
const target = dc.fileLink(scriptPath);
const result = await dc.require(target);
const view = result?.renderedView ?? result?.View ?? result;  
const Func = result?.Func ?? null;

return function View() {
    const currentFile = dc.useCurrentFile();
    if (Func) {
        return Func({ currentFile, scriptPath });
    }
    return view ?? <p>Failed to render Activity Manager</p>;
}
```