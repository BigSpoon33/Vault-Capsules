---
tags:
  - settings
  - configuration
cssclasses:
  - dashboard
widget-theme: mewSpin
color-override: redHawk
flashy-mode: true
widget-backgrounds: false
__preview_toggle_on: false
__preview_toggle_off: false
installed-modules:
  - id: journal
    label: Journal
    icon: "📝"
    widget: null
  - id: movement
    label: Movement
    icon: "💪"
    widget: dc-workoutToday
installed-dashboards: []
activities:
  - id: journal
    name: Journal
    type: count
    field: journal
    icon: "📖"
    color: "#2089FF"
  - id: exercise
    name: Exercise
    type: value
    field: exercise-minutes
    goal: 30
    unit: min
    icon: "🏋️"
    color: "#E17055"
  - id: workout-days
    name: Workout Days
    type: value
    field: workout-days
    goal: 4
    unit: days/wk
    icon: "📅"
    color: "#00CEC9"
---

```datacorejsx
const { Settings } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-settings.jsx"));
return <Settings />;
```
