---
tags:
  - settings
  - configuration
cssclasses:
  - dashboard
widget-theme: default2
color-override: makoBlue
flashy-mode: true
widget-backgrounds: false
__preview_toggle_on: false
__preview_toggle_off: false
installed-modules:
  - id: journal
    label: Journal
    icon: 📝
    widget:
installed-dashboards:
  - academic
activities:
  - id: journal
    name: Journal
    type: count
    field: journal
    icon: 📖
    color: "#2089FF"
  - id: study
    name: Study
    type: value
    field: study-hours
    goal: 4
    unit: hrs
    icon: 📚
    color: "#9B59B6"
  - id: learning
    name: Learning
    type: boolean
    field: learning
    icon: 🎓
    color: "#3498DB"
---

```datacorejsx
const { Settings } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-settings.jsx"));
return <Settings />;
```
