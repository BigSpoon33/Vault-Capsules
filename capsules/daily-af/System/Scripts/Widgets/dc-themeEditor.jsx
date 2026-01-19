// ═══════════════════════════════════════════════════════════════════════════════
// THEME EDITOR v2.0
// Visual theme editor with live preview and save functionality
// 
// Features:
//   • Edit all theme properties with appropriate UI controls
//   • Color pickers for colors
//   • Gradient builder for gradients
//   • File upload for sprites (base64)
//   • Dropdowns for animation types
//   • Sliders for numeric values
//   • Live preview of ALL components (shared with Dashboard)
//   • Mobile-first responsive layout (640px breakpoint)
//   • Collapsible sticky preview
//   • Save to new file or update existing
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { 
    useTheme, 
    useAvailableThemes,
    loadThemeById,
    loadThemeFromPath,
    deriveGlowColors,
    DEFAULT_THEME,
} = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));

const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);
const { ColorPicker } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-colorPicker.jsx")
);
const { GradientBuilder } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gradientBuilder.jsx")
);
const { BackgroundPicker } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-backgroundPicker.jsx")
);

// Import shared preview components
const { ThemePreviewContent } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-themePreviewContent.jsx")
);
const { StickyPreview } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-stickyPreview.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE CSS INJECTION
// ─────────────────────────────────────────────────────────────────────────────

function useResponsiveEditorCSS() {
    dc.useEffect(() => {
        const styleId = "dc-theme-editor-responsive-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                /* ═══════════════════════════════════════════════════════════════════
                   THEME EDITOR RESPONSIVE STYLES
                   Mobile-first with 640px breakpoint
                   ═══════════════════════════════════════════════════════════════════ */

                .dc-theme-editor-main {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    flex: 1;
                    min-height: 0;
                }

                .dc-theme-editor-preview-wrapper {
                    order: 1;
                }

                .dc-theme-editor-content-wrapper {
                    order: 2;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .dc-theme-editor-column {
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .dc-theme-editor-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0;
                }

                /* Desktop: Two-column layout with preview on right */
                @media (min-width: 641px) {
                    .dc-theme-editor-main {
                        display: grid;
                        grid-template-columns: 1fr 380px;
                        gap: 20px;
                    }

                    .dc-theme-editor-preview-wrapper {
                        order: 2;
                        position: relative;
                    }

                    .dc-theme-editor-content-wrapper {
                        order: 1;
                    }

                    .dc-theme-editor-preview-wrapper .dc-sticky-preview {
                        position: sticky;
                        top: 0;
                        max-height: calc(100vh - 200px);
                        overflow: hidden;
                    }

                    .dc-theme-editor-preview-wrapper .dc-sticky-preview-content.expanded {
                        overflow-y: auto;
                        max-height: calc(100vh - 280px);
                    }
                }

                /* Mobile: Stack with preview on top */
                @media (max-width: 640px) {
                    .dc-theme-editor-container {
                        padding: 16px;
                    }

                    .dc-theme-editor-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }

                    .dc-theme-editor-selector {
                        width: 100%;
                    }

                    .dc-theme-editor-selector select {
                        width: 100%;
                    }

                    .dc-theme-editor-footer {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .dc-theme-editor-footer-left,
                    .dc-theme-editor-footer-right {
                        width: 100%;
                        justify-content: stretch;
                    }

                    .dc-theme-editor-footer button {
                        flex: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ANIMATION_OPTIONS = [
    { value: "none", label: "None" },
    { value: "squish", label: "Squish" },
    { value: "bounce", label: "Bounce" },
    { value: "spin", label: "Spin" },
    { value: "twist", label: "Twist" },
    { value: "jiggle", label: "Jiggle" },
    { value: "pulse", label: "Pulse" },
    { value: "wiggle", label: "Wiggle" },
    { value: "flip", label: "Flip" },
];

const BG_SIZE_OPTIONS = [
    { value: "auto", label: "Auto (Original Size)" },
    { value: "cover", label: "Cover (Fill & Crop)" },
    { value: "contain", label: "Contain (Fit Inside)" },
    { value: "100% 100%", label: "Stretch (100%)" },
    { value: "50%", label: "50%" },
];

const BG_REPEAT_OPTIONS = [
    { value: "repeat", label: "Tile (Repeat)" },
    { value: "no-repeat", label: "No Repeat" },
    { value: "repeat-x", label: "Repeat Horizontally" },
    { value: "repeat-y", label: "Repeat Vertically" },
];

const BG_POSITION_OPTIONS = [
    { value: "center", label: "Center" },
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "top left", label: "Top Left" },
    { value: "top right", label: "Top Right" },
    { value: "bottom left", label: "Bottom Left" },
    { value: "bottom right", label: "Bottom Right" },
];

const TRANSITION_DIRECTION_OPTIONS = [
    { value: "none", label: "None" },
    { value: "left", label: "Slide from Left" },
    { value: "right", label: "Slide from Right" },
    { value: "top", label: "Slide from Top" },
    { value: "bottom", label: "Slide from Bottom" },
];

const PROPERTY_SECTIONS = [
    {
        id: "metadata",
        title: "Theme Metadata",
        icon: "📝",
        properties: [
            { key: "theme-id", label: "Theme ID", type: "text", placeholder: "my-theme", required: true },
            { key: "theme-name", label: "Display Name", type: "text", placeholder: "My Awesome Theme" },
            { key: "theme-description", label: "Description", type: "textarea", placeholder: "A brief description..." },
            { key: "theme-author", label: "Author", type: "text", placeholder: "Your name" },
            { key: "theme-version", label: "Version", type: "text", placeholder: "1.0" },
        ]
    },
    {
        id: "colors",
        title: "Color Palette",
        icon: "🎨",
        properties: [
            { key: "color-primary", label: "Primary", type: "color" },
            { key: "color-secondary", label: "Secondary", type: "color" },
            { key: "color-accent", label: "Accent", type: "color" },
            { key: "color-success", label: "Success", type: "color" },
            { key: "color-warning", label: "Warning", type: "color" },
            { key: "color-error", label: "Error", type: "color" },
            { key: "color-background", label: "Background", type: "color" },
            { key: "color-surface", label: "Surface", type: "color" },
            { key: "color-text", label: "Text", type: "color" },
            { key: "color-text-muted", label: "Text Muted", type: "color" },
        ]
    },
    {
        id: "progressbar",
        title: "Progress Bar",
        icon: "📊",
        properties: [
            { key: "bar-sprite", label: "Sprite (Base64/URL)", type: "image" },
            { key: "bar-sprite-width", label: "Sprite Width", type: "number", min: 10, max: 200, unit: "px" },
            { key: "bar-sprite-height", label: "Sprite Height", type: "number", min: 10, max: 200, unit: "px" },
            { key: "bar-sprite-click-animation", label: "Click Animation", type: "select", options: ANIMATION_OPTIONS },
            { key: "bar-fill-gradient", label: "Fill Background", type: "background" },
            { key: "bar-fill-bg-size", label: "Fill: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "bar-fill-bg-repeat", label: "Fill: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "bar-fill-bg-position", label: "Fill: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "bar-track-bg", label: "Track Background", type: "background" },
            { key: "bar-track-bg-size", label: "Track: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "bar-track-bg-repeat", label: "Track: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "bar-track-bg-position", label: "Track: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "bar-transition-direction", label: "Hover Slide Direction", type: "select", options: TRANSITION_DIRECTION_OPTIONS },
            { key: "bar-height", label: "Bar Height", type: "text", placeholder: "14px" },
            { key: "bar-border-radius", label: "Border Radius", type: "text", placeholder: "6px" },
        ]
    },
    {
        id: "toggle",
        title: "Toggle",
        icon: "🔘",
        properties: [
            { key: "toggle-sprite", label: "Sprite (Base64/URL)", type: "image" },
            { key: "toggle-sprite-width", label: "Sprite Width", type: "number", min: 10, max: 200, unit: "px" },
            { key: "toggle-sprite-height", label: "Sprite Height", type: "number", min: 10, max: 200, unit: "px" },
            { key: "toggle-sprite-click-animation", label: "Click Animation", type: "select", options: ANIMATION_OPTIONS },
            { key: "toggle-idle-bg", label: "Idle Background", type: "background" },
            { key: "toggle-idle-bg-size", label: "Idle: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "toggle-idle-bg-repeat", label: "Idle: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "toggle-idle-bg-position", label: "Idle: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "toggle-hover-bg", label: "Hover Background", type: "background" },
            { key: "toggle-hover-bg-size", label: "Hover: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "toggle-hover-bg-repeat", label: "Hover: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "toggle-hover-bg-position", label: "Hover: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "toggle-active-bg", label: "Active Background", type: "background" },
            { key: "toggle-active-bg-size", label: "Active: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "toggle-active-bg-repeat", label: "Active: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "toggle-active-bg-position", label: "Active: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "toggle-transition-direction", label: "Hover Slide Direction", type: "select", options: TRANSITION_DIRECTION_OPTIONS },
            { key: "label-active", label: "Active Label", type: "text", placeholder: "ON" },
            { key: "label-inactive", label: "Inactive Label", type: "text", placeholder: "OFF" },
        ]
    },
    {
        id: "buttons",
        title: "Buttons",
        icon: "🔲",
        properties: [
            { key: "button-idle-bg", label: "Idle Background", type: "background" },
            { key: "button-idle-bg-size", label: "Idle: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "button-idle-bg-repeat", label: "Idle: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "button-idle-bg-position", label: "Idle: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "button-hover-bg", label: "Hover Background", type: "background" },
            { key: "button-hover-bg-size", label: "Hover: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "button-hover-bg-repeat", label: "Hover: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "button-hover-bg-position", label: "Hover: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "button-active-bg", label: "Active Background", type: "background" },
            { key: "button-active-bg-size", label: "Active: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "button-active-bg-repeat", label: "Active: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "button-active-bg-position", label: "Active: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "button-transition-direction", label: "Hover Slide Direction", type: "select", options: TRANSITION_DIRECTION_OPTIONS },
            { key: "button-text-color", label: "Text Color", type: "color" },
            { key: "button-sprite", label: "Sprite (Base64/URL)", type: "image" },
            { key: "button-sprite-width", label: "Sprite Width", type: "number", min: 10, max: 200, unit: "px" },
            { key: "button-sprite-height", label: "Sprite Height", type: "number", min: 10, max: 200, unit: "px" },
            { key: "button-sprite-click-animation", label: "Click Animation", type: "select", options: ANIMATION_OPTIONS },
        ]
    },
    {
        id: "inputs",
        title: "Inputs & Select",
        icon: "📝",
        properties: [
            { key: "input-bg", label: "Input Background", type: "background" },
            { key: "input-bg-size", label: "Input Idle: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "input-bg-repeat", label: "Input Idle: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "input-bg-position", label: "Input Idle: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "input-focus-bg-size", label: "Input Focus: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "input-focus-bg-repeat", label: "Input Focus: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "input-focus-bg-position", label: "Input Focus: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "input-transition-direction", label: "Input: Focus Slide Direction", type: "select", options: TRANSITION_DIRECTION_OPTIONS },
            { key: "input-border", label: "Input Border", type: "text", placeholder: "1px solid rgba(255,105,180,0.3)" },
            { key: "input-border-focus", label: "Input Focus Border", type: "text", placeholder: "1px solid #ff69b4" },
            { key: "input-border-radius", label: "Input Border Radius", type: "text", placeholder: "6px" },
            { key: "select-bg", label: "Select Background", type: "background" },
            { key: "select-bg-size", label: "Select Closed: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "select-bg-repeat", label: "Select Closed: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "select-bg-position", label: "Select Closed: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "select-open-bg-size", label: "Select Open: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "select-open-bg-repeat", label: "Select Open: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "select-open-bg-position", label: "Select Open: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "select-transition-direction", label: "Select: Open Slide Direction", type: "select", options: TRANSITION_DIRECTION_OPTIONS },
            { key: "select-border", label: "Select Border", type: "text", placeholder: "1px solid rgba(255,105,180,0.3)" },
            { key: "select-border-focus", label: "Select Open Border", type: "text", placeholder: "1px solid #ff69b4" },
        ]
    },
    {
        id: "cards",
        title: "Cards",
        icon: "🃏",
        properties: [
            { key: "card-bg-color", label: "Card Background", type: "background" },
            { key: "card-bg-size", label: "Card Idle: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "card-bg-repeat", label: "Card Idle: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "card-bg-position", label: "Card Idle: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "card-hover-bg-size", label: "Card Hover: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "card-hover-bg-repeat", label: "Card Hover: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "card-hover-bg-position", label: "Card Hover: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "card-transition-direction", label: "Card: Hover Slide Direction", type: "select", options: TRANSITION_DIRECTION_OPTIONS },
            { key: "card-border", label: "Card Border", type: "text", placeholder: "1px solid rgba(124,58,237,0.3)" },
            { key: "card-border-radius", label: "Card Border Radius", type: "text", placeholder: "12px" },
            { key: "card-shadow", label: "Card Shadow", type: "text", placeholder: "0 4px 15px rgba(0,0,0,0.2)" },
            { key: "card-padding", label: "Card Padding", type: "text", placeholder: "16px" },
            { key: "card-header-bg-size", label: "Header: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "card-header-bg-repeat", label: "Header: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "card-header-bg-position", label: "Header: Position", type: "select", options: BG_POSITION_OPTIONS },
            { key: "card-footer-bg-size", label: "Footer: Size", type: "select", options: BG_SIZE_OPTIONS },
            { key: "card-footer-bg-repeat", label: "Footer: Repeat", type: "select", options: BG_REPEAT_OPTIONS },
            { key: "card-footer-bg-position", label: "Footer: Position", type: "select", options: BG_POSITION_OPTIONS },
        ]
    },
    {
        id: "effects",
        title: "Effects & Transitions",
        icon: "✨",
        properties: [
            { key: "glow-enabled", label: "Glow Enabled", type: "boolean" },
            { key: "glow-intensity", label: "Glow Intensity", type: "text", placeholder: "15px" },
            { key: "transition-duration", label: "Transition Duration", type: "text", placeholder: "0.3s" },
            { key: "border-radius-small", label: "Border Radius (Small)", type: "text", placeholder: "6px" },
            { key: "border-radius-medium", label: "Border Radius (Medium)", type: "text", placeholder: "12px" },
            { key: "border-radius-large", label: "Border Radius (Large)", type: "text", placeholder: "16px" },
        ]
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: ThemeEditor
// ═══════════════════════════════════════════════════════════════════════════════

function ThemeEditor({ initialThemeId = null }) {
    const { theme: activeTheme, isLoading: themeLoading, themeName: activeThemeName } = useTheme();
    const { themes, isLoading: themesLoading } = useAvailableThemes();
    
    // Editor state
    const [editedTheme, setEditedTheme] = dc.useState({ ...DEFAULT_THEME });
    const [originalTheme, setOriginalTheme] = dc.useState(null);
    const [selectedThemeId, setSelectedThemeId] = dc.useState(initialThemeId || "");
    const [expandedSections, setExpandedSections] = dc.useState(["metadata", "colors"]);
    const [saving, setSaving] = dc.useState(false);
    const [hasChanges, setHasChanges] = dc.useState(false);
    const [previewCollapsed, setPreviewCollapsed] = dc.useState(false);
    
    // Load CSS
    useComponentCSS();
    useResponsiveEditorCSS();
    
    // Load theme when selection changes
    dc.useEffect(() => {
        const loadTheme = async () => {
            if (selectedThemeId) {
                const themeData = await loadThemeById(selectedThemeId);
                setEditedTheme({ ...DEFAULT_THEME, ...themeData });
                setOriginalTheme({ ...DEFAULT_THEME, ...themeData });
                setHasChanges(false);
            } else {
                // New theme - start with defaults
                setEditedTheme({ ...DEFAULT_THEME, "theme-id": "", "theme-name": "" });
                setOriginalTheme(null);
                setHasChanges(false);
            }
        };
        loadTheme();
    }, [selectedThemeId]);
    
    // Update property
    const updateProperty = (key, value) => {
        setEditedTheme(prev => {
            const updated = { ...prev, [key]: value };
            // Re-derive glow colors when colors change
            if (key.startsWith("color-")) {
                return deriveGlowColors(updated);
            }
            return updated;
        });
        setHasChanges(true);
    };
    
    // Toggle section expansion
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };
    
    // Handle image upload (convert to base64)
    const handleImageUpload = async (key) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                updateProperty(key, base64);
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    };
    
    // Save theme to file
    const saveTheme = async (saveAsNew = false) => {
        const themeId = editedTheme["theme-id"];
        if (!themeId) {
            new Notice("Please enter a Theme ID");
            return;
        }
        
        setSaving(true);
        
        try {
            // Build frontmatter
            const frontmatterLines = ["---"];
            
            // Add all properties
            for (const section of PROPERTY_SECTIONS) {
                frontmatterLines.push(`# ${section.title}`);
                for (const prop of section.properties) {
                    const value = editedTheme[prop.key];
                    if (value !== undefined && value !== null && value !== "") {
                        if (typeof value === "string" && (value.includes("\n") || value.includes(":"))) {
                            frontmatterLines.push(`${prop.key}: "${value.replace(/"/g, '\\"')}"`);
                        } else if (typeof value === "boolean") {
                            frontmatterLines.push(`${prop.key}: ${value}`);
                        } else if (typeof value === "number") {
                            frontmatterLines.push(`${prop.key}: ${value}`);
                        } else {
                            frontmatterLines.push(`${prop.key}: "${value}"`);
                        }
                    }
                }
                frontmatterLines.push("");
            }
            
            frontmatterLines.push("---");
            frontmatterLines.push("");
            frontmatterLines.push(`# ${editedTheme["theme-name"] || themeId}`);
            frontmatterLines.push("");
            frontmatterLines.push(editedTheme["theme-description"] || "Custom theme created with Theme Editor.");
            
            const content = frontmatterLines.join("\n");
            
            // Determine file path
            let filePath;
            if (saveAsNew || !originalTheme) {
                filePath = `System/Themes/${themeId}.md`;
            } else {
                // Find existing file
                const existingTheme = themes.find(t => t.id === originalTheme["theme-id"]);
                filePath = existingTheme?.path || `System/Themes/${themeId}.md`;
            }
            
            // Check if file exists
            const existingFile = app.vault.getAbstractFileByPath(filePath);
            
            if (existingFile && saveAsNew) {
                new Notice(`File already exists: ${filePath}`);
                setSaving(false);
                return;
            }
            
            if (existingFile) {
                // Update existing file
                await app.vault.modify(existingFile, content);
            } else {
                // Create new file
                await app.vault.create(filePath, content);
            }
            
            new Notice(`Theme saved to ${filePath}`);
            setOriginalTheme({ ...editedTheme });
            setHasChanges(false);
            
            // Update selection to the saved theme
            setSelectedThemeId(themeId);
            
        } catch (e) {
            console.error("Failed to save theme:", e);
            new Notice("Failed to save theme: " + e.message);
        }
        
        setSaving(false);
    };
    
    // Reset to original
    const resetChanges = () => {
        if (originalTheme) {
            setEditedTheme({ ...originalTheme });
        } else {
            setEditedTheme({ ...DEFAULT_THEME, "theme-id": "", "theme-name": "" });
        }
        setHasChanges(false);
    };
    
    // Loading state
    if (themeLoading || themesLoading) {
        return (
            <div style={styles.container} className="dc-theme-editor-container">
                <div style={styles.loading}>Loading...</div>
            </div>
        );
    }
    
    // Theme colors for editor UI
    const primary = editedTheme["color-primary"] || editedTheme["color-accent"] || "#7c3aed";
    const accent = editedTheme["color-accent"] || "#f59e0b";
    const surface = editedTheme["color-surface"] || "#2a2a3e";
    const background = editedTheme["color-background"] || "#1e1e2e";
    const text = editedTheme["color-text"] || "#ffffff";
    const textMuted = editedTheme["color-text-muted"] || "#a0a0b0";
    
    return (
        <div 
            style={{
                ...styles.container,
                background: background,
                color: text,
            }}
            className="dc-theme-editor-container"
        >
            {/* Header */}
            <div style={styles.header} className="dc-theme-editor-header">
                <div>
                    <h2 style={{ ...styles.title, color: primary }}>Theme Editor</h2>
                    <p style={{ ...styles.subtitle, color: textMuted }}>
                        Create and customize themes with live preview
                    </p>
                </div>
                <div style={styles.headerActions}>
                    {hasChanges && (
                        <span style={{ ...styles.unsavedBadge, background: "#f59e0b33", color: "#f59e0b" }}>
                            Unsaved changes
                        </span>
                    )}
                </div>
            </div>
            
            {/* Theme Selector */}
            <div style={styles.themeSelector} className="dc-theme-editor-selector">
                <label style={{ fontSize: 12, color: textMuted, marginRight: 8 }}>
                    Edit Theme:
                </label>
                <select
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                    style={{
                        ...styles.select,
                        background: surface,
                        color: text,
                        borderColor: primary + "44",
                    }}
                >
                    <option value="">+ New Theme</option>
                    {themes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>
            
            {/* Main Content - Responsive Grid */}
            <div className="dc-theme-editor-main">
                
                {/* Preview Column (top on mobile, right on desktop) */}
                <div className="dc-theme-editor-preview-wrapper">
                    <StickyPreview
                        title="Live Preview"
                        subtitle={editedTheme["theme-name"] || editedTheme["theme-id"] || "Untitled"}
                        primaryColor={primary}
                        surfaceColor={surface}
                        backgroundColor={background}
                        textColor={text}
                        textMuted={textMuted}
                        defaultCollapsed={previewCollapsed}
                        onToggle={setPreviewCollapsed}
                    >
                        <ThemePreviewContent theme={editedTheme} />
                    </StickyPreview>
                </div>
                
                {/* Editor Column */}
                <div className="dc-theme-editor-content-wrapper">
                    <div 
                        className="dc-theme-editor-column"
                        style={{
                            background: surface,
                            borderColor: primary + "22",
                        }}
                    >
                        <div className="dc-theme-editor-scroll">
                            {PROPERTY_SECTIONS.map(section => (
                                <PropertySection
                                    key={section.id}
                                    section={section}
                                    theme={editedTheme}
                                    expanded={expandedSections.includes(section.id)}
                                    onToggle={() => toggleSection(section.id)}
                                    onUpdate={updateProperty}
                                    onImageUpload={handleImageUpload}
                                    primaryColor={primary}
                                    textColor={text}
                                    textMuted={textMuted}
                                    surfaceColor={surface}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer Actions */}
            <div 
                style={{
                    ...styles.footer,
                    borderTopColor: primary + "22",
                }}
                className="dc-theme-editor-footer"
            >
                <div style={styles.footerLeft} className="dc-theme-editor-footer-left">
                    <button
                        onClick={resetChanges}
                        disabled={!hasChanges}
                        style={{
                            ...styles.footerButton,
                            background: surface,
                            color: hasChanges ? text : textMuted,
                            opacity: hasChanges ? 1 : 0.5,
                        }}
                    >
                        Reset Changes
                    </button>
                </div>
                <div style={styles.footerRight} className="dc-theme-editor-footer-right">
                    {originalTheme && (
                        <button
                            onClick={() => saveTheme(true)}
                            disabled={saving || !editedTheme["theme-id"]}
                            style={{
                                ...styles.footerButton,
                                background: surface,
                                color: text,
                            }}
                        >
                            Save as New
                        </button>
                    )}
                    <button
                        onClick={() => saveTheme(false)}
                        disabled={saving || !editedTheme["theme-id"]}
                        style={{
                            ...styles.saveButton,
                            background: `linear-gradient(135deg, ${primary}, ${accent})`,
                            opacity: (!saving && editedTheme["theme-id"]) ? 1 : 0.5,
                        }}
                    >
                        {saving ? "Saving..." : originalTheme ? "Save Changes" : "Create Theme"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Property Section
// ═══════════════════════════════════════════════════════════════════════════════

function PropertySection({ 
    section, 
    theme, 
    expanded, 
    onToggle, 
    onUpdate, 
    onImageUpload,
    primaryColor,
    textColor,
    textMuted,
    surfaceColor,
}) {
    return (
        <div style={styles.section}>
            {/* Section Header */}
            <div 
                onClick={onToggle}
                style={{
                    ...styles.sectionHeader,
                    borderBottomColor: expanded ? primaryColor + "33" : "transparent",
                }}
            >
                <span style={styles.sectionIcon}>{section.icon}</span>
                <span style={{ ...styles.sectionTitle, color: textColor }}>{section.title}</span>
                <span style={{ 
                    ...styles.expandIcon, 
                    color: textMuted,
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                    ▼
                </span>
            </div>
            
            {/* Section Content */}
            {expanded && (
                <div style={styles.sectionContent}>
                    {section.properties.map(prop => (
                        <PropertyField
                            key={prop.key}
                            prop={prop}
                            value={theme[prop.key]}
                            onChange={(value) => onUpdate(prop.key, value)}
                            onImageUpload={() => onImageUpload(prop.key)}
                            primaryColor={primaryColor}
                            textColor={textColor}
                            textMuted={textMuted}
                            surfaceColor={surfaceColor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Property Field
// ═══════════════════════════════════════════════════════════════════════════════

function PropertyField({ 
    prop, 
    value, 
    onChange, 
    onImageUpload,
    primaryColor,
    textColor,
    textMuted,
    surfaceColor,
}) {
    const renderInput = () => {
        switch (prop.type) {
            case "color":
                return (
                    <ColorPicker
                        value={value || "#7c3aed"}
                        onChange={onChange}
                        size="small"
                    />
                );
                
            case "gradient":
                return (
                    <GradientBuilder
                        value={value || "linear-gradient(90deg, #7c3aed, #a78bfa)"}
                        onChange={onChange}
                        previewHeight={40}
                    />
                );
            
            case "background":
                return (
                    <BackgroundPicker
                        value={value || ""}
                        onChange={onChange}
                        previewHeight={40}
                    />
                );
                
            case "image":
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {value && (
                            <div style={{
                                width: 60,
                                height: 60,
                                borderRadius: 8,
                                background: `url("${value}") center/contain no-repeat`,
                                border: "1px solid rgba(255,255,255,0.1)",
                            }} />
                        )}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                                onClick={onImageUpload}
                                style={{
                                    padding: "8px 14px",
                                    fontSize: 12,
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    borderRadius: 6,
                                    color: textColor,
                                    cursor: "pointer",
                                    minHeight: 36,
                                }}
                            >
                                Upload Image
                            </button>
                            {value && (
                                <button
                                    onClick={() => onChange("")}
                                    style={{
                                        padding: "8px 14px",
                                        fontSize: 12,
                                        background: "rgba(255,0,0,0.1)",
                                        border: "none",
                                        borderRadius: 6,
                                        color: "#ff6666",
                                        cursor: "pointer",
                                        minHeight: 36,
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                );
                
            case "select":
                return (
                    <select
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            color: textColor,
                            width: "100%",
                            minHeight: 40,
                        }}
                    >
                        {prop.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
                
            case "number":
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                            type="range"
                            min={prop.min || 0}
                            max={prop.max || 100}
                            value={value || prop.min || 0}
                            onChange={(e) => onChange(parseInt(e.target.value))}
                            style={{ flex: 1, minHeight: 24 }}
                        />
                        <span style={{ fontSize: 12, color: textMuted, minWidth: 50, textAlign: "right" }}>
                            {value || 0}{prop.unit || ""}
                        </span>
                    </div>
                );
                
            case "boolean":
                return (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 40 }}>
                        <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                            style={{ width: 20, height: 20 }}
                        />
                        <span style={{ fontSize: 13, color: textMuted }}>
                            {value ? "Enabled" : "Disabled"}
                        </span>
                    </label>
                );
                
            case "textarea":
                return (
                    <textarea
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={prop.placeholder}
                        rows={3}
                        style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            color: textColor,
                            width: "100%",
                            resize: "vertical",
                            fontFamily: "inherit",
                            minHeight: 80,
                        }}
                    />
                );
                
            default: // text
                return (
                    <input
                        type="text"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={prop.placeholder}
                        style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            color: textColor,
                            width: "100%",
                            minHeight: 40,
                        }}
                    />
                );
        }
    };
    
    return (
        <div style={styles.fieldRow}>
            <label style={{ 
                ...styles.fieldLabel, 
                color: textMuted,
            }}>
                {prop.label}
                {prop.required && <span style={{ color: "#ff6666" }}> *</span>}
            </label>
            <div style={styles.fieldInput}>
                {renderInput()}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
    container: {
        padding: 24,
        borderRadius: 16,
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
    },
    loading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 400,
        color: "rgba(255,255,255,0.5)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 12,
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
    },
    subtitle: {
        margin: "4px 0 0 0",
        fontSize: 13,
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    unsavedBadge: {
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 12,
        fontWeight: 500,
    },
    themeSelector: {
        display: "flex",
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 8,
    },
    select: {
        padding: "10px 14px",
        fontSize: 14,
        borderRadius: 8,
        border: "1px solid",
        cursor: "pointer",
        minWidth: 200,
        minHeight: 42,
    },
    section: {
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        padding: "14px 16px",
        cursor: "pointer",
        borderBottom: "1px solid",
        transition: "background 0.2s ease",
        minHeight: 48,
    },
    sectionIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: 600,
    },
    expandIcon: {
        fontSize: 10,
        transition: "transform 0.2s ease",
    },
    sectionContent: {
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    fieldRow: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: 500,
    },
    fieldInput: {
        // Container for input
    },
    footer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 20,
        marginTop: 20,
        borderTop: "1px solid",
        flexWrap: "wrap",
        gap: 12,
    },
    footerLeft: {
        display: "flex",
        gap: 10,
    },
    footerRight: {
        display: "flex",
        gap: 10,
    },
    footerButton: {
        padding: "12px 18px",
        fontSize: 13,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.2s ease",
        minHeight: 44,
    },
    saveButton: {
        padding: "12px 22px",
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.2s ease",
        minHeight: 44,
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const renderedView = <ThemeEditor />;
return { renderedView, ThemeEditor };
