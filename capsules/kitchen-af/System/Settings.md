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
  - id: meals
    label: Meals
    icon: "🍽️"
    widget: dc-todayMenu
installed-dashboards: []
activities:
  - id: journal
    name: Journal
    type: count
    field: journal
    icon: "📖"
    color: "#2089FF"
  - id: calories
    name: Calories
    type: value
    field: consumed-calories
    goal: 2000
    unit: kcal
    icon: "🔥"
    color: "#FF7675"
  - id: protein
    name: Protein
    type: value
    field: consumed-protein
    goal: 150
    unit: g
    icon: "🥩"
    color: "#E17055"
  - id: carbs
    name: Carbs
    type: value
    field: consumed-carbs
    goal: 200
    unit: g
    icon: "🌾"
    color: "#FDCB6E"
  - id: fat
    name: Fat
    type: value
    field: consumed-fat
    goal: 65
    unit: g
    icon: "🫒"
    color: "#74B9FF"
---

```datacorejsx
const { Settings } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-settings.jsx"));
return <Settings />;
```
