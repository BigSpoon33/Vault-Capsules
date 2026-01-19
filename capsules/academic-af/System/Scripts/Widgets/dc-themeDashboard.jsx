// ═══════════════════════════════════════════════════════════════════════════════
// THEME DASHBOARD v2.0
// Unified Theme Console + Live Preview with actual Glo* components
// 
// Features:
//   - Theme selector (sprite packs from System/Themes/*.md)
//   - Color scheme override (from style-settings-*.json files)
//   - Live preview with ALL Glo* components (shared with Editor)
//   - Mobile-first responsive layout (640px breakpoint)
//   - Collapsible sticky preview
//   - One-click apply with Obsidian sync
//
// Usage in notes:
//   ```datacore
//   await dc.require(dc.fileLink("System/Scripts/Widgets/dc-themeDashboard.jsx"))
//   ```
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { 
    useTheme, 
    useAvailableThemes, 
    useAvailableColorSchemes,
    switchTheme, 
    clearThemeCache,
    loadThemeFromPath,
    loadThemeById,
    loadColorOverride,
    mapStyleSettingsToWidgetProps,
    deriveGlowColors,
    ThemeOverrideProvider,
    DEFAULT_THEME,
    hexToRgba
} = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));

const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
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

function useResponsiveDashboardCSS() {
    dc.useEffect(() => {
        const styleId = "dc-theme-dashboard-responsive-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                /* ═══════════════════════════════════════════════════════════════════
                   THEME DASHBOARD RESPONSIVE STYLES
                   Mobile-first with 640px breakpoint
                   ═══════════════════════════════════════════════════════════════════ */

                .dc-theme-dashboard-main {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .dc-theme-dashboard-preview-wrapper {
                    order: 1;
                }

                .dc-theme-dashboard-console-wrapper {
                    order: 2;
                }

                .dc-theme-dashboard-console {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* Desktop: Two-column layout with console on left, preview on right */
                @media (min-width: 641px) {
                    .dc-theme-dashboard-main {
                        display: grid;
                        grid-template-columns: 380px 1fr;
                        gap: 24px;
                    }

                    .dc-theme-dashboard-preview-wrapper {
                        order: 2;
                        position: relative;
                    }

                    .dc-theme-dashboard-console-wrapper {
                        order: 1;
                    }

                    .dc-theme-dashboard-preview-wrapper .dc-sticky-preview {
                        position: sticky;
                        top: 0;
                        max-height: calc(100vh - 200px);
                        overflow: hidden;
                    }

                    .dc-theme-dashboard-preview-wrapper .dc-sticky-preview-content.expanded {
                        overflow-y: auto;
                        max-height: calc(100vh - 280px);
                    }
                }

                /* Mobile adjustments */
                @media (max-width: 640px) {
                    .dc-theme-dashboard-container {
                        padding: 16px;
                    }

                    .dc-theme-dashboard-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }

                    .dc-theme-dashboard-footer {
                        flex-direction: column;
                        gap: 12px;
                        align-items: stretch;
                    }

                    .dc-theme-dashboard-footer button {
                        width: 100%;
                    }

                    .dc-theme-dashboard-scheme-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .dc-theme-dashboard-apply-btn {
                        min-height: 48px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: ThemeDashboard
// ═══════════════════════════════════════════════════════════════════════════════

function ThemeDashboard({
    // Optional callback when user wants to edit a theme
    // Called with themeId when clicking "Edit" button on a theme card
    onEditTheme = null,
}) {
    // Global state
    const { theme: activeTheme, isLoading: themeLoading, themeName: activeThemeName, colorOverrideName } = useTheme();
    const { themes, isLoading: themesLoading } = useAvailableThemes();
    const { schemes, isLoading: schemesLoading } = useAvailableColorSchemes();
    
    // Local state
    const [selectedThemeId, setSelectedThemeId] = dc.useState(activeThemeName);
    const [selectedColorScheme, setSelectedColorScheme] = dc.useState(colorOverrideName || "");
    const [useColorOverride, setUseColorOverride] = dc.useState(!!colorOverrideName);
    const [applying, setApplying] = dc.useState(false);
    const [hoveredTheme, setHoveredTheme] = dc.useState(null);
    const [previewCollapsed, setPreviewCollapsed] = dc.useState(false);
    
    // Preview theme data (loaded when selection changes)
    const [previewTheme, setPreviewTheme] = dc.useState(null);
    const [previewLoading, setPreviewLoading] = dc.useState(false);
    
    // Load CSS
    useComponentCSS();
    useResponsiveDashboardCSS();

    // Sync state when active theme loads
    dc.useEffect(() => {
        if (!themeLoading) {
            setSelectedThemeId(activeThemeName);
            setSelectedColorScheme(colorOverrideName || "");
            setUseColorOverride(!!colorOverrideName);
        }
    }, [themeLoading, activeThemeName, colorOverrideName]);

    // Load preview theme when selection or color override changes
    dc.useEffect(() => {
        const loadPreview = async () => {
            if (!selectedThemeId) return;
            
            setPreviewLoading(true);
            try {
                // Load base theme
                let themeData = await loadThemeById(selectedThemeId);
                
                // Apply color override if enabled
                if (useColorOverride && selectedColorScheme) {
                    const colorOverrideData = await loadColorOverride(selectedColorScheme);
                    if (colorOverrideData) {
                        // Map style settings keys to widget properties
                        const mappedColors = mapStyleSettingsToWidgetProps(colorOverrideData);
                        // Merge color override into theme
                        themeData = { ...themeData, ...mappedColors };
                        // Re-derive glow colors with new colors
                        themeData = deriveGlowColors(themeData);
                    }
                }
                
                setPreviewTheme(themeData);
            } catch (e) {
                console.error("Failed to load preview theme:", e);
                setPreviewTheme(activeTheme);
            }
            setPreviewLoading(false);
        };
        
        loadPreview();
    }, [selectedThemeId, useColorOverride, selectedColorScheme]);

    // Handle theme selection
    const handleThemeSelect = (themeId) => {
        setSelectedThemeId(themeId);
    };

    // Apply theme with optional color override
    const handleApply = async () => {
        setApplying(true);
        try {
            const colorOverride = useColorOverride ? selectedColorScheme : "";
            await switchTheme(selectedThemeId, colorOverride, true);
            // switchTheme handles reload
        } catch (e) {
            console.error("Failed to apply theme:", e);
            new Notice("Failed to apply theme");
            setApplying(false);
        }
    };

    // Check if there are unsaved changes
    const hasChanges = selectedThemeId !== activeThemeName || 
        (useColorOverride ? selectedColorScheme : "") !== (colorOverrideName || "");

    // Loading state
    if (themeLoading || themesLoading || schemesLoading) {
        return (
            <div style={styles.container} className="dc-theme-dashboard-container">
                <div style={styles.loading}>
                    <span style={styles.loadingText}>Loading theme dashboard...</span>
                </div>
            </div>
        );
    }

    // Applying state
    if (applying) {
        return (
            <div style={styles.container} className="dc-theme-dashboard-container">
                <div style={styles.loading}>
                    <span style={styles.loadingText}>Applying theme & syncing to Obsidian...</span>
                </div>
            </div>
        );
    }

    // Use preview theme for styling, fall back to active theme
    const displayTheme = previewTheme || activeTheme;
    const primaryColor = displayTheme["color-primary"] || displayTheme["color-accent"] || "#7c3aed";
    const accentColor = displayTheme["color-accent"] || "#f59e0b";
    const surfaceColor = displayTheme["color-surface"] || "#2a2a3e";
    const bgColor = displayTheme["color-background"] || "#1e1e2e";
    const textColor = displayTheme["color-text"] || "#ffffff";
    const textMuted = displayTheme["color-text-muted"] || "#a0a0b0";

    return (
        <div 
            style={{
                ...styles.container,
                background: bgColor,
                color: textColor,
                border: `1px solid ${primaryColor}33`
            }}
            className="dc-theme-dashboard-container"
        >
            {/* Header */}
            <div style={styles.header} className="dc-theme-dashboard-header">
                <h2 style={{ ...styles.title, color: primaryColor }}>
                    Theme Dashboard
                </h2>
                <div style={styles.currentBadge}>
                    Active: {activeThemeName}{colorOverrideName ? ` + ${colorOverrideName}` : ""}
                </div>
            </div>

            {/* Main Content - Responsive Grid */}
            <div className="dc-theme-dashboard-main">
                
                {/* Preview Column (top on mobile, right on desktop) */}
                <div className="dc-theme-dashboard-preview-wrapper">
                    <StickyPreview
                        title="Live Preview"
                        subtitle={previewTheme?.["theme-name"] || selectedThemeId}
                        primaryColor={primaryColor}
                        surfaceColor={surfaceColor}
                        backgroundColor={bgColor}
                        textColor={textColor}
                        textMuted={textMuted}
                        defaultCollapsed={previewCollapsed}
                        onToggle={setPreviewCollapsed}
                    >
                        {previewLoading ? (
                            <div style={styles.previewLoading}>Loading preview...</div>
                        ) : (
                            <ThemePreviewContent theme={previewTheme || activeTheme} />
                        )}
                    </StickyPreview>
                </div>
                
                {/* Console Column */}
                <div className="dc-theme-dashboard-console-wrapper">
                    <div className="dc-theme-dashboard-console">
                        
                        {/* Sprite Pack Selection */}
                        <div style={styles.section}>
                            <h3 style={{ ...styles.sectionTitle, color: primaryColor }}>
                                Sprite Pack
                            </h3>
                            <p style={{ ...styles.sectionDesc, color: textMuted }}>
                                Choose the animated character for progress bars and toggles
                            </p>
                            
                            <div style={styles.themeGrid}>
                                {themes.map(t => {
                                    const isSelected = t.id === selectedThemeId;
                                    const isHovered = hoveredTheme === t.id;
                                    
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => handleThemeSelect(t.id)}
                                            onMouseEnter={() => setHoveredTheme(t.id)}
                                            onMouseLeave={() => setHoveredTheme(null)}
                                            style={{
                                                ...styles.themeCard,
                                                background: isSelected 
                                                    ? `linear-gradient(135deg, ${primaryColor}33, ${surfaceColor})`
                                                    : surfaceColor,
                                                border: isSelected 
                                                    ? `2px solid ${primaryColor}`
                                                    : `1px solid ${primaryColor}33`,
                                                transform: isHovered && !isSelected ? 'translateY(-2px)' : 'none',
                                                boxShadow: isHovered 
                                                    ? `0 8px 20px ${primaryColor}22`
                                                    : '0 2px 8px rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            <ThemePreviewMini themePath={t.path} />
                                            <div style={styles.themeInfo}>
                                                <span style={{
                                                    ...styles.themeName,
                                                    color: isSelected ? primaryColor : textColor
                                                }}>
                                                    {t.name}
                                                </span>
                                                <span style={{ ...styles.themeDesc, color: textMuted }}>
                                                    {t.description || "Sprite pack"}
                                                </span>
                                            </div>
                                            
                                            {/* Edit button - only show if onEditTheme callback provided */}
                                            {onEditTheme && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Don't trigger card selection
                                                        onEditTheme(t.id);
                                                    }}
                                                    style={{
                                                        ...styles.editButton,
                                                        background: `${primaryColor}22`,
                                                        color: primaryColor,
                                                        border: `1px solid ${primaryColor}44`,
                                                    }}
                                                    title={`Edit ${t.name}`}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            
                                            {isSelected && (
                                                <div style={{
                                                    ...styles.selectedBadge,
                                                    background: primaryColor
                                                }}>
                                                    Selected
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Color Scheme Override */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <h3 style={{ ...styles.sectionTitle, color: primaryColor, margin: 0 }}>
                                    Color Override
                                </h3>
                                <label style={styles.toggleLabel}>
                                    <input 
                                        type="checkbox"
                                        checked={useColorOverride}
                                        onChange={(e) => {
                                            setUseColorOverride(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedColorScheme("");
                                            } else if (schemes.length > 0 && !selectedColorScheme) {
                                                setSelectedColorScheme(schemes[0].name);
                                            }
                                        }}
                                        style={styles.checkbox}
                                    />
                                    <span style={{ color: useColorOverride ? accentColor : textMuted }}>
                                        {useColorOverride ? "Enabled" : "Disabled"}
                                    </span>
                                </label>
                            </div>

                            {useColorOverride && (
                                <div style={styles.schemeGrid} className="dc-theme-dashboard-scheme-grid">
                                    {schemes.map(s => {
                                        const isSelected = s.name === selectedColorScheme;
                                        
                                        return (
                                            <div
                                                key={s.name}
                                                onClick={() => setSelectedColorScheme(s.name)}
                                                style={{
                                                    ...styles.schemeCard,
                                                    background: isSelected 
                                                        ? `linear-gradient(135deg, ${accentColor}33, ${surfaceColor})`
                                                        : surfaceColor,
                                                    border: isSelected 
                                                        ? `2px solid ${accentColor}`
                                                        : `1px solid ${accentColor}33`,
                                                }}
                                            >
                                                <ColorSchemePreview schemePath={s.path} />
                                                <span style={{
                                                    ...styles.schemeName,
                                                    color: isSelected ? accentColor : textColor
                                                }}>
                                                    {s.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!useColorOverride && (
                                <div style={{ ...styles.disabledNotice, color: textMuted }}>
                                    Using sprite pack's built-in colors
                                </div>
                            )}
                        </div>

                        {/* Widget Settings */}
                        <div style={styles.section}>
                            <h3 style={{ ...styles.sectionTitle, color: primaryColor }}>
                                Widget Settings
                            </h3>
                            <WidgetSettingsPanel primaryColor={primaryColor} accentColor={accentColor} textMuted={textMuted} surfaceColor={surfaceColor} />
                        </div>

                        {/* Apply Button */}
                        <div style={styles.applySection}>
                            <button
                                onClick={handleApply}
                                disabled={!hasChanges}
                                className="dc-theme-dashboard-apply-btn"
                                style={{
                                    ...styles.applyButton,
                                    background: hasChanges 
                                        ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                                        : surfaceColor,
                                    opacity: hasChanges ? 1 : 0.5,
                                    cursor: hasChanges ? 'pointer' : 'not-allowed',
                                    boxShadow: hasChanges 
                                        ? `0 4px 20px ${primaryColor}44`
                                        : 'none'
                                }}
                            >
                                {hasChanges ? "Apply Theme & Sync" : "No Changes"}
                            </button>
                            
                            {hasChanges && (
                                <div style={{ ...styles.pendingChanges, color: textMuted }}>
                                    Preview: <strong style={{ color: primaryColor }}>{selectedThemeId}</strong>
                                    {useColorOverride && selectedColorScheme && (
                                        <> + <strong style={{ color: accentColor }}>{selectedColorScheme}</strong></>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div 
                style={{
                    ...styles.footer,
                    borderTop: `1px solid ${primaryColor}22`
                }}
                className="dc-theme-dashboard-footer"
            >
                <button
                    onClick={() => {
                        clearThemeCache();
                        new Notice("Theme cache cleared! Reload to refresh.");
                    }}
                    style={{
                        ...styles.footerButton,
                        background: surfaceColor,
                        border: `1px solid ${primaryColor}44`,
                        color: textMuted
                    }}
                >
                    Clear Cache
                </button>
                <span style={{ ...styles.footerText, color: textMuted }}>
                    {themes.length} sprite packs available
                </span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Mini Preview for Theme Cards
// ═══════════════════════════════════════════════════════════════════════════════

function ThemePreviewMini({ themePath }) {
    const [previewData, setPreviewData] = dc.useState(null);

    dc.useEffect(() => {
        const load = async () => {
            try {
                const file = app.vault.getAbstractFileByPath(themePath);
                if (file) {
                    const cache = app.metadataCache.getFileCache(file);
                    setPreviewData(cache?.frontmatter || {});
                }
            } catch (e) {
                console.warn("Failed to load theme preview:", e);
            }
        };
        load();
    }, [themePath]);

    if (!previewData) {
        return <div style={styles.miniPreviewPlaceholder}>...</div>;
    }

    const hasSprite = previewData["bar-sprite"] || previewData["toggle-sprite"];
    const gradient = previewData["bar-fill-gradient"] || "linear-gradient(90deg, #7c3aed, #a78bfa)";

    return (
        <div style={styles.miniPreviewBox}>
            <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: gradient,
            }} />
            {hasSprite && (
                <div style={styles.spriteIndicator}>GIF</div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Color Scheme Preview Swatches
// ═══════════════════════════════════════════════════════════════════════════════

function ColorSchemePreview({ schemePath }) {
    const [colors, setColors] = dc.useState(null);

    dc.useEffect(() => {
        const load = async () => {
            try {
                const file = app.vault.getAbstractFileByPath(schemePath);
                if (file) {
                    const content = await app.vault.read(file);
                    const json = JSON.parse(content);
                    setColors({
                        primary: json["minimal-style@@ui3@@dark"] || "#7c3aed",
                        bg: json["minimal-style@@ui1@@dark"] || "#1e1e2e",
                        accent: json["minimal-style@@ax3@@dark"] || "#f59e0b",
                        h1: json["minimal-style@@h1-color@@dark"] || "#ffffff"
                    });
                }
            } catch (e) {
                console.warn("Failed to load color scheme:", e);
            }
        };
        load();
    }, [schemePath]);

    if (!colors) {
        return <div style={styles.colorSwatches}><div style={styles.colorSwatch} /></div>;
    }

    return (
        <div style={styles.colorSwatches}>
            <div style={{ ...styles.colorSwatch, background: colors.primary }} title="Primary" />
            <div style={{ ...styles.colorSwatch, background: colors.accent }} title="Accent" />
            <div style={{ ...styles.colorSwatch, background: colors.h1 }} title="Heading" />
            <div style={{ ...styles.colorSwatch, background: colors.bg }} title="Background" />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Widget Settings Panel
// ═══════════════════════════════════════════════════════════════════════════════

const SETTINGS_PATH = "System/Settings.md";

function WidgetSettingsPanel({ primaryColor, accentColor, textMuted, surfaceColor }) {
    const [widgetBackgrounds, setWidgetBackgrounds] = dc.useState(true);
    const [loading, setLoading] = dc.useState(true);
    
    // Load current settings
    dc.useEffect(() => {
        const loadSettings = () => {
            try {
                const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
                if (file) {
                    const cache = app.metadataCache.getFileCache(file);
                    const fm = cache?.frontmatter || {};
                    setWidgetBackgrounds(fm["widget-backgrounds"] !== false);
                }
            } catch (e) {
                console.error("Failed to load widget settings:", e);
            }
            setLoading(false);
        };
        loadSettings();
    }, []);
    
    // Save setting to Settings.md
    const toggleWidgetBackgrounds = async () => {
        const newValue = !widgetBackgrounds;
        setWidgetBackgrounds(newValue);
        
        try {
            const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (file) {
                await app.fileManager.processFrontMatter(file, (fm) => {
                    fm["widget-backgrounds"] = newValue;
                });
                new Notice(`Widget backgrounds ${newValue ? "enabled" : "disabled"}`);
            }
        } catch (e) {
            console.error("Failed to save widget backgrounds setting:", e);
            new Notice("Failed to save setting");
        }
    };
    
    if (loading) {
        return <div style={{ fontSize: 12, color: textMuted }}>Loading...</div>;
    }
    
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
        }}>
            {/* Widget Backgrounds Toggle */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                background: surfaceColor,
                borderRadius: 8,
                border: `1px solid ${primaryColor}22`,
                minHeight: 56,
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Widget Backgrounds</span>
                    <span style={{ fontSize: 11, color: textMuted }}>
                        Show container backgrounds on widgets
                    </span>
                </div>
                <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    minHeight: 44,
                    padding: "0 8px",
                }}>
                    <input
                        type="checkbox"
                        checked={widgetBackgrounds}
                        onChange={toggleWidgetBackgrounds}
                        style={{ width: 20, height: 20, cursor: "pointer" }}
                    />
                    <span style={{ 
                        fontSize: 13, 
                        fontWeight: 500,
                        color: widgetBackgrounds ? accentColor : textMuted 
                    }}>
                        {widgetBackgrounds ? "On" : "Off"}
                    </span>
                </label>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
    container: {
        padding: '24px',
        borderRadius: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: '700',
    },
    currentBadge: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.6)',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '20px',
        fontWeight: '500',
    },
    
    // Console sections
    section: {
        marginBottom: '0',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px',
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    sectionDesc: {
        fontSize: '12px',
        marginBottom: '12px',
        marginTop: 0,
    },
    toggleLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500',
        minHeight: '44px',
        padding: '0 8px',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        cursor: 'pointer',
    },
    
    // Theme cards
    themeGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    themeCard: {
        padding: '14px',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '60px',
    },
    miniPreviewBox: {
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '6px',
        padding: '8px',
        marginBottom: '8px',
        position: 'relative',
    },
    miniPreviewPlaceholder: {
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
    },
    spriteIndicator: {
        position: 'absolute',
        top: '4px',
        right: '4px',
        fontSize: '9px',
        padding: '2px 6px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '4px',
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    themeInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    themeName: {
        fontSize: '13px',
        fontWeight: '600',
    },
    themeDesc: {
        fontSize: '10px',
        lineHeight: '1.3',
    },
    selectedBadge: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        fontSize: '9px',
        fontWeight: '700',
        padding: '3px 8px',
        borderRadius: '10px',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    editButton: {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        fontSize: '11px',
        fontWeight: '600',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        zIndex: 5,
        minHeight: '32px',
    },
    
    // Color scheme grid
    schemeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
    },
    schemeCard: {
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        minHeight: '60px',
    },
    colorSwatches: {
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        marginBottom: '6px',
    },
    colorSwatch: {
        width: '16px',
        height: '16px',
        borderRadius: '4px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    schemeName: {
        fontSize: '11px',
        fontWeight: '600',
    },
    disabledNotice: {
        padding: '14px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        fontSize: '12px',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    
    // Apply section
    applySection: {
        marginTop: '8px',
        textAlign: 'center',
    },
    applyButton: {
        width: '100%',
        padding: '14px 24px',
        fontSize: '14px',
        fontWeight: '700',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        minHeight: '48px',
    },
    pendingChanges: {
        marginTop: '10px',
        fontSize: '11px',
    },
    
    // Preview loading
    previewLoading: {
        padding: '40px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
    },
    
    // Footer
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '16px',
        flexWrap: 'wrap',
        gap: '12px',
    },
    footerButton: {
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontWeight: '500',
        minHeight: '40px',
    },
    footerText: {
        fontSize: '11px',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const renderedView = <ThemeDashboard />;
return { renderedView, ThemeDashboard };
