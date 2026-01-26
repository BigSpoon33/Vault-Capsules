---
tags:
  - settings
  - configuration
cssclasses:
  - dashboard
widget-theme: rare parrot
color-override: savageCroc
flashy-mode: true
widget-backgrounds: false
__preview_toggle_on: false
__preview_toggle_off: false
installed-modules:
  - id: journal
    label: Journal
    icon: 📝
    widget:
    description: Daily journaling with auto-save
  - id: morning
    label: Morning
    icon: 🌅
    widget: dc-sleepTracker
    description: Sleep tracking & daily plan viewer
  - id: activities
    label: Activities
    icon: 📊
    widget: dc-activityLogger
    description: Log and track daily activities
  - id: meditation
    label: Meditation
    icon: 🧘
    widget: dc-meditationTimer
    description: Guided meditation timer
  - id: evening
    label: Evening
    icon: 🌙
    widget: dc-eveningReflection
    description: Evening reflection & gratitude
  - id: tracker
    label: Trends
    icon: 📉
    widget: dc-activityTracker
    description: Heatmaps & trend graphs
  - id: movement
    label: Movement
    icon: 💪
    widget: dc-workoutToday
    description: Daily workout tracking
  - id: meals
    label: Meals
    icon: 🍽️
    widget: dc-todayMenu
    description: Meal planning & nutrition tracking
installed-dashboards: []
activities:
  - id: sleep
    name: Sleep
    type: value
    field: sleep-hours
    goal: 8
    unit: hrs
    icon: 🌙
    color: "#00B894"
    hidden: true
    managed: true
    managedBy: dc-sleepTracker
  - id: mood
    name: Mood
    type: value
    field: mood
    goal: 5
    icon: 😊
    color: "#A29BFE"
    hidden: true
    managed: true
    managedBy: dc-sleepTracker
  - id: energy
    name: Energy
    type: value
    field: energy
    goal: 5
    icon: ⚡
    color: "#FDCB6E"
    hidden: true
    managed: true
    managedBy: dc-sleepTracker
  - id: water
    name: Water
    type: value
    field: water-ml
    goal: 3000
    unit: ml
    icon: 💧
    color: "#0984E3"
    hidden: false
    managed: false
  - id: meditation
    name: Meditation
    type: value
    field: meditation-minutes
    goal: 15
    unit: min
    icon: 🧘
    color: "#81ECEC"
    hidden: true
    managed: true
    managedBy: dc-meditationTimer
  - id: gratitude
    name: Gratitude
    type: count
    field: gratitude
    icon: ❤️
    color: "#FD79A8"
    hidden: true
    managed: true
    managedBy: dc-eveningReflection
  - id: study
    name: Study
    type: value
    field: study-hours
    goal: 4
    unit: hrs
    icon: 📚
    color: "#9B59B6"
    hidden: true
    managed: true
    managedBy: dc-academicDashboard
  - id: exercise
    name: Exercise
    type: value
    field: exercise-minutes
    goal: 30
    unit: min
    icon: 🏋️
    color: "#E17055"
    hidden: true
    managed: true
    managedBy: dc-workoutToday
  - id: calories
    name: Calories
    type: value
    field: consumed-calories
    goal: 2000
    unit: kcal
    icon: 🔥
    color: "#FF7675"
    hidden: true
    managed: true
    managedBy: dc-mealPlanner
  - id: protein
    name: Protein
    type: value
    field: consumed-protein
    goal: 150
    unit: g
    icon: 🥩
    color: "#E17055"
    hidden: true
    managed: true
    managedBy: dc-mealPlanner
  - id: carbs
    name: Carbs
    type: value
    field: consumed-carbs
    goal: 250
    unit: g
    icon: 🍞
    color: "#FDCB6E"
    hidden: true
    managed: true
    managedBy: dc-mealPlanner
  - id: fat
    name: Fat
    type: value
    field: consumed-fat
    goal: 65
    unit: g
    icon: 🥑
    color: "#00B894"
    hidden: true
    managed: true
    managedBy: dc-mealPlanner
installed-capsules:
  core-af:
    version: 1.0.0
    installedAt: 2026-01-26T01:32:03.235Z
    files:
      - System/Settings.md
      - System/Scripts/Widgets/dc-settings.jsx
      - System/Scripts/Core/dc-themeProvider.jsx
      - System/Scripts/Core/dc-dateContext.jsx
      - System/Scripts/Core/dc-gradientUtils.jsx
      - System/Scripts/Components/dc-backgroundPicker.jsx
      - System/Scripts/Components/dc-calendarPicker.jsx
      - System/Scripts/Components/dc-colorPicker.jsx
      - System/Scripts/Components/dc-gloBadge.jsx
      - System/Scripts/Components/dc-gloBar.jsx
      - System/Scripts/Components/dc-gloButton.jsx
      - System/Scripts/Components/dc-gloCard.jsx
      - System/Scripts/Components/dc-gloDial.jsx
      - System/Scripts/Components/dc-gloInput.jsx
      - System/Scripts/Components/dc-gloSelect.jsx
      - System/Scripts/Components/dc-gloTabs.jsx
      - System/Scripts/Components/dc-gloToggle.jsx
      - System/Scripts/Components/dc-gradientBuilder.jsx
      - System/Scripts/Components/dc-meditationAnimations.jsx
      - System/Scripts/Components/dc-stickyPreview.jsx
      - System/Scripts/Components/dc-themePreviewContent.jsx
      - System/Scripts/Widgets/dc-themeDashboard.jsx
      - System/Scripts/Widgets/dc-themeEditor.jsx
      - System/Scripts/Widgets/dc-themeStudio.jsx
      - System/Scripts/Wrappers/dc-dailyWrapper.jsx
      - System/Dashboards/Daily Wrapper.md
      - System/Themes/_themeTemplate.md
      - System/Themes/default.md
      - System/Templates/Daily Note Template.md
  active-af:
    version: 1.1.0
    installedAt: 2026-01-26T01:32:08.138Z
    files:
      - System/Categories/Journal.md
      - System/Dashboards/Activity Manager.md
      - System/Scripts/Widgets/dc-activities.jsx
      - System/Scripts/Widgets/dc-activityLogger.jsx
      - System/Scripts/Widgets/dc-activityManager.jsx
      - System/Scripts/Widgets/dc-activityTracker.jsx
      - System/Scripts/Widgets/dc-eveningReflection.jsx
      - System/Scripts/Widgets/dc-journalNav.jsx
      - System/Scripts/Widgets/dc-meditationTimer.jsx
      - System/Scripts/Widgets/dc-randomQuote.jsx
      - System/Scripts/Widgets/dc-sleepTracker.jsx
      - System/Scripts/Widgets/dc-waterTracker.jsx
      - System/Templates/Bases/Journal.base
      - System/Templates/Journal Template.md
  academic-af:
    version: 1.0.0
    installedAt: 2026-01-26T01:32:14.187Z
    files:
      - System/Categories/Classes.md
      - System/Categories/Coursework.md
      - System/Dashboards/Academic Dashboard.md
      - System/Scripts/Widgets/dc-academicDashboard.jsx
      - System/Scripts/Widgets/dc-classView.jsx
      - System/Scripts/Widgets/dc-courseworkView.jsx
      - System/TaskNotes/Views/agenda-default.base
      - System/TaskNotes/Views/calendar-default.base
      - System/TaskNotes/Views/kanban-default.base
      - System/TaskNotes/Views/mini-calendar-default.base
      - System/TaskNotes/Views/relationships.base
      - System/TaskNotes/Views/tasks-default.base
      - System/Templates/Bases/Classes.base
      - System/Templates/Bases/Coursework.base
      - System/Templates/Class Template.md
      - System/Templates/Coursework Template.md
      - System/Templates/Lecture Notes Template.md
      - System/Templates/Term Template.md
  workout-af:
    version: 1.0.0
    installedAt: 2026-01-26T01:32:23.359Z
    files:
      - System/Assets/Anatomy/INKSCAPE_GUIDE.md
      - System/Assets/Anatomy/Muscles_front_and_back.svg
      - System/Assets/Anatomy/PATH_REFERENCE.md
      - System/Assets/Anatomy/all_paths_data.json
      - System/Assets/Anatomy/comprehensive_muscle_mapper.html
      - System/Assets/Anatomy/muscle_data.json
      - System/Assets/Anatomy/muscle_helper.py
      - System/Assets/Anatomy/muscle_mapper.html
      - System/Assets/Anatomy/muscle_mapper_v2.html
      - System/Assets/Anatomy/muscle_mapping.json
      - System/Assets/Anatomy/muscle_paths.txt
      - System/Assets/Anatomy/muscles_labeled.svg
      - System/Categories/Exercise.md
      - System/Categories/Workout Plan.md
      - System/Planners/Exercise Planner.md
      - System/Scripts/Components/dc-exercisePicker.jsx
      - System/Scripts/Widgets/dc-muscleMap.jsx
      - System/Scripts/Widgets/dc-weeklyWorkout.jsx
      - System/Scripts/Widgets/dc-workoutBuilder.jsx
      - System/Scripts/Widgets/dc-workoutToday.jsx
      - System/Templates/Bases/Exercise.base
      - System/Templates/Bases/Workout Plans.base
      - System/Templates/Exercise Template.md
      - System/Templates/Workout-Plan Template.md
  kitchen-af:
    version: 1.0.0
    installedAt: 2026-01-26T01:32:27.511Z
    files:
      - System/Categories/Meal Plans.md
      - System/Categories/Recipes.md
      - System/Planners/Meal Planner.md
      - System/Scripts/Widgets/dc-mealPlanner.jsx
      - System/Scripts/Widgets/dc-recipeEditor.jsx
      - System/Scripts/Widgets/dc-shoppingList.jsx
      - System/Scripts/Widgets/dc-todayMenu.jsx
      - System/Templates/Bases/Meal Plans.base
      - System/Templates/Bases/Recipes.base
      - System/Templates/Meal Plan Template.md
      - System/Templates/Recipe Template.md
  rice-af:
    version: 1.0.0
    installedAt: 2026-01-26T01:32:42.178Z
    files:
      - System/Dashboards/Theme-Dashboard.md
      - System/Themes/default2.md
      - System/Themes/mewSpin.md
      - System/Themes/bongoCat.md
      - System/Themes/Charizard.md
      - System/Themes/dittoDance.md
      - System/Themes/e-ink-01.md
      - System/Themes/orangeOrangu.md
      - System/Themes/rareParrot.md
      - System/Themes/style-settings-crouchingTiger.json
      - System/Themes/style-settings-hiddenDragon.json
      - System/Themes/style-settings-killaBee.json
      - System/Themes/style-settings-makoBlue.json
      - System/Themes/style-settings-mewSpin.json
      - System/Themes/style-settings-redHawk.json
      - System/Themes/style-settings-savageCroc.json
      - System/Themes/style-settings-violetViper.json
      - System/Themes/style-settings-whiteCrane.json
meditation:
  duration: 10
  breathIn: 4
  breathHold: 0
  breathOut: 4
  breathHoldOut: 0
  preset: simple
  colors:
    - "#7c3aed"
    - "#7c3aed"
  colorMode: gradient
  animation: orb
  audioEnabled: true
  audioStart: true
  audioEnd: true
  audioBreath: false
  volume: 0.5
  customAudioStart: ""
  customAudioEnd: ""
---

```datacorejsx
const { Settings } = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-settings.jsx"));
return <Settings />;
```
