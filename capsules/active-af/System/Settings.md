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
    icon: 📝
    widget:
  - id: morning
    label: Morning
    icon: 🌅
    widget: dc-sleepTracker
  - id: activities
    label: Activities
    icon: 📊
    widget: dc-activityLogger
  - id: meditation
    label: Meditation
    icon: 🧘
    widget: dc-meditationTimer
  - id: evening
    label: Evening
    icon: 🌙
    widget: dc-eveningReflection
  - id: tracker
    label: Trends
    icon: 📉
    widget: dc-activityTracker
installed-dashboards: []
activities:
  - id: journal
    name: Journal
    type: count
    field: journal
    icon: 📖
    color: "#2089FF"
  - id: sleep
    name: Sleep
    type: value
    field: sleep-hours
    goal: 8
    unit: hrs
    icon: 🌙
    color: "#00B894"
  - id: mood
    name: Mood
    type: value
    field: mood
    goal: 5
    icon: 😊
    color: "#A29BFE"
  - id: energy
    name: Energy
    type: value
    field: energy
    goal: 5
    icon: ⚡
    color: "#FDCB6E"
  - id: water
    name: Water
    type: value
    field: water-ml
    goal: 3000
    unit: ml
    icon: 💧
    color: "#0984E3"
  - id: meditation
    name: Meditation
    type: value
    field: meditation-minutes
    goal: 15
    unit: min
    icon: 🧘
    color: "#81ECEC"
  - id: gratitude
    name: Gratitude
    type: count
    field: gratitude
    icon: ❤️
    color: "#FD79A8"
remote-capsules:
  demo-widget:
    version: 1.0.0
    installedAt: 2026-01-19T17:31:37.474Z
    files:
      - System/Scripts/Widgets/dc-demoWidget.jsx
---

```datacorejsx
const { Settings } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-settings.jsx"));
return <Settings />;
```
