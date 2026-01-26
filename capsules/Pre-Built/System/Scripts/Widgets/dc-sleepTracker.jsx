// ═══════════════════════════════════════════════════════════════════════════════
// SLEEP TRACKER v3 (Refactored with GloDial)
// - Now uses GloDial component for time inputs
// - Cleaner code, better mobile support
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

const { GloDial } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloDial.jsx")
);

const {
    resolveDateStr,
    getFrontmatterForDate,
    saveFrontmatterForDate,
} = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-dateContext.jsx")
);

const SETTINGS_PATH = "System/Settings.md";
const EMPTY_ICON = "○";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function SleepTracker({ targetDate, lastUpdate }) {
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    useComponentCSS();
    
    const dateStr = resolveDateStr(targetDate);
    const fm = getFrontmatterForDate(dateStr);

    const primary = theme?.["color-primary"] || "#7c3aed";
    const accent = theme?.["color-accent"] || "#f59e0b";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";

    // ─────────────────────────────────────────────────────────────────────────
    // DATA & STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const getSettingsData = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return { sleepGoal: 8, activities: [] };
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            const sleepActivity = activities.find(a => a.id === 'sleep');
            return { sleepGoal: sleepActivity?.goal || 8, activities };
        } catch (e) { return { sleepGoal: 8, activities: [] }; }
    };

    const { sleepGoal, activities } = getSettingsData();
    
    const getActivityConfig = (activityId) => {
        const activity = activities.find(a => a.id === activityId);
        return {
            icon: activity?.icon || "⭐",
            color: activity?.color || primary,
            label: activity?.label || activityId
        };
    };
    
    const [bedtime, setBedtime] = dc.useState(fm["sleep-bedtime"] || "23:00");
    const [wakeup, setWakeup] = dc.useState(fm["sleep-wakeup"] || "07:00");
    const [quality, setQuality] = dc.useState(fm["sleep-quality"] || 3);
    const [mood, setMood] = dc.useState(fm["mood"] || 3);
    const [energy, setEnergy] = dc.useState(fm["energy"] || 3);
    const [totalHours, setTotalHours] = dc.useState(0);
    
    const savingRef = dc.useRef(false);
    const saveTimeoutRef = dc.useRef(null);

    // Sync on date change
    dc.useEffect(() => {
        const newFm = getFrontmatterForDate(dateStr);
        setBedtime(newFm["sleep-bedtime"] || "23:00");
        setWakeup(newFm["sleep-wakeup"] || "07:00");
        setQuality(newFm["sleep-quality"] || 3);
        setMood(newFm["mood"] || 3);
        setEnergy(newFm["energy"] || 3);
    }, [dateStr, lastUpdate]);

    // Calc duration
    dc.useEffect(() => {
        const parseTime = (t) => {
            const [hrs, mins] = t.split(":").map(Number);
            return hrs + (mins / 60);
        };
        let start = parseTime(bedtime);
        let end = parseTime(wakeup);
        if (end < start) end += 24;
        const duration = (end - start).toFixed(1);
        setTotalHours(duration);
    }, [bedtime, wakeup]);

    const saveToFrontmatter = async (updates) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            if (savingRef.current) return;
            savingRef.current = true;
            await saveFrontmatterForDate(dateStr, updates);
            savingRef.current = false;
        }, 300);
    };

    const updateBedtime = (val) => {
        setBedtime(val);
        const parseTime = (t) => { const [h, m] = t.split(":").map(Number); return h + (m / 60); };
        let s = parseTime(val); let e = parseTime(wakeup); if (e < s) e += 24;
        saveToFrontmatter({ "sleep-bedtime": val, "sleep-hours": Number((e - s).toFixed(1)) });
    };

    const updateWakeup = (val) => {
        setWakeup(val);
        const parseTime = (t) => { const [h, m] = t.split(":").map(Number); return h + (m / 60); };
        let s = parseTime(bedtime); let e = parseTime(val); if (e < s) e += 24;
        saveToFrontmatter({ "sleep-wakeup": val, "sleep-hours": Number((e - s).toFixed(1)) });
    };

    if (themeLoading) return <div>Loading...</div>;

    // ─────────────────────────────────────────────────────────────────────────
    // COMPONENT: ICON RATING
    // ─────────────────────────────────────────────────────────────────────────
    
    const IconRating = ({ activityId, value, onChange }) => {
        const config = getActivityConfig(activityId);
        const [hoveredIndex, setHoveredIndex] = dc.useState(null);
        
        return (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "8px 0", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 120px", minWidth: "120px" }}>
                    <span style={{ fontSize: 20 }}>{config.icon}</span>
                    <span style={{ fontSize: 13, color: text }}>{config.label}</span>
                </div>
                <div style={{ display: "flex", gap: 4, flex: "0 1 auto", justifyContent: "center" }}>
                    {[1, 2, 3, 4, 5].map(i => {
                        const isFilled = i <= value;
                        const isHovered = hoveredIndex !== null && i <= hoveredIndex;
                        return (
                            <div 
                                key={i} 
                                onClick={() => onChange(i)} 
                                onMouseEnter={() => setHoveredIndex(i)} 
                                onMouseLeave={() => setHoveredIndex(null)}
                                onTouchStart={() => setHoveredIndex(i)}
                                onTouchEnd={() => { onChange(i); setHoveredIndex(null); }}
                                style={{ 
                                    // Minimum 44px touch target
                                    width: 44, 
                                    height: 44, 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    fontSize: 20, 
                                    cursor: "pointer", 
                                    opacity: isFilled ? 1 : 0.3, 
                                    transform: isHovered ? "scale(1.2)" : "scale(1)", 
                                    transition: "all 0.15s ease", 
                                    filter: isFilled ? `drop-shadow(0 0 4px ${config.color})` : "none", 
                                    color: isFilled ? config.color : textMuted,
                                    touchAction: "manipulation",
                                }}
                            >
                                {isFilled ? config.icon : EMPTY_ICON}
                            </div>
                        );
                    })}
                </div>
                <div style={{ fontSize: 14, fontWeight: "bold", color: config.color, width: 24, textAlign: "right" }}>{value}</div>
            </div>
        );
    };

    const goalMet = Number(totalHours) >= sleepGoal;

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    return (
        <div style={{ background: showBackgrounds ? surface : "transparent", border: showBackgrounds ? `1px solid ${primary}33` : "none", borderRadius: 16, padding: 20, color: text, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🌙</span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: primary }}>Morning Check-in</h3>
                </div>
                <GloBadge color={goalMet ? success : textMuted} size="small" variant={goalMet ? "filled" : "soft"}>
                    {goalMet ? "Goal met!" : `${totalHours}/${sleepGoal} hrs`}
                </GloBadge>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", alignItems: "center", marginBottom: 24 }}>
                <GloDial 
                    label="Bedtime" 
                    value={bedtime} 
                    onChange={updateBedtime} 
                    color={primary}
                    mode="time"
                    snapMinutes={15}
                    size="medium"
                />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 16px", background: goalMet ? `${success}15` : (showBackgrounds ? surfaceAlt : `${primary}11`), borderRadius: 12, border: goalMet ? `1px solid ${success}44` : "none", minWidth: "100px" }}>
                    <div style={{ fontSize: 28, fontWeight: "bold", color: goalMet ? success : primary }}>{totalHours}</div>
                    <div style={{ fontSize: 12, color: goalMet ? success : textMuted }}>hours</div>
                </div>
                <GloDial 
                    label="Wake Up" 
                    value={wakeup} 
                    onChange={updateWakeup} 
                    color={accent}
                    mode="time"
                    snapMinutes={15}
                    size="medium"
                />
            </div>

            <div style={{ height: 1, background: `${textMuted}22`, margin: "20px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <IconRating activityId="sleep-quality" value={quality} onChange={(val) => { setQuality(val); saveToFrontmatter({ "sleep-quality": val }); }} />
                <IconRating activityId="mood" value={mood} onChange={(val) => { setMood(val); saveToFrontmatter({ "mood": val }); }} />
                <IconRating activityId="energy" value={energy} onChange={(val) => { setEnergy(val); saveToFrontmatter({ "energy": val }); }} />
            </div>
        </div>
    );
}

return { Func: SleepTracker };