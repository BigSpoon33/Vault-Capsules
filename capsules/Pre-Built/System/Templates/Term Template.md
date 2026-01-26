<%*
const termName = await tp.system.prompt("Term Name (e.g., Spring 2026)");
const start = await tp.system.prompt("Start Date (YYYY-MM-DD)", "2026-01-05");
const end = await tp.system.prompt("End Date (YYYY-MM-DD)", "2026-04-19");
await tp.file.rename(termName);
_%>
---
tags: [term]
status: active
start: <% start %>
end: <% end %>
---
# 🗓️ <% termName %>

![[Classes.base#By Semester]]