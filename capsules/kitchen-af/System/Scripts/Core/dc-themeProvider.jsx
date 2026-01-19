// ═══════════════════════════════════════════════════════════════════════════════
// THEME PROVIDER v2.0
// Central theme management system with Obsidian sync
// 
// Features:
//   • Load themes from System/Themes/*.md files
//   • Color override from style-settings-*.json files  
//   • Auto-map Style Settings keys to widget properties
//   • Sync to Obsidian appearance, Style Settings, and Minimal Settings
//   • Glow colors auto-derived from accent colors
//
// Usage in widgets:
//   const { useTheme, useAvailableThemes, switchTheme } = await dc.require(
//     dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
//   );
//   
//   function MyWidget() {
//     const { theme, isLoading } = useTheme();
//     if (isLoading) return <div>Loading...</div>;
//     return <div style={{ color: theme["color-primary"] }}>...</div>;
//   }
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(124, 58, 237, ${alpha})`;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substr(2, 2), 16) || 0;
    const b = parseInt(cleanHex.substr(4, 2), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Determine if a color is light or dark
 * Returns true if light, false if dark
 */
function isLightColor(hex) {
    if (!hex || typeof hex !== 'string') return false;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substr(2, 2), 16) || 0;
    const b = parseInt(cleanHex.substr(4, 2), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE SETTINGS KEY MAPPING
// Maps Style Settings keys to our widget properties
// Aligned with Minimal Theme semantics:
//   bg1/bg2/bg3 = backgrounds, ui1/ui2/ui3 = borders, ax1/ax2/ax3 = accents, tx1/tx2/tx3 = text
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_SETTINGS_MAP = {
    // ═══════════════════════════════════════════════════════════════════════
    // BACKGROUND COLORS (bg1=primary, bg2=secondary, bg3=active)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@bg1@@dark": "color-background",
    "minimal-style@@bg2@@dark": "color-surface",
    "minimal-style@@bg3@@dark": "color-surface-hover",
    
    // Light mode
    "minimal-style@@bg1@@light": "color-background",
    "minimal-style@@bg2@@light": "color-surface",
    "minimal-style@@bg3@@light": "color-surface-hover",

    // ═══════════════════════════════════════════════════════════════════════
    // BORDER/UI COLORS (ui1=border, ui2=highlighted, ui3=active)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@ui1@@dark": "color-border",
    "minimal-style@@ui2@@dark": "color-border-highlight",
    "minimal-style@@ui3@@dark": "color-border-active",
    
    // Light mode
    "minimal-style@@ui1@@light": "color-border",
    "minimal-style@@ui2@@light": "color-border-highlight",
    "minimal-style@@ui3@@light": "color-border-active",

    // ═══════════════════════════════════════════════════════════════════════
    // ACCENT COLORS (ax1=accent, ax2=hover, ax3=interactive)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@ax1@@dark": "color-accent",
    "minimal-style@@ax2@@dark": "color-accent-hover",
    "minimal-style@@ax3@@dark": "color-accent-active",
    "minimal-style@@sp1@@dark": "color-text-on-accent",
    
    // Light mode
    "minimal-style@@ax1@@light": "color-accent",
    "minimal-style@@ax2@@light": "color-accent-hover",
    "minimal-style@@ax3@@light": "color-accent-active",
    "minimal-style@@sp1@@light": "color-text-on-accent",

    // ═══════════════════════════════════════════════════════════════════════
    // TEXT COLORS (tx1=normal, tx2=muted, tx3=faint)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@tx1@@dark": "color-text",
    "minimal-style@@tx2@@dark": "color-text-muted",
    "minimal-style@@tx3@@dark": "color-text-faint",
    "minimal-style@@hl1@@dark": "color-selection-bg",
    "minimal-style@@hl2@@dark": "color-highlight-bg",
    
    // Light mode
    "minimal-style@@tx1@@light": "color-text",
    "minimal-style@@tx2@@light": "color-text-muted",
    "minimal-style@@tx3@@light": "color-text-faint",
    "minimal-style@@hl1@@light": "color-selection-bg",
    "minimal-style@@hl2@@light": "color-highlight-bg",

    // ═══════════════════════════════════════════════════════════════════════
    // EXTENDED COLORS (for charts, graphs, status indicators)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@color-red@@dark": "color-red",
    "minimal-style@@color-orange@@dark": "color-orange",
    "minimal-style@@color-yellow@@dark": "color-yellow",
    "minimal-style@@color-green@@dark": "color-green",
    "minimal-style@@color-cyan@@dark": "color-cyan",
    "minimal-style@@color-blue@@dark": "color-blue",
    "minimal-style@@color-purple@@dark": "color-purple",
    "minimal-style@@color-pink@@dark": "color-pink",
    
    // Light mode
    "minimal-style@@color-red@@light": "color-red",
    "minimal-style@@color-orange@@light": "color-orange",
    "minimal-style@@color-yellow@@light": "color-yellow",
    "minimal-style@@color-green@@light": "color-green",
    "minimal-style@@color-cyan@@light": "color-cyan",
    "minimal-style@@color-blue@@light": "color-blue",
    "minimal-style@@color-purple@@light": "color-purple",
    "minimal-style@@color-pink@@light": "color-pink",

    // ═══════════════════════════════════════════════════════════════════════
    // HEADING COLORS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@h1-color@@dark": "color-heading-1",
    "minimal-style@@h2-color@@dark": "color-heading-2",
    "minimal-style@@h3-color@@dark": "color-heading-3",
    "minimal-style@@h4-color@@dark": "color-heading-4",
    "minimal-style@@h5-color@@dark": "color-heading-5",
    "minimal-style@@h6-color@@dark": "color-heading-6",
    
    // Light mode
    "minimal-style@@h1-color@@light": "color-heading-1",
    "minimal-style@@h2-color@@light": "color-heading-2",
    "minimal-style@@h3-color@@light": "color-heading-3",
    "minimal-style@@h4-color@@light": "color-heading-4",
    "minimal-style@@h5-color@@light": "color-heading-5",
    "minimal-style@@h6-color@@light": "color-heading-6",

    // ═══════════════════════════════════════════════════════════════════════
    // ICON COLORS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@icon-color@@dark": "color-icon",
    "minimal-style@@icon-color-hover@@dark": "color-icon-hover",
    "minimal-style@@icon-color-active@@dark": "color-icon-active",
    
    // Light mode
    "minimal-style@@icon-color@@light": "color-icon",
    "minimal-style@@icon-color-hover@@light": "color-icon-hover",
    "minimal-style@@icon-color-active@@light": "color-icon-active",

    // ═══════════════════════════════════════════════════════════════════════
    // LINK COLORS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@link-color@@dark": "color-link",
    "minimal-style@@link-color-hover@@dark": "color-link-hover",
    "minimal-style@@link-external-color@@dark": "color-link-external",
    "minimal-style@@link-external-color-hover@@dark": "color-link-external-hover",
    
    // Light mode
    "minimal-style@@link-color@@light": "color-link",
    "minimal-style@@link-color-hover@@light": "color-link-hover",
    "minimal-style@@link-external-color@@light": "color-link-external",
    "minimal-style@@link-external-color-hover@@light": "color-link-external-hover",

    // ═══════════════════════════════════════════════════════════════════════
    // GRAPH NODE COLORS (for activity tracker visualizations)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@graph-node@@dark": "color-graph-node",
    "minimal-style@@graph-node-focused@@dark": "color-graph-node-active",
    "minimal-style@@graph-node-tag@@dark": "color-graph-node-tag",
    
    // Light mode
    "minimal-style@@graph-node@@light": "color-graph-node",
    "minimal-style@@graph-node-focused@@light": "color-graph-node-active",
    "minimal-style@@graph-node-tag@@light": "color-graph-node-tag",

    // ═══════════════════════════════════════════════════════════════════════
    // UI ELEMENTS (line numbers, gutters, tabs)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dark mode
    "minimal-style@@line-number-color@@dark": "color-line-number",
    "minimal-style@@gutter-background@@dark": "color-gutter",
    "minimal-style@@active-line-bg@@dark": "color-active-line",
    "minimal-style@@minimal-tab-text-color@@dark": "color-tab",
    "minimal-style@@minimal-tab-text-color-active@@dark": "color-tab-active",
    
    // Light mode
    "minimal-style@@line-number-color@@light": "color-line-number",
    "minimal-style@@gutter-background@@light": "color-gutter",
    "minimal-style@@active-line-bg@@light": "color-active-line",
    "minimal-style@@minimal-tab-text-color@@light": "color-tab",
    "minimal-style@@minimal-tab-text-color-active@@light": "color-tab-active",

    // ═══════════════════════════════════════════════════════════════════════
    // EXTRA-EXTRAS SNIPPET (HR/divider colors)
    // ═══════════════════════════════════════════════════════════════════════
    
    "extra-extras@@extras-hr-color@@dark": "color-divider",
    "extra-extras@@extras-hr-color@@light": "color-divider",
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT THEME
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_THEME = {
    "theme-id": "default",
    "theme-name": "Default",
    "theme-description": "Fallback theme",
    
    // ═══════════════════════════════════════════════════════════════════════
    // BACKGROUND COLORS (aligned with Minimal: bg1/bg2/bg3)
    // ═══════════════════════════════════════════════════════════════════════
    "color-background": "#1e1e2e",       // bg1 - Primary background
    "color-surface": "#2a2a3e",          // bg2 - Secondary background (cards, panels)
    "color-surface-hover": "#363650",    // bg3 - Active/hover background
    
    // ═══════════════════════════════════════════════════════════════════════
    // BORDER COLORS (aligned with Minimal: ui1/ui2/ui3)
    // ═══════════════════════════════════════════════════════════════════════
    "color-border": "rgba(255,255,255,0.1)",        // ui1 - Default border
    "color-border-highlight": "rgba(255,255,255,0.2)", // ui2 - Highlighted border
    "color-border-active": "#7c3aed",              // ui3 - Active/focused border
    
    // ═══════════════════════════════════════════════════════════════════════
    // ACCENT COLORS (aligned with Minimal: ax1/ax2/ax3/sp1)
    // ═══════════════════════════════════════════════════════════════════════
    "color-accent": "#7c3aed",           // ax1 - Primary accent (links, buttons)
    "color-accent-hover": "#8b5cf6",     // ax2 - Accent hover state
    "color-accent-active": "#6d28d9",    // ax3 - Accent active/pressed state
    "color-text-on-accent": "#ffffff",   // sp1 - Text on accent backgrounds
    
    // ═══════════════════════════════════════════════════════════════════════
    // TEXT COLORS (aligned with Minimal: tx1/tx2/tx3/hl1/hl2)
    // ═══════════════════════════════════════════════════════════════════════
    "color-text": "#ffffff",             // tx1 - Primary text
    "color-text-muted": "#a0a0b0",       // tx2 - Secondary/muted text
    "color-text-faint": "#6b6b7b",       // tx3 - Tertiary/faint text
    "color-selection-bg": "rgba(124,58,237,0.3)",  // hl1 - Text selection background
    "color-highlight-bg": "rgba(245,158,11,0.35)", // hl2 - Highlighted text background
    
    // ═══════════════════════════════════════════════════════════════════════
    // EXTENDED COLORS (aligned with Minimal's rainbow palette)
    // Used for charts, graphs, status indicators, syntax highlighting
    // ═══════════════════════════════════════════════════════════════════════
    "color-red": "#ef4444",
    "color-orange": "#f59e0b",
    "color-yellow": "#eab308",
    "color-green": "#10b981",
    "color-cyan": "#06b6d4",
    "color-blue": "#3b82f6",
    "color-purple": "#8b5cf6",
    "color-pink": "#ec4899",
    
    // ═══════════════════════════════════════════════════════════════════════
    // SEMANTIC COLORS (derived from extended colors)
    // ═══════════════════════════════════════════════════════════════════════
    "color-success": "#10b981",          // Uses green
    "color-warning": "#f59e0b",          // Uses orange
    "color-error": "#ef4444",            // Uses red
    
    // ═══════════════════════════════════════════════════════════════════════
    // HEADING COLORS
    // ═══════════════════════════════════════════════════════════════════════
    "color-heading-1": "#7c3aed",
    "color-heading-2": "#8b5cf6",
    "color-heading-3": "#a78bfa",
    "color-heading-4": "#c4b5fd",
    "color-heading-5": "#ddd6fe",
    "color-heading-6": "#ede9fe",
    
    // ═══════════════════════════════════════════════════════════════════════
    // ICON COLORS
    // ═══════════════════════════════════════════════════════════════════════
    "color-icon": "#7c3aed",
    "color-icon-hover": "#a78bfa",
    "color-icon-active": "#8b5cf6",
    
    // ═══════════════════════════════════════════════════════════════════════
    // LINK COLORS
    // ═══════════════════════════════════════════════════════════════════════
    "color-link": "#7c3aed",
    "color-link-hover": "#a78bfa",
    "color-link-external": "#3b82f6",
    "color-link-external-hover": "#60a5fa",
    
    // ═══════════════════════════════════════════════════════════════════════
    // GRAPH NODE COLORS (for activity tracker visualizations)
    // ═══════════════════════════════════════════════════════════════════════
    "color-graph-node": "#7c3aed",
    "color-graph-node-active": "#f59e0b",
    "color-graph-node-tag": "#10b981",
    
    // ═══════════════════════════════════════════════════════════════════════
    // UI ELEMENT COLORS
    // ═══════════════════════════════════════════════════════════════════════
    "color-divider": "#7c3aed",
    "color-line-number": "#6b6b7b",
    "color-gutter": "rgba(124,58,237,0.1)",
    "color-active-line": "rgba(124,58,237,0.1)",
    "color-tab": "#a0a0b0",
    "color-tab-active": "#ffffff",
    
    // ═══════════════════════════════════════════════════════════════════════
    // GLOW EFFECTS (auto-derived if not set)
    // ═══════════════════════════════════════════════════════════════════════
    "glow-enabled": true,
    "glow-color-active": "",  // Derived from accent
    "glow-color-hover": "",   // Derived from accent-hover
    "glow-intensity": "15px",
    "glow-spread": "2px",
    
    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════
    "transition-duration": "0.3s",
    "transition-easing": "ease",
    
    // ═══════════════════════════════════════════════════════════════════════
    // BORDERS
    // ═══════════════════════════════════════════════════════════════════════
    "border-width-default": "1px",
    "border-width-active": "2px",
    "border-radius-small": "6px",
    "border-radius-medium": "12px",
    "border-radius-large": "16px",
    "border-radius-pill": "9999px",
    
    // ═══════════════════════════════════════════════════════════════════════
    // TYPOGRAPHY
    // ═══════════════════════════════════════════════════════════════════════
    "font-interface": "",
    "font-text": "",
    "font-mono": "Fira Code, monospace",
    
    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE PACK
    // ═══════════════════════════════════════════════════════════════════════
    "bar-sprite": "",
    "bar-sprite-width": 34,
    "bar-sprite-height": 21,
    "bar-track-bg": "",
    "bar-fill-gradient": "linear-gradient(90deg, #7c3aed, #a78bfa)",
    "bar-border-radius": "6px",
    "bar-height": "14px",
    
    "toggle-sprite": "",
    "toggle-sprite-width": 50,
    "toggle-sprite-height": 40,
    "toggle-idle-bg": "",
    "toggle-hover-bg": "",
    "toggle-active-bg": "",
    
    // ═══════════════════════════════════════════════════════════════════════
    // LABELS
    // ═══════════════════════════════════════════════════════════════════════
    "label-active": "Active",
    "label-inactive": "Inactive",
    "label-active-sub": "Enabled",
    "label-inactive-sub": "Disabled",
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUTTONS
    // ═══════════════════════════════════════════════════════════════════════
    "button-idle-bg": "#7c3aed",
    "button-hover-bg": "#8b5cf6",
    "button-active-bg": "#6d28d9",
    "button-text-color": "#ffffff",
    "button-border-radius": "8px",
    "button-padding": "10px 20px",
    
    // ═══════════════════════════════════════════════════════════════════════
    // CARDS
    // ═══════════════════════════════════════════════════════════════════════
    "card-bg-color": "#2a2a3e",
    "card-border": "1px solid rgba(255,255,255,0.1)",
    "card-border-radius": "12px",
    "card-shadow": "0 4px 15px rgba(0,0,0,0.2)",
    "card-padding": "16px",
    
    // ═══════════════════════════════════════════════════════════════════════
    // INPUTS
    // ═══════════════════════════════════════════════════════════════════════
    "input-bg": "rgba(255,255,255,0.05)",
    "input-border": "1px solid rgba(255,255,255,0.2)",
    "input-border-focus": "1px solid #7c3aed",
    "input-border-radius": "6px",
    "input-text-color": "#ffffff",
    
    // ═══════════════════════════════════════════════════════════════════════
    // CHIPS
    // ═══════════════════════════════════════════════════════════════════════
    "chip-bg": "rgba(255,255,255,0.05)",
    "chip-bg-active": "rgba(255,255,255,0.15)",
    "chip-border-radius": "20px",
    
    // ═══════════════════════════════════════════════════════════════════════
    // CHARTS (defaults derived from extended colors if not set)
    // ═══════════════════════════════════════════════════════════════════════
    "chart-color-1": "",  // Falls back to color-purple
    "chart-color-2": "",  // Falls back to color-orange
    "chart-color-3": "",  // Falls back to color-green
    "chart-color-4": "",  // Falls back to color-red
    "chart-color-5": "",  // Falls back to color-blue
    "chart-color-6": "",  // Falls back to color-pink
    "heatmap-empty": "rgba(255,255,255,0.1)",
    "heatmap-filled": "",  // Falls back to color-purple
    
    // ═══════════════════════════════════════════════════════════════════════
    // EMOJI ICONS
    // ═══════════════════════════════════════════════════════════════════════
    "icon-style": "emoji",
    "icon-water": "",
    "icon-sleep": "",
    "icon-exercise": "",
    "icon-mood": "",
    "icon-food": "",
    "icon-journal": "",
    
    // ═══════════════════════════════════════════════════════════════════════
    // HR/DIVIDER SVG
    // ═══════════════════════════════════════════════════════════════════════
    "hr-svg": "",
    "hr-color": "#7c3aed",
    
    // ═══════════════════════════════════════════════════════════════════════
    // OBSIDIAN SYNC
    // ═══════════════════════════════════════════════════════════════════════
    "obsidian-accent-color": "#7c3aed",
    "sync-to-obsidian": true,
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────────────────────────────────────

let themeCache = new Map();
let colorOverrideCache = new Map();
let availableThemesCache = null;
let availableColorSchemesCache = null;

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MAPPING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect if Obsidian is in dark mode
 * @returns {boolean} True if dark mode, false if light mode
 */
function isDarkMode() {
    return document.body.classList.contains('theme-dark');
}

/**
 * Map Style Settings JSON to widget properties
 * Automatically detects light/dark mode and uses appropriate mappings
 * @param {object} styleSettings - The Style Settings JSON object
 * @returns {object} - Mapped widget properties
 */
function mapStyleSettingsToWidgetProps(styleSettings) {
    const mapped = {};
    const darkMode = isDarkMode();
    const currentModeSuffix = darkMode ? '@@dark' : '@@light';
    const oppositeModeSuffix = darkMode ? '@@light' : '@@dark';
    
    for (const [ssKey, widgetKey] of Object.entries(STYLE_SETTINGS_MAP)) {
        // Check if this is a mode-specific key
        const isDarkKey = ssKey.includes('@@dark');
        const isLightKey = ssKey.includes('@@light');
        
        if (isDarkKey || isLightKey) {
            // Only process keys matching current mode
            if (ssKey.endsWith(currentModeSuffix)) {
                if (styleSettings[ssKey]) {
                    mapped[widgetKey] = styleSettings[ssKey];
                }
                // Fallback: if current mode key doesn't exist, try opposite mode
                else if (styleSettings[ssKey.replace(currentModeSuffix, oppositeModeSuffix)]) {
                    mapped[widgetKey] = styleSettings[ssKey.replace(currentModeSuffix, oppositeModeSuffix)];
                }
            }
        } else {
            // Non-mode-specific keys (rare, but handle them)
            if (styleSettings[ssKey]) {
                mapped[widgetKey] = styleSettings[ssKey];
            }
        }
    }
    
    return mapped;
}

/**
 * Derive chart colors from extended colors if not explicitly set
 * @param {object} theme - Theme object to enhance
 * @returns {object} - Enhanced theme with chart colors
 */
function deriveChartColors(theme) {
    // Chart colors fall back to extended colors
    if (!theme["chart-color-1"]) theme["chart-color-1"] = theme["color-purple"] || "#8b5cf6";
    if (!theme["chart-color-2"]) theme["chart-color-2"] = theme["color-orange"] || "#f59e0b";
    if (!theme["chart-color-3"]) theme["chart-color-3"] = theme["color-green"] || "#10b981";
    if (!theme["chart-color-4"]) theme["chart-color-4"] = theme["color-red"] || "#ef4444";
    if (!theme["chart-color-5"]) theme["chart-color-5"] = theme["color-blue"] || "#3b82f6";
    if (!theme["chart-color-6"]) theme["chart-color-6"] = theme["color-pink"] || "#ec4899";
    
    // Heatmap falls back to purple
    if (!theme["heatmap-filled"]) theme["heatmap-filled"] = theme["color-purple"] || "#8b5cf6";
    
    return theme;
}

/**
 * Derive semantic colors from extended colors if not explicitly set
 * @param {object} theme - Theme object to enhance
 * @returns {object} - Enhanced theme with semantic colors
 */
function deriveSemanticColors(theme) {
    // Semantic colors fall back to extended colors
    if (!theme["color-success"]) theme["color-success"] = theme["color-green"] || "#10b981";
    if (!theme["color-warning"]) theme["color-warning"] = theme["color-orange"] || "#f59e0b";
    if (!theme["color-error"]) theme["color-error"] = theme["color-red"] || "#ef4444";
    
    return theme;
}

/**
 * Derive glow colors from accent colors if not explicitly set
 * @param {object} theme - Theme object to enhance
 * @returns {object} - Enhanced theme with derived colors
 */
function deriveGlowColors(theme) {
    const accent = theme["color-accent"] || "#7c3aed";
    const accentHover = theme["color-accent-hover"] || "#8b5cf6";
    
    // Derive glow colors from accent
    if (!theme["glow-color-active"]) {
        theme["glow-color-active"] = hexToRgba(accent, 0.4);
    }
    if (!theme["glow-color-hover"]) {
        theme["glow-color-hover"] = hexToRgba(accentHover, 0.25);
    }
    
    // Derive text color based on background luminance
    if (!theme["color-text"]) {
        theme["color-text"] = isLightColor(theme["color-background"]) ? "#1e1e1e" : "#ffffff";
    }
    if (!theme["color-text-muted"]) {
        theme["color-text-muted"] = hexToRgba(theme["color-text"], 0.6);
    }
    if (!theme["color-text-faint"]) {
        theme["color-text-faint"] = hexToRgba(theme["color-text"], 0.4);
    }
    
    // Derive link colors from accent if not set
    if (!theme["color-link"]) theme["color-link"] = theme["color-accent"];
    if (!theme["color-link-hover"]) theme["color-link-hover"] = theme["color-accent-hover"];
    
    // Derive icon colors from accent if not set
    if (!theme["color-icon"]) theme["color-icon"] = theme["color-accent"];
    if (!theme["color-icon-hover"]) theme["color-icon-hover"] = theme["color-accent-hover"];
    if (!theme["color-icon-active"]) theme["color-icon-active"] = theme["color-accent-active"] || theme["color-accent"];
    
    // Derive graph colors if not set
    if (!theme["color-graph-node"]) theme["color-graph-node"] = theme["color-accent"];
    if (!theme["color-graph-node-active"]) theme["color-graph-node-active"] = theme["color-orange"] || "#f59e0b";
    if (!theme["color-graph-node-tag"]) theme["color-graph-node-tag"] = theme["color-green"] || "#10b981";
    
    // Derive border-active from accent if not set
    if (!theme["color-border-active"]) theme["color-border-active"] = theme["color-accent"];
    
    // Derive divider from accent if not set
    if (!theme["color-divider"]) theme["color-divider"] = theme["color-accent"];
    
    // Chain other derivation functions
    theme = deriveSemanticColors(theme);
    theme = deriveChartColors(theme);
    
    return theme;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE LOADING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a color override JSON file
 */
async function loadColorOverride(colorSchemeName) {
    if (!colorSchemeName) return null;
    
    // Check cache
    if (colorOverrideCache.has(colorSchemeName)) {
        return colorOverrideCache.get(colorSchemeName);
    }
    
    try {
        const filePath = `System/Themes/style-settings-${colorSchemeName}.json`;
        const file = app.vault.getAbstractFileByPath(filePath);
        if (file) {
            const content = await app.vault.read(file);
            const json = JSON.parse(content);
            colorOverrideCache.set(colorSchemeName, json);
            return json;
        }
    } catch (e) {
        console.warn(`Failed to load color override: ${colorSchemeName}`, e);
    }
    return null;
}

/**
 * Get list of available color schemes (JSON files)
 */
function useAvailableColorSchemes() {
    const [schemes, setSchemes] = dc.useState([]);
    const [isLoading, setIsLoading] = dc.useState(true);
    
    dc.useEffect(() => {
        const scan = async () => {
            if (availableColorSchemesCache) {
                setSchemes(availableColorSchemesCache);
                setIsLoading(false);
                return;
            }
            
            try {
                const files = app.vault.getFiles();
                const jsonFiles = files.filter(f => 
                    f.path.startsWith("System/Themes/style-settings-") && 
                    f.extension === "json"
                );
                
                const schemeList = jsonFiles.map(f => {
                    // Extract name: style-settings-violetViper.json -> violetViper
                    const name = f.basename.replace("style-settings-", "");
                    return { name, path: f.path };
                });
                
                availableColorSchemesCache = schemeList;
                setSchemes(schemeList);
            } catch (e) {
                console.error("Failed to scan color schemes:", e);
            }
            setIsLoading(false);
        };
        
        scan();
    }, []);
    
    return { schemes, isLoading };
}

/**
 * Scan for available theme files (*.md in System/Themes/)
 */
function useAvailableThemes() {
    const [themes, setThemes] = dc.useState([]);
    const [isLoading, setIsLoading] = dc.useState(true);
    
    dc.useEffect(() => {
        const scanThemes = async () => {
            if (availableThemesCache) {
                setThemes(availableThemesCache);
                setIsLoading(false);
                return;
            }
            
            try {
                const files = app.vault.getMarkdownFiles();
                const themeFiles = files.filter(f => 
                    f.path.startsWith("System/Themes/") && 
                    !f.name.startsWith("_") &&
                    f.extension === "md"
                );
                
                const themeList = [];
                for (const file of themeFiles) {
                    const cache = app.metadataCache.getFileCache(file);
                    const fm = cache?.frontmatter;
                    if (fm?.["theme-id"]) {
                        themeList.push({
                            id: fm["theme-id"],
                            name: fm["theme-name"] || fm["theme-id"],
                            description: fm["theme-description"] || "",
                            path: file.path,
                            hasSprite: !!(fm["bar-sprite"] || fm["toggle-sprite"])
                        });
                    }
                }
                
                availableThemesCache = themeList;
                setThemes(themeList);
            } catch (e) {
                console.error("Failed to scan themes:", e);
            }
            setIsLoading(false);
        };
        
        scanThemes();
    }, []);
    
    return { themes, isLoading };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN THEME HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main hook - loads active theme + optional color override
 */
function useTheme() {
    const [theme, setTheme] = dc.useState(DEFAULT_THEME);
    const [isLoading, setIsLoading] = dc.useState(true);
    const [themeName, setThemeName] = dc.useState("default");
    const [colorOverrideName, setColorOverrideName] = dc.useState("");
    const [settings, setSettings] = dc.useState({
        widgetBackgrounds: true,
        flashyMode: true,
    });
    
    dc.useEffect(() => {
        const loadTheme = async () => {
            try {
                // 1. Get settings from Settings.md
                const settingsFile = app.metadataCache.getFirstLinkpathDest("System/Settings.md", "");
                if (!settingsFile) {
                    console.warn("Settings.md not found, using default theme");
                    setIsLoading(false);
                    return;
                }
                
                const settingsCache = app.metadataCache.getFileCache(settingsFile);
                const activeThemeId = settingsCache?.frontmatter?.["widget-theme"] || "nyanCat";
                const colorOverride = settingsCache?.frontmatter?.["color-override"] || "";
                const widgetBackgrounds = settingsCache?.frontmatter?.["widget-backgrounds"] !== false;
                const flashyMode = settingsCache?.frontmatter?.["flashy-mode"] !== false;
                
                setThemeName(activeThemeId);
                setColorOverrideName(colorOverride);
                setSettings({ widgetBackgrounds, flashyMode });
                
                // 2. Create cache key
                const cacheKey = `${activeThemeId}:${colorOverride}`;
                if (themeCache.has(cacheKey)) {
                    setTheme(themeCache.get(cacheKey));
                    setIsLoading(false);
                    return;
                }
                
                // 3. Load base theme file
                const themeFile = app.vault.getMarkdownFiles().find(f => {
                    if (!f.path.startsWith("System/Themes/")) return false;
                    const cache = app.metadataCache.getFileCache(f);
                    return cache?.frontmatter?.["theme-id"] === activeThemeId;
                });
                
                let themeData = { ...DEFAULT_THEME };
                
                if (themeFile) {
                    const cache = app.metadataCache.getFileCache(themeFile);
                    const fm = cache?.frontmatter || {};
                    
                    // Merge frontmatter into theme
                    themeData = { ...DEFAULT_THEME, ...fm };
                    
                    // If theme has style-settings embedded, map them
                    if (fm["style-settings"] && typeof fm["style-settings"] === "object") {
                        const mapped = mapStyleSettingsToWidgetProps(fm["style-settings"]);
                        themeData = { ...themeData, ...mapped };
                    }
                }
                
                // 4. Apply color override if set
                if (colorOverride) {
                    const overrideData = await loadColorOverride(colorOverride);
                    if (overrideData) {
                        const mapped = mapStyleSettingsToWidgetProps(overrideData);
                        themeData = { ...themeData, ...mapped };
                        // Also store the raw style-settings for sync
                        themeData["_styleSettingsOverride"] = overrideData;
                    }
                }
                
                // 5. Derive glow colors and text colors
                themeData = deriveGlowColors(themeData);
                
                // 6. Cache and set
                themeCache.set(cacheKey, themeData);
                injectCSSVariables(themeData);
                setTheme(themeData);
                
            } catch (e) {
                console.error("Theme loading failed:", e);
            }
            setIsLoading(false);
        };
        
        loadTheme();
    }, []);
    
    return { theme, isLoading, themeName, colorOverrideName, settings };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS VARIABLE INJECTION
// ─────────────────────────────────────────────────────────────────────────────

function injectCSSVariables(theme) {
    const root = document.documentElement;
    
    // ═══════════════════════════════════════════════════════════════════════
    // WIDGET THEME VARIABLES (--theme-*)
    // These are used by our Datacore widgets
    // ═══════════════════════════════════════════════════════════════════════
    
    // Background colors
    root.style.setProperty('--theme-background', theme["color-background"]);
    root.style.setProperty('--theme-surface', theme["color-surface"]);
    root.style.setProperty('--theme-surface-hover', theme["color-surface-hover"]);
    
    // Border colors
    root.style.setProperty('--theme-border', theme["color-border"]);
    root.style.setProperty('--theme-border-highlight', theme["color-border-highlight"]);
    root.style.setProperty('--theme-border-active', theme["color-border-active"]);
    
    // Accent colors
    root.style.setProperty('--theme-accent', theme["color-accent"]);
    root.style.setProperty('--theme-accent-hover', theme["color-accent-hover"]);
    root.style.setProperty('--theme-accent-active', theme["color-accent-active"]);
    root.style.setProperty('--theme-text-on-accent', theme["color-text-on-accent"]);
    
    // Text colors
    root.style.setProperty('--theme-text', theme["color-text"]);
    root.style.setProperty('--theme-text-muted', theme["color-text-muted"]);
    root.style.setProperty('--theme-text-faint', theme["color-text-faint"]);
    root.style.setProperty('--theme-selection-bg', theme["color-selection-bg"]);
    root.style.setProperty('--theme-highlight-bg', theme["color-highlight-bg"]);
    
    // Semantic colors
    root.style.setProperty('--theme-success', theme["color-success"]);
    root.style.setProperty('--theme-warning', theme["color-warning"]);
    root.style.setProperty('--theme-error', theme["color-error"]);
    
    // Extended colors
    root.style.setProperty('--theme-red', theme["color-red"]);
    root.style.setProperty('--theme-orange', theme["color-orange"]);
    root.style.setProperty('--theme-yellow', theme["color-yellow"]);
    root.style.setProperty('--theme-green', theme["color-green"]);
    root.style.setProperty('--theme-cyan', theme["color-cyan"]);
    root.style.setProperty('--theme-blue', theme["color-blue"]);
    root.style.setProperty('--theme-purple', theme["color-purple"]);
    root.style.setProperty('--theme-pink', theme["color-pink"]);
    
    // Icon colors
    root.style.setProperty('--theme-icon', theme["color-icon"]);
    root.style.setProperty('--theme-icon-hover', theme["color-icon-hover"]);
    root.style.setProperty('--theme-icon-active', theme["color-icon-active"]);
    
    // Link colors
    root.style.setProperty('--theme-link', theme["color-link"]);
    root.style.setProperty('--theme-link-hover', theme["color-link-hover"]);
    root.style.setProperty('--theme-link-external', theme["color-link-external"]);
    root.style.setProperty('--theme-link-external-hover', theme["color-link-external-hover"]);
    
    // Graph colors
    root.style.setProperty('--theme-graph-node', theme["color-graph-node"]);
    root.style.setProperty('--theme-graph-node-active', theme["color-graph-node-active"]);
    root.style.setProperty('--theme-graph-node-tag', theme["color-graph-node-tag"]);
    
    // UI element colors
    root.style.setProperty('--theme-divider', theme["color-divider"]);
    root.style.setProperty('--theme-line-number', theme["color-line-number"]);
    root.style.setProperty('--theme-gutter', theme["color-gutter"]);
    root.style.setProperty('--theme-active-line', theme["color-active-line"]);
    root.style.setProperty('--theme-tab', theme["color-tab"]);
    root.style.setProperty('--theme-tab-active', theme["color-tab-active"]);
    
    // Glow effects
    root.style.setProperty('--theme-glow-active', theme["glow-color-active"]);
    root.style.setProperty('--theme-glow-hover', theme["glow-color-hover"]);
    root.style.setProperty('--theme-glow-intensity', theme["glow-intensity"]);
    root.style.setProperty('--theme-glow-spread', theme["glow-spread"]);
    
    // Transitions
    root.style.setProperty('--theme-transition-duration', theme["transition-duration"]);
    root.style.setProperty('--theme-transition-easing', theme["transition-easing"]);
    
    // Border radius
    root.style.setProperty('--theme-radius-small', theme["border-radius-small"]);
    root.style.setProperty('--theme-radius-medium', theme["border-radius-medium"]);
    root.style.setProperty('--theme-radius-large', theme["border-radius-large"]);
    
    // Typography
    if (theme["font-interface"]) {
        root.style.setProperty('--theme-font-interface', theme["font-interface"]);
    }
    if (theme["font-text"]) {
        root.style.setProperty('--theme-font-text', theme["font-text"]);
    }
    root.style.setProperty('--theme-font-mono', theme["font-mono"]);
    
    // ═══════════════════════════════════════════════════════════════════════
    // MINIMAL-COMPATIBLE CSS VARIABLES
    // These allow CSS snippets and other Minimal integrations to work
    // ═══════════════════════════════════════════════════════════════════════
    
    // Background colors (Minimal: bg1, bg2, bg3)
    root.style.setProperty('--bg1', theme["color-background"]);
    root.style.setProperty('--bg2', theme["color-surface"]);
    root.style.setProperty('--bg3', theme["color-surface-hover"]);
    
    // Border colors (Minimal: ui1, ui2, ui3)
    root.style.setProperty('--ui1', theme["color-border"]);
    root.style.setProperty('--ui2', theme["color-border-highlight"]);
    root.style.setProperty('--ui3', theme["color-border-active"]);
    
    // Accent colors (Minimal: ax1, ax2, ax3, sp1)
    root.style.setProperty('--ax1', theme["color-accent"]);
    root.style.setProperty('--ax2', theme["color-accent-hover"]);
    root.style.setProperty('--ax3', theme["color-accent-active"]);
    root.style.setProperty('--sp1', theme["color-text-on-accent"]);
    
    // Text colors (Minimal: tx1, tx2, tx3, hl1, hl2)
    root.style.setProperty('--tx1', theme["color-text"]);
    root.style.setProperty('--tx2', theme["color-text-muted"]);
    root.style.setProperty('--tx3', theme["color-text-faint"]);
    root.style.setProperty('--hl1', theme["color-selection-bg"]);
    root.style.setProperty('--hl2', theme["color-highlight-bg"]);
    
    // Extended colors (Minimal rainbow palette)
    root.style.setProperty('--color-red', theme["color-red"]);
    root.style.setProperty('--color-orange', theme["color-orange"]);
    root.style.setProperty('--color-yellow', theme["color-yellow"]);
    root.style.setProperty('--color-green', theme["color-green"]);
    root.style.setProperty('--color-cyan', theme["color-cyan"]);
    root.style.setProperty('--color-blue', theme["color-blue"]);
    root.style.setProperty('--color-purple', theme["color-purple"]);
    root.style.setProperty('--color-pink', theme["color-pink"]);
    
    // Heading colors
    root.style.setProperty('--h1-color', theme["color-heading-1"]);
    root.style.setProperty('--h2-color', theme["color-heading-2"]);
    root.style.setProperty('--h3-color', theme["color-heading-3"]);
    root.style.setProperty('--h4-color', theme["color-heading-4"]);
    root.style.setProperty('--h5-color', theme["color-heading-5"]);
    root.style.setProperty('--h6-color', theme["color-heading-6"]);
    
    // Icon colors
    root.style.setProperty('--icon-color', theme["color-icon"]);
    root.style.setProperty('--icon-color-hover', theme["color-icon-hover"]);
    root.style.setProperty('--icon-color-active', theme["color-icon-active"]);
    
    // Link colors
    root.style.setProperty('--link-color', theme["color-link"]);
    root.style.setProperty('--link-color-hover', theme["color-link-hover"]);
    root.style.setProperty('--link-external-color', theme["color-link-external"]);
    root.style.setProperty('--link-external-color-hover', theme["color-link-external-hover"]);
    
    // Graph colors
    root.style.setProperty('--graph-node', theme["color-graph-node"]);
    root.style.setProperty('--graph-node-focused', theme["color-graph-node-active"]);
    root.style.setProperty('--graph-node-tag', theme["color-graph-node-tag"]);
}

// ─────────────────────────────────────────────────────────────────────────────
// OBSIDIAN SYNC FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync theme colors to Obsidian appearance.json (accent color)
 */
async function syncToAppearance(accentColor) {
    try {
        const path = ".obsidian/appearance.json";
        const content = await app.vault.adapter.read(path);
        const json = JSON.parse(content);
        
        json.accentColor = accentColor;
        
        await app.vault.adapter.write(path, JSON.stringify(json, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to sync to appearance.json:", e);
        return false;
    }
}

/**
 * Sync theme colors to Style Settings plugin
 */
async function syncToStyleSettings(styleSettingsData) {
    try {
        const path = ".obsidian/plugins/obsidian-style-settings/data.json";
        let existing = {};

        // Try to read existing file, create empty object if it doesn't exist
        try {
            const content = await app.vault.adapter.read(path);
            existing = JSON.parse(content);
        } catch (readError) {
            // File doesn't exist yet, start with empty object
            console.log("Style Settings data.json doesn't exist, creating new file");
        }

        // Merge our values (override existing)
        const merged = { ...existing, ...styleSettingsData };

        await app.vault.adapter.write(path, JSON.stringify(merged, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to sync to Style Settings:", e);
        return false;
    }
}

/**
 * Sync to Minimal Settings plugin (optional overrides)
 */
async function syncToMinimalSettings(minimalSettingsData) {
    try {
        const path = ".obsidian/plugins/obsidian-minimal-settings/data.json";
        let existing = {};

        // Try to read existing file, create empty object if it doesn't exist
        try {
            const content = await app.vault.adapter.read(path);
            existing = JSON.parse(content);
        } catch (readError) {
            // File doesn't exist yet, start with empty object
            console.log("Minimal Settings data.json doesn't exist, creating new file");
        }

        const merged = { ...existing, ...minimalSettingsData };

        await app.vault.adapter.write(path, JSON.stringify(merged, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to sync to Minimal Settings:", e);
        return false;
    }
}

/**
 * Full sync - syncs to all Obsidian config files
 */
async function syncThemeToObsidian(theme) {
    const results = { appearance: false, styleSettings: false, minimalSettings: false };
    
    // 1. Sync accent color
    if (theme["obsidian-accent-color"]) {
        results.appearance = await syncToAppearance(theme["obsidian-accent-color"]);
    }
    
    // 2. Sync Style Settings
    // Use override data if present, otherwise use embedded style-settings
    const styleSettingsData = theme["_styleSettingsOverride"] || theme["style-settings"];
    if (styleSettingsData && typeof styleSettingsData === "object") {
        results.styleSettings = await syncToStyleSettings(styleSettingsData);
    }
    
    // 3. Sync Minimal Settings (if present)
    if (theme["minimal-settings"] && typeof theme["minimal-settings"] === "object") {
        results.minimalSettings = await syncToMinimalSettings(theme["minimal-settings"]);
    }
    
    return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME SWITCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clear all caches
 */
function clearThemeCache() {
    themeCache.clear();
    colorOverrideCache.clear();
    availableThemesCache = null;
    availableColorSchemesCache = null;
}

/**
 * Switch theme and optionally set color override
 * @param {string} themeId - The theme ID to switch to
 * @param {string} colorOverride - Optional color scheme name (from JSON files)
 * @param {boolean} syncToObsidian - Whether to sync to Obsidian config files
 */
async function switchTheme(themeId, colorOverride = "", syncToObsidian = true) {
    try {
        // 1. Update Settings.md
        const settingsFile = app.vault.getAbstractFileByPath("System/Settings.md");
        if (!settingsFile) {
            new Notice("Settings.md not found!");
            return false;
        }
        
        await app.fileManager.processFrontMatter(settingsFile, (fm) => {
            fm["widget-theme"] = themeId;
            fm["color-override"] = colorOverride;
        });
        
        // 2. Clear cache
        clearThemeCache();
        
        // 3. Load the new theme to get sync data
        if (syncToObsidian) {
            // Load theme file
            const themeFile = app.vault.getMarkdownFiles().find(f => {
                if (!f.path.startsWith("System/Themes/")) return false;
                const cache = app.metadataCache.getFileCache(f);
                return cache?.frontmatter?.["theme-id"] === themeId;
            });
            
            let themeData = { ...DEFAULT_THEME };
            
            if (themeFile) {
                const cache = app.metadataCache.getFileCache(themeFile);
                themeData = { ...DEFAULT_THEME, ...cache?.frontmatter };
            }
            
            // Apply color override if set
            if (colorOverride) {
                const overrideData = await loadColorOverride(colorOverride);
                if (overrideData) {
                    themeData["_styleSettingsOverride"] = overrideData;
                    // Also set obsidian accent from override
                    if (overrideData["minimal-style@@ui3@@dark"]) {
                        themeData["obsidian-accent-color"] = overrideData["minimal-style@@ui3@@dark"];
                    }
                }
            }
            
            // Sync to Obsidian
            const syncResults = await syncThemeToObsidian(themeData);
            console.log("Theme sync results:", syncResults);
        }
        
        new Notice(`Theme switched to: ${themeId}${colorOverride ? ` + ${colorOverride}` : ""}`);
        
        // 4. Reload to apply all changes
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
        return true;
        
    } catch (e) {
        console.error("Failed to switch theme:", e);
        new Notice("Failed to switch theme");
        return false;
    }
}

/**
 * Set just the color override without changing sprite pack
 */
async function setColorOverride(colorOverride, syncToObsidian = true) {
    try {
        const settingsFile = app.vault.getAbstractFileByPath("System/Settings.md");
        if (!settingsFile) return false;
        
        // Get current theme
        const cache = app.metadataCache.getFileCache(settingsFile);
        const currentTheme = cache?.frontmatter?.["widget-theme"] || "nyanCat";
        
        // Use switchTheme to handle the rest
        return await switchTheme(currentTheme, colorOverride, syncToObsidian);
        
    } catch (e) {
        console.error("Failed to set color override:", e);
        return false;
    }
}

/**
 * Apply current theme settings from Settings.md
 * Call this after manually editing Settings.md to sync to Obsidian
 */
async function applyCurrentTheme() {
    try {
        const settingsFile = app.vault.getAbstractFileByPath("System/Settings.md");
        if (!settingsFile) {
            new Notice("Settings.md not found!");
            return false;
        }
        
        const cache = app.metadataCache.getFileCache(settingsFile);
        const fm = cache?.frontmatter;
        
        const themeId = fm?.["widget-theme"] || "nyanCat";
        const colorOverride = fm?.["color-override"] || "";
        const shouldSync = fm?.["sync-to-obsidian"] !== false;
        
        new Notice(`Applying theme: ${themeId}${colorOverride ? ` + ${colorOverride}` : ""}...`);
        
        // Clear cache first
        clearThemeCache();
        
        if (shouldSync) {
            // Load theme data
            const themeFile = app.vault.getMarkdownFiles().find(f => {
                if (!f.path.startsWith("System/Themes/")) return false;
                const c = app.metadataCache.getFileCache(f);
                return c?.frontmatter?.["theme-id"] === themeId;
            });
            
            let themeData = { ...DEFAULT_THEME };
            
            if (themeFile) {
                const c = app.metadataCache.getFileCache(themeFile);
                themeData = { ...DEFAULT_THEME, ...c?.frontmatter };
            }
            
            // Apply color override if set
            if (colorOverride) {
                const overrideData = await loadColorOverride(colorOverride);
                if (overrideData) {
                    // Store the full JSON for sync
                    themeData["_styleSettingsOverride"] = overrideData;
                    // Also update accent color from the override
                    if (overrideData["minimal-style@@ui3@@dark"]) {
                        themeData["obsidian-accent-color"] = overrideData["minimal-style@@ui3@@dark"];
                    }
                } else {
                    new Notice(`Color scheme "${colorOverride}" not found!`);
                }
            }
            
            // Sync to Obsidian
            const results = await syncThemeToObsidian(themeData);
            console.log("Theme sync results:", results);
            
            if (results.styleSettings) {
                new Notice("Theme applied! Reloading...");
                setTimeout(() => window.location.reload(), 500);
            } else {
                new Notice("Theme applied but Style Settings sync failed");
            }
        }
        
        return true;
        
    } catch (e) {
        console.error("Failed to apply theme:", e);
        new Notice("Failed to apply theme: " + e.message);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME OVERRIDE SYSTEM
// Allows temporarily overriding the theme for preview purposes
// Uses a module-level variable approach since dc.React.createContext is not available
// ─────────────────────────────────────────────────────────────────────────────

// Module-level override storage (simpler than React Context for Datacore)
let themeOverrideStack = [];

/**
 * Set a theme override (push onto stack)
 * @param {object} theme - The theme object to use
 * @returns {function} - Cleanup function to remove the override
 */
function setThemeOverride(theme) {
    const processedTheme = theme ? deriveGlowColors({ ...DEFAULT_THEME, ...theme }) : null;
    themeOverrideStack.push(processedTheme);
    
    // Return cleanup function
    return () => {
        const index = themeOverrideStack.indexOf(processedTheme);
        if (index > -1) {
            themeOverrideStack.splice(index, 1);
        }
    };
}

/**
 * Get current theme override (top of stack)
 */
function getThemeOverride() {
    return themeOverrideStack.length > 0 ? themeOverrideStack[themeOverrideStack.length - 1] : null;
}

/**
 * Clear all theme overrides
 */
function clearThemeOverrides() {
    themeOverrideStack = [];
}

/**
 * Provider component that sets a theme override for its children
 * Note: Due to Datacore limitations, this uses module-level state
 * @param {object} theme - The theme object to use (from loadThemeFromPath)
 * @param {React.ReactNode} children - Child components
 */
function ThemeOverrideProvider({ theme, children }) {
    dc.useEffect(() => {
        const cleanup = setThemeOverride(theme);
        return cleanup;
    }, [theme]);
    
    return children;
}

/**
 * Hook to get the current theme, respecting overrides
 * Use this instead of useTheme() in components that need override support
 */
function useThemeWithOverride() {
    const override = getThemeOverride();
    const { theme, isLoading, themeName, colorOverrideName } = useTheme();
    
    // If we have an override, use it; otherwise use the global theme
    if (override) {
        return { 
            theme: override, 
            isLoading: false, 
            themeName: override["theme-id"] || "preview",
            colorOverrideName: "",
            isOverride: true 
        };
    }
    
    return { theme, isLoading, themeName, colorOverrideName, isOverride: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME LOADING UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a theme's frontmatter from a file path
 * Useful for preview/editor purposes
 * @param {string} path - Path to the theme file (e.g., "System/Themes/nyanCat.md")
 * @returns {Promise<object>} - The theme data with defaults applied
 */
async function loadThemeFromPath(path) {
    try {
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) {
            console.warn(`Theme file not found: ${path}`);
            return { ...DEFAULT_THEME };
        }
        
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter || {};
        
        // Merge with defaults and derive colors
        let themeData = { ...DEFAULT_THEME, ...fm };
        
        // If theme has style-settings embedded, map them
        if (fm["style-settings"] && typeof fm["style-settings"] === "object") {
            const mapped = mapStyleSettingsToWidgetProps(fm["style-settings"]);
            themeData = { ...themeData, ...mapped };
        }
        
        // Derive glow colors
        themeData = deriveGlowColors(themeData);
        
        return themeData;
    } catch (e) {
        console.error(`Failed to load theme from ${path}:`, e);
        return { ...DEFAULT_THEME };
    }
}

/**
 * Load a theme by its ID
 * @param {string} themeId - The theme-id to find and load
 * @returns {Promise<object>} - The theme data with defaults applied
 */
async function loadThemeById(themeId) {
    try {
        // Find the theme file by ID
        const themeFile = app.vault.getMarkdownFiles().find(f => {
            if (!f.path.startsWith("System/Themes/")) return false;
            const cache = app.metadataCache.getFileCache(f);
            return cache?.frontmatter?.["theme-id"] === themeId;
        });
        
        if (!themeFile) {
            console.warn(`Theme not found with ID: ${themeId}`);
            return { ...DEFAULT_THEME };
        }
        
        return await loadThemeFromPath(themeFile.path);
    } catch (e) {
        console.error(`Failed to load theme by ID ${themeId}:`, e);
        return { ...DEFAULT_THEME };
    }
}

/**
 * Get theme metadata (id, name, description, path) without loading full theme
 * @param {string} path - Path to the theme file
 * @returns {object|null} - Theme metadata or null
 */
function getThemeMetadata(path) {
    try {
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) return null;
        
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter;
        
        if (!fm?.["theme-id"]) return null;
        
        return {
            id: fm["theme-id"],
            name: fm["theme-name"] || fm["theme-id"],
            description: fm["theme-description"] || "",
            path: path,
            hasSprite: !!(fm["bar-sprite"] || fm["toggle-sprite"]),
            version: fm["theme-version"] || "1.0",
            author: fm["theme-author"] || ""
        };
    } catch (e) {
        console.warn(`Failed to get metadata for ${path}:`, e);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

return { 
    // Hooks
    useTheme, 
    useThemeWithOverride,
    useAvailableThemes,
    useAvailableColorSchemes,
    
    // Components
    ThemeOverrideProvider,
    
    // Theme override utilities
    setThemeOverride,
    getThemeOverride,
    clearThemeOverrides,
    
    // Actions
    switchTheme,
    setColorOverride,
    applyCurrentTheme,
    clearThemeCache,
    
    // Theme loading utilities
    loadThemeFromPath,
    loadThemeById,
    getThemeMetadata,
    loadColorOverride,
    
    // Sync functions
    syncThemeToObsidian,
    syncToAppearance,
    syncToStyleSettings,
    syncToMinimalSettings,
    
    // Utilities
    hexToRgba,
    isLightColor,
    isDarkMode,
    mapStyleSettingsToWidgetProps,
    deriveGlowColors,
    deriveChartColors,
    deriveSemanticColors,
    
    // Constants
    DEFAULT_THEME,
    STYLE_SETTINGS_MAP
};
