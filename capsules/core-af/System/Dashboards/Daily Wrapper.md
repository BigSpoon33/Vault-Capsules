---
cssclasses:
  - dashboard
  - noyaml
tags:
  - daily
---
```datacorejsx
const { DailyWrapper } = await dc.require(dc.fileLink("System/Scripts/Wrappers/dc-dailyWrapper.jsx"));
return <DailyWrapper />;
```