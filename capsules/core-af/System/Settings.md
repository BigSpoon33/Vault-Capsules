---
tags:
  - settings
  - configuration
cssclasses:
  - dashboard
widget-theme: default2
color-override: redHawk
flashy-mode: true
widget-backgrounds: false
__preview_toggle_on: false
__preview_toggle_off: false
installed-modules:
installed-dashboards: []
activities:
installed-capsules:
---

```datacorejsx
const { Settings } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-settings.jsx"));
return <Settings />;
```
