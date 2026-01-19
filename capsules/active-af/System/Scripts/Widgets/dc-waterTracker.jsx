// ═══════════════════════════════════════════════════════════════════════════════
// WATER TRACKER WIDGET
// Tracks daily water intake with draggable progress bar
// 
// Features:
//   - Reads goal, increment, icon, and color from Settings.md activities array
//   - Uses GloBar for themed draggable progress bar
//   - Uses GloButton for themed quick-add buttons
//   - Auto-save on drag end and button click
//   - Full theme integration
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const { GloBar } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBar.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

const {
    resolveDateStr,
    getFileForDate,
    getFrontmatterForDate,
    saveFrontmatterForDate,
} = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-dateContext.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_PATH = "System/Settings.md";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function WaterTracker({ targetDate }) {
    // ─────────────────────────────────────────────────────────────────────────
    // THEME & SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    
    // Load CSS
    useComponentCSS();
    
    // Resolve target date - use prop if provided, otherwise active file's date
    const dateStr = resolveDateStr(targetDate);
    const file = getFileForDate(dateStr);
    const fm = getFrontmatterForDate(dateStr);

    // ─────────────────────────────────────────────────────────────────────────
    // THEME COLORS
    // ─────────────────────────────────────────────────────────────────────────
    
    const primary = theme?.["color-primary"] || "#7c3aed";
    const accent = theme?.["color-accent"] || "#f59e0b";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    
    // Button theme settings
    const buttonIdleBg = theme?.["button-idle-bg"] || null;
    const buttonHoverBg = theme?.["button-hover-bg"] || null;
    const buttonActiveBg = theme?.["button-active-bg"] || null;

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD SETTINGS FROM ACTIVITIES ARRAY
    // ─────────────────────────────────────────────────────────────────────────
    
    const getWaterSettings = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return { goal: 3000, bottleSize: 500, icon: "💧", color: "#4facfe", label: "Hydration" };
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            const waterActivity = activities.find(a => a.id === 'water');
            
            return {
                goal: waterActivity?.goal || 3000,
                bottleSize: waterActivity?.increment || 500,
                icon: waterActivity?.icon || "💧",
                color: waterActivity?.color || "#4facfe",
                label: waterActivity?.label || "Hydration",
                unit: waterActivity?.unit || "ml"
            };
        } catch (e) {
            console.error("Failed to load water settings:", e);
            return { goal: 3000, bottleSize: 500, icon: "💧", color: "#4facfe", label: "Hydration", unit: "ml" };
        }
    };

    const waterSettings = getWaterSettings();
    const { goal, bottleSize, icon, color: waterColor, label, unit } = waterSettings;

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const currentMl = fm["water-ml"] || 0;
    const [localMl, setLocalMl] = dc.useState(currentMl);
    
    // Refs for save tracking
    const savingRef = dc.useRef(false);

    // ─────────────────────────────────────────────────────────────────────────
    // SAVE FUNCTION
    // ─────────────────────────────────────────────────────────────────────────
    
    const updateWater = async (newMl) => {
        const safeMl = Math.max(0, Math.round(newMl));
        setLocalMl(safeMl);
        
        if (savingRef.current) return;
        savingRef.current = true;

        try {
            await saveFrontmatterForDate(dateStr, { "water-ml": safeMl });
        } catch (e) {
            console.error("Failed to save water:", e);
        }
        
        savingRef.current = false;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // BUTTON HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const addAmount = (amount) => {
        const newVal = localMl + amount;
        updateWater(newVal);
        new Notice(`+${amount}${unit} ${icon}`);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LOADING STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    if (themeLoading) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: textMuted, opacity: 0.7 }}>
                Loading...
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPUTED VALUES
    // ─────────────────────────────────────────────────────────────────────────
    
    const goalMet = localMl >= goal;
    const percent = Math.min((localMl / goal) * 100, 100);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    return (
        <div style={{
            background: showBackgrounds ? surface : "transparent",
            border: showBackgrounds ? `1px solid ${primary}33` : "none",
            borderRadius: 12,
            padding: 16,
            color: text,
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
            }}>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8,
                }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <span style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: waterColor,
                    }}>
                        {label}
                    </span>
                </div>
                
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6,
                    fontFamily: "var(--font-monospace)",
                }}>
                    <span style={{ 
                        fontSize: 16, 
                        fontWeight: "bold", 
                        color: goalMet ? success : waterColor,
                    }}>
                        {localMl}
                    </span>
                    <span style={{ color: textMuted, fontSize: 13 }}>/</span>
                    <span style={{ color: textMuted, fontSize: 13 }}>
                        {goal} {unit}
                    </span>
                    {goalMet && (
                        <GloBadge color={success} size="small" variant="filled">
                            Goal!
                        </GloBadge>
                    )}
                </div>
            </div>

            {/* Progress Bar - GloBar with draggable */}
            <div style={{ marginBottom: 16 }}>
                <GloBar
                    value={localMl}
                    max={goal}
                    onChange={(val) => updateWater(val)}
                    draggable={true}
                    showSprite={true}
                    showValue={false}
                    height="24px"
                    fillColor={waterColor}
                    fillGradient={`linear-gradient(90deg, ${hexToRgba(waterColor, 0.8)}, ${waterColor})`}
                />
            </div>

            {/* Quick Add Buttons */}
            <div style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
            }}>
                <GloButton
                    label={`+250${unit}`}
                    onClick={() => addAmount(250)}
                    size="small"
                    bg={buttonIdleBg}
                    hoverBg={buttonHoverBg}
                    activeBg={buttonActiveBg}
                    style={{ flex: 1 }}
                />
                <GloButton
                    label={`+500${unit}`}
                    onClick={() => addAmount(500)}
                    size="small"
                    bg={buttonIdleBg}
                    hoverBg={buttonHoverBg}
                    activeBg={buttonActiveBg}
                    style={{ flex: 1 }}
                />
                <GloButton
                    label={`+${bottleSize}${unit}`}
                    icon={icon}
                    onClick={() => addAmount(bottleSize)}
                    size="small"
                    bg={buttonIdleBg ? buttonIdleBg : `${waterColor}22`}
                    hoverBg={buttonHoverBg ? buttonHoverBg : `${waterColor}44`}
                    activeBg={buttonActiveBg}
                    style={{ 
                        flex: 1.5,
                        borderColor: `${waterColor}44`,
                    }}
                />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

return { Func: WaterTracker };
