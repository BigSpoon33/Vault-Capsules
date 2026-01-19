<%*
// 1. PROMPT THE USER
const planName = await tp.system.prompt("Workout Name (e.g. Leg Day)", "New Workout");
const focus = await tp.system.prompt("Focus (e.g. Quads & Calves)", "General Fitness");
const duration = await tp.system.prompt("Duration (minutes)", "45");
const difficulty = await tp.system.prompt("Difficulty (e.g. Intermediate)", "Intermediate");

// 2. RENAME THE FILE
await tp.file.rename(planName);

// 3. GENERATE THE FILE CONTENT
// We use tR (Template Response) to output the string using the variables above.
tR += `---
categories:
  - "[[Workout Plan]]"
focus: ${focus}
duration: ${duration}
difficulty: ${difficulty}
warmup: []
cooldown: []
exercises: []
created: ${tp.date.now("YYYY-MM-DD")}
---

\`\`\`datacorejsx
const script = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-workoutBuilder.jsx"));
return function View() { return script.Func(); }
\`\`\`

# 💪 ${planName}

**Focus:** ${focus}
**Duration:** ~${duration} minutes
**Difficulty:** ${difficulty}

---

## Progress Tracking

Track your performance in daily notes:
- Weight used
- Reps completed
- Energy level
- Notes on form

## Related

- [[System/Categories/Exercise|Exercise Library]]
- [[Exercise Planner|Exercise Planner (Weekly Schedule)]]
`
%>