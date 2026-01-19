---
# ═══════════════════════════════════════════════════════════════════════════════
# THEME TEMPLATE
# Create a new theme by copying this file and filling in your values
# ═══════════════════════════════════════════════════════════════════════════════

# === THEME METADATA ===
theme-id: "<% tp.system.prompt("Theme ID (lowercase, no spaces, e.g. 'my-theme')") %>"
theme-name: "<% tp.system.prompt("Theme Display Name (e.g. 'My Awesome Theme')") %>"
theme-description: "<% tp.system.prompt("Theme Description") %>"
theme-author: "<% tp.system.prompt("Your Name", "Anonymous") %>"
theme-version: "1.0"

# === COLOR PALETTE ===
# Primary brand color
color-primary: "#ff69b4"
# Secondary/darker color
color-secondary: "#0a0a2e"
# Accent/highlight color
color-accent: "#ffff00"
# Success state color
color-success: "#33ff00"
# Warning state color
color-warning: "#ff9900"
# Error state color
color-error: "#ff0000"
# Main background color
color-background: "#1a1a2e"
# Card/surface background color
color-surface: "#2a2a4e"
# Primary text color
color-text: "#ffffff"
# Muted/secondary text color
color-text-muted: "#aaaacc"

# === TYPOGRAPHY ===
font-ui: "Inter, sans-serif"
font-body: "Georgia, serif"
font-mono: "Fira Code, monospace"

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT: DRAGGABLE PROGRESS BAR
# ═══════════════════════════════════════════════════════════════════════════════
# The animated sprite that moves along the progress bar
# Paste your base64 GIF string here (must start with data:image/gif;base64,)
bar-sprite: ""
bar-sprite-width: 34
bar-sprite-height: 21
# The background of the empty track (can be base64 GIF for animation, or solid color)
bar-track-bg: ""
# The gradient or color that fills the bar as progress increases
bar-fill-gradient: "linear-gradient(to bottom, #FF0000 0%, #FF9900 16%, #FFFF00 33%, #33FF00 50%, #0099FF 66%, #6633ff 100%)"
bar-border-radius: "6px"
bar-height: "14px"

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT: BUTTONS
# ═══════════════════════════════════════════════════════════════════════════════
# Background when idle (can be gradient, color, or base64 image)
button-idle-bg: ""
# Background when hovering
button-hover-bg: ""
# Background when clicked/active
button-active-bg: ""
button-text-color: "#ffffff"
button-border-radius: "8px"
button-padding: "8px 16px"

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT: TOGGLE (Like Moth Toggle)
# ═══════════════════════════════════════════════════════════════════════════════
# The character/sprite that indicates the toggle state
toggle-sprite: ""
toggle-sprite-width: 50
toggle-sprite-height: 50
# Background patterns for different states
toggle-idle-bg: ""
toggle-hover-bg: ""
toggle-active-bg: ""

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT: CARDS / WIDGET CONTAINERS
# ═══════════════════════════════════════════════════════════════════════════════
# Style: "solid", "transparent", "glass", "gradient"
card-bg-style: "solid"
card-bg-color: "#2a2a4e"
card-border: "1px solid rgba(255,255,255,0.1)"
card-border-radius: "12px"
card-shadow: "0 4px 15px rgba(0,0,0,0.2)"
card-padding: "16px"

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT: INPUTS
# ═══════════════════════════════════════════════════════════════════════════════
input-bg: "rgba(255,255,255,0.05)"
input-border: "1px solid rgba(255,255,255,0.2)"
input-border-focus: "1px solid var(--color-accent)"
input-border-radius: "6px"
input-text-color: "#ffffff"

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT: CHIPS / TAGS
# ═══════════════════════════════════════════════════════════════════════════════
chip-bg: "rgba(255,255,255,0.05)"
chip-bg-active: "rgba(255,255,255,0.15)"
chip-border-radius: "20px"

# ═══════════════════════════════════════════════════════════════════════════════
# CHARTS & DATA VISUALIZATION
# ═══════════════════════════════════════════════════════════════════════════════
chart-color-1: "#ff0000"
chart-color-2: "#ff9900"
chart-color-3: "#ffff00"
chart-color-4: "#33ff00"
chart-color-5: "#0099ff"
chart-color-6: "#6633ff"
heatmap-empty: "rgba(255,255,255,0.1)"
heatmap-filled: "#ff69b4"

# ═══════════════════════════════════════════════════════════════════════════════
# ICONS
# ═══════════════════════════════════════════════════════════════════════════════
# Style: "emoji", "lucide", "custom"
icon-style: "emoji"
icon-water: "💧"
icon-sleep: "😴"
icon-exercise: "💪"
icon-mood: "😊"
icon-food: "🍽️"
icon-journal: "📔"

# ═══════════════════════════════════════════════════════════════════════════════
# MASCOT / VAULT PET (Optional)
# ═══════════════════════════════════════════════════════════════════════════════
mascot-enabled: false
mascot-idle: ""
mascot-happy: ""
mascot-sad: ""
# Position: "bottom-right", "bottom-left", "top-right", "top-left"
mascot-position: "bottom-right"
mascot-size: "64px"

# ═══════════════════════════════════════════════════════════════════════════════
# AMBIENT / DECORATIVE (Optional)
# ═══════════════════════════════════════════════════════════════════════════════
# Animated background (base64 GIF) - use sparingly!
ambient-bg: ""
# Default banner image for notes
default-banner: ""

# ═══════════════════════════════════════════════════════════════════════════════
# MINIMAL THEME INTEGRATION (Optional)
# ═══════════════════════════════════════════════════════════════════════════════
# Set to sync with Obsidian's Minimal Theme
minimal-color-scheme: ""
minimal-accent-color: ""
---

# <% tp.file.title %>

## Theme Preview

This theme will be available in the theme selector once you fill in the required fields above.

### Required Fields
- [ ] `theme-id` - Unique identifier (no spaces)
- [ ] `theme-name` - Display name
- [ ] `bar-sprite` - Progress bar character GIF

### Optional Enhancements
- [ ] Custom colors
- [ ] Button backgrounds
- [ ] Toggle sprite
- [ ] Chart colors
- [ ] Mascot/pet

## How to Add Base64 Images

1. Find or create your GIF/PNG image
2. Convert to base64 using an online tool or command line
3. Paste the full data URL starting with `data:image/gif;base64,` or `data:image/png;base64,`

## Notes

Add any notes about your theme here...
