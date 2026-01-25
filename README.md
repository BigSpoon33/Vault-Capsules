# Vault-Capsules

**Modular Obsidian vault system with one-click installation**

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Development-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/bigspoon33)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.0+-purple.svg)](https://obsidian.md)

---

## What Is This?

Vault-Capsules is a modular Obsidian vault ecosystem that lets you pick and choose the features you need. Instead of downloading a massive vault and deleting what you don't use, you start with a minimal foundation and add only what you want.

- **Modular by design** - Install only the capsules you need
- **One-click installation** - Add features directly from within Obsidian
- **Built on DatacoreJSX** - Reactive components with real-time updates
- **Fully themed** - 8 included color themes with custom sprites and animations
- **Your files, your data** - Everything is local markdown files you own forever

> This system is built on the philosophy of digital ownership. No cloud subscriptions, no proprietary formats. Just text files on your device that work offline and will survive any app's sunset.

---

## Available Capsules

| Capsule | Description | Key Features |
|---------|-------------|--------------|
| **core-af** | Minimal foundation | Settings UI, Glo* component library, Theme system, Daily wrapper |
| **active-af** | Daily wellness tracking | Sleep tracker, mood/energy logging, water intake, meditation timer, gratitude journal |
| **daily-af** | Daily note system | Journal wrapper, daily templates, periodic notes integration |
| **kitchen-af** | Meal planning | Recipe manager, meal planner, shopping list generator, macro tracking |
| **workout-af** | Exercise tracking | Workout builder, muscle maps, exercise library, weekly routines |
| **academic-af** | Academic management | Course tracking, assignments, exams, lecture notes, term planning |
| **rice-af** | Theme engine | Theme Studio, sprite packs, color schemes, gradient builder |

---

## Screenshots

### Theme Studio
Create and customize your vault's look with the visual Theme Studio. Change colors, backgrounds, and component styles with live preview.

![Theme Studio](https://raw.githubusercontent.com/BigSpoon33/Vault-Capsules/main/assets/theme-studio.png)

### Component Showcase
16+ themed components including GloButton, GloToggle, GloBar, GloCard, GloDial, and more - all reactive and theme-aware.

![Component Showcase](https://raw.githubusercontent.com/BigSpoon33/Vault-Capsules/main/assets/component-showcase.png)

### Theme Switching
Switch between 8 included themes with one click. Each theme includes coordinated colors for the entire vault.

![Theme Switching](https://raw.githubusercontent.com/BigSpoon33/Vault-Capsules/main/assets/theme-switching.gif)

### Daily Dashboard
Your daily command center with morning check-in, activity logging, meal planning, workout tracking, and evening reflection.

![Daily Dashboard](https://raw.githubusercontent.com/BigSpoon33/Vault-Capsules/main/assets/daily-dashboard.png)

---

## Quick Start

### Path A: Start Fresh (Recommended)

1. **Download the starter vault**
   - Download `core-af.zip` from [Releases](https://github.com/BigSpoon33/Vault-Capsules/releases)
   - Extract and open as a new vault in Obsidian

2. **Install required plugins**
   - Open Obsidian Settings > Community Plugins > Browse
   - Install and enable:
     - **Datacore** (required - powers all widgets)
     - **Templater** (required - note templates)
     - **TaskNotes** (required - task management)
     - **Style Settings** (required - theme colors)
     - **Minimal Theme Settings** (required - base theme)

3. **Apply the Minimal theme**
   - Settings > Appearance > Themes > Browse
   - Install "Minimal" by @kepano
   - Select it as your active theme

4. **Add capsules**
   - Open `System/Settings.md`
   - Click any capsule to install it
   - Files are automatically downloaded and placed in your vault

### Path B: Add to Existing Vault

> **BACKUP YOUR VAULT FIRST.** Copy your entire vault folder before proceeding. This system doesn't delete files, but merging systems can cause conflicts. Test on a copy first.

1. **Copy core files**
   - Download `core-af.zip` from Releases
   - Extract the `System` folder into your vault root

2. **Install required plugins** (same as Path A)

3. **Configure Templater**
   - Set Template folder to `System/Templates`

4. **Configure TaskNotes**
   - Set base folder to `System/TaskNotes`

5. **Use Settings.md to add capsules**
   - Navigate to `System/Settings.md`
   - Install additional capsules as needed

---

## Requirements

### Required
- Obsidian v1.0+
- Community Plugins:
  - [Datacore](https://github.com/blacksmithgu/datacore) - JSX components and reactive queries
  - [Templater](https://github.com/SilentVoid13/Templater) - Template system
  - [TaskNotes](https://github.com/jsdpag/obsidian-task-notes) - Task management
  - [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) - Theme customization
  - [Minimal Theme Settings](https://github.com/kepano/obsidian-minimal-settings) - Minimal theme options
- Theme:
  - [Minimal](https://github.com/kepano/obsidian-minimal) by @kepano

### Recommended
- [Homepage](https://github.com/mirnovov/obsidian-homepage) - Set a default opening note
- [Banners](https://github.com/noatpad/obsidian-banners) - Note header images
- [Live Background](https://github.com/hananoshika/Obsidian-Live-Background) - Animated backgrounds
- [Soundscapes](https://github.com/andrewmcgivery/obsidian-soundscapes) - Ambient sounds

---

## How Capsule Installation Works

The capsule system uses a simple fetch-and-place approach:

1. **Settings.md** contains the capsule manager UI built with Datacore
2. When you click a capsule, it fetches from this GitHub repository
3. Files are downloaded to their designated locations in your vault
4. Activities and widgets auto-configure based on the manifest
5. Themes and components register automatically

All capsule definitions are stored in `capsule-manifest.json` at the repo root.

```
Your Vault/
├── System/
│   ├── Settings.md          <- Capsule manager lives here
│   ├── Scripts/
│   │   ├── Components/      <- Glo* component library
│   │   ├── Core/            <- Theme provider, utilities
│   │   ├── Widgets/         <- Feature widgets
│   │   └── Wrappers/        <- Page wrappers
│   ├── Themes/              <- Theme definitions & style-settings
│   ├── Templates/           <- Note templates
│   └── Dashboards/          <- Main dashboards
└── ...your notes
```

---

## Included Themes

Eight coordinated color themes, each with matching Obsidian interface colors and component styles:

| Theme | Style |
|-------|-------|
| **whiteCrane** | Clean whites and soft grays |
| **violetViper** | Deep purples and magentas |
| **savageCroc** | Forest greens and earth tones |
| **redHawk** | Bold reds and warm accents |
| **killaBee** | Yellow and black high contrast |
| **makoBlue** | Ocean blues and teals |
| **hiddenDragon** | Dark mode with subtle accents |
| **crouchingTiger** | Warm oranges and browns |

Each theme includes:
- Obsidian interface colors (via Style Settings)
- Component gradients and hover states
- Coordinated accent colors for headings, links, and icons
- Optional animated backgrounds and sprites

---

## Component Library (Glo*)

The Glo* component library provides themed, reactive UI components for building dashboards and widgets:

| Component | Description |
|-----------|-------------|
| `GloButton` | Themed buttons with hover/active states |
| `GloToggle` | On/off switches with animations |
| `GloBar` | Progress bars with gradients |
| `GloCard` | Content containers with themed borders |
| `GloDial` | Circular input controls |
| `GloInput` | Text inputs with themed styling |
| `GloSelect` | Dropdown selectors |
| `GloTabs` | Tab navigation component |
| `GloBadge` | Status indicators and tags |
| `CalendarPicker` | Date selection widget |
| `ColorPicker` | Color selection with presets |
| `BackgroundPicker` | Image/gradient background selector |
| `GradientBuilder` | Visual gradient creator |

All components automatically inherit the active theme's colors and respond to theme changes in real-time.

See `System/Dashboards/Component-Showcase.md` for interactive examples.

---

## Philosophy

### Digital Ownership
Your notes are markdown files on your device. No subscriptions, no cloud lock-in, no "you don't actually own this" terms of service. If Obsidian disappeared tomorrow, you'd still have every word you wrote.

### Rice AF
"Rice" comes from the Unix/Linux customization community - making your setup look good and work exactly how you want. This vault embraces that philosophy: functional AND aesthetic. When your tools look good and feel good, you actually want to use them.

> "All that we have been doing with the themes and colors is just frill. Here are the meat and potatoes."

### Credits
- Built on the [kepano-obsidian](https://github.com/kepano/kepano-obsidian) vault structure
- Minimal theme by [@kepano](https://github.com/kepano)
- Created by BigSpoon33

---

## Support

If this project helps your workflow, consider supporting development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Development-FF5E5B?logo=ko-fi&logoColor=white&style=for-the-badge)](https://ko-fi.com/bigspoon33)

### Links
- [Report Issues](https://github.com/BigSpoon33/Vault-Capsules/issues)
- [Releases](https://github.com/BigSpoon33/Vault-Capsules/releases)

### Related Repos
Individual capsules are also available as standalone vaults for those who prefer:
- [Active-AF](https://github.com/BigSpoon33/Active-AF)
- [Kitchen-AF](https://github.com/BigSpoon33/Kitchen-AF)
- [Workout-AF](https://github.com/BigSpoon33/Workout-AF)
- [Academic-AF](https://github.com/BigSpoon33/Academic-AF)
- [Rice-AF](https://github.com/BigSpoon33/Rice-AF)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Rice AF, iykyk.*
