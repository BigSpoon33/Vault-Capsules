---
cssclasses:
  - dashboard
  - noyaml
tags:
  - dashboards
  - daily
---
```datacorejsx
const { DailyWrapper } = await dc.require(dc.fileLink("System/Scripts/Wrappers/dc-dailyWrapper.jsx"));
return <DailyWrapper />;
```
![[System/Dashboards/Activity Manager.md]]