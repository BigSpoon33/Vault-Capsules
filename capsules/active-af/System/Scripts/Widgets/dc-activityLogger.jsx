// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGGER (Write Fix)
// Fix: handleDragEnd now reads from STICKY_CACHE to ensure it saves the
//      latest dragged value, avoiding React state staleness.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const { GloBar } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBar.jsx")
);

const { GloToggle } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx")
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
// GLOBAL CACHE
// ─────────────────────────────────────────────────────────────────────────────

// Defined OUTSIDE the component so it survives re-renders/remounts
const STICKY_CACHE = {}; 

const SETTINGS_PATH = "System/Settings.md";

function isIconImage(icon) {
    if (!icon) return false;
    return icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("data:image/");
}

function IconPreview({ icon, size = 24 }) {
    if (!icon) return <span style={{ fontSize: size }}>📊</span>;
    if (isIconImage(icon)) {
        return <img src={icon} alt="icon" style={{ width: size, height: size, objectFit: "contain", borderRadius: 4 }} />;
    }
    return <span style={{ fontSize: size }}>{icon}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityLogger({ targetDate, lastUpdate }) {
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    
    const dateStr = resolveDateStr(targetDate);
    const targetFile = getFileForDate(dateStr);
    
    const [activities, setActivities] = dc.useState([]);
    const [values, setValues] = dc.useState({});
    const [loading, setLoading] = dc.useState(true);
    
    // Refs for internal management
    const savingRef = dc.useRef(false);
    const saveTimeoutRef = dc.useRef(null);
    
    useComponentCSS();
    
    // Load Activities
    dc.useEffect(() => {
        const loadActivities = () => {
            try {
                const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
                if (file) {
                    const cache = app.metadataCache.getFileCache(file);
                    const fm = cache?.frontmatter || {};
                    const acts = fm.activities || [];
                    setActivities(acts);
                }
            } catch (e) {
                console.error("Failed to load activities:", e);
            }
            setLoading(false);
        };
        loadActivities();
    }, []);
    
    // Load Values from File (With Persistent Sticky Logic)
    dc.useEffect(() => {
        if (!targetFile || activities.length === 0) return;
        
        const loadValues = () => {
            const fm = getFrontmatterForDate(dateStr);
            const newValues = {};
            const now = Date.now();
            
            activities.forEach(activity => {
                const cacheKey = `${dateStr}-${activity.id}`;
                const pendingData = STICKY_CACHE[cacheKey];
                
                const fieldValue = fm[activity.field];
                
                if (pendingData) {
                    // 1. Has file caught up?
                    if (fieldValue != null && fieldValue == pendingData.value) {
                        delete STICKY_CACHE[cacheKey]; // Synced!
                        newValues[activity.id] = fieldValue;
                    } 
                    // 2. Are we still in the "Trust Local" window? (8 seconds)
                    else if ((now - pendingData.timestamp) < 8000) {
                        newValues[activity.id] = pendingData.value;
                    } 
                    // 3. Timeout expired, revert to file
                    else {
                        delete STICKY_CACHE[cacheKey];
                        newValues[activity.id] = fieldValue !== undefined ? fieldValue : (activity.type === "boolean" ? false : 0);
                    }
                } else {
                    // No pending action, trust file
                    if (fieldValue !== undefined && fieldValue !== null) {
                        newValues[activity.id] = fieldValue;
                    } else {
                        newValues[activity.id] = activity.type === "boolean" ? false : 0;
                    }
                }
            });
            setValues(newValues);
        };
        loadValues();
    }, [targetFile, dateStr, activities, lastUpdate]);
    
    // Save Handler (Updates Global Cache)
    const updateValue = (activity, newValue, immediate = false) => {
        if (activity.managed) return;
        
        // 1. Update UI Instantly
        setValues(prev => ({ ...prev, [activity.id]: newValue }));
        
        // 2. Set Sticky Pending State in GLOBAL CACHE
        const cacheKey = `${dateStr}-${activity.id}`;
        STICKY_CACHE[cacheKey] = {
            value: newValue,
            timestamp: Date.now()
        };
        
        savingRef.current = true;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        const doSave = async () => {
            try { 
                await saveFrontmatterForDate(dateStr, { [activity.field]: newValue }); 
            } catch (e) { console.error(e); }
            setTimeout(() => { savingRef.current = false; }, 500);
        };

        if (immediate) {
            doSave();
        } else {
            saveTimeoutRef.current = setTimeout(doSave, 600);
        }
    };
    
    // ⚠️ FIXED: Reads from STICKY_CACHE to get the true latest value
    const handleDragEnd = (activity) => {
        const cacheKey = `${dateStr}-${activity.id}`;
        const cached = STICKY_CACHE[cacheKey];
        
        // If we have a cached value (from the drag that just finished), use it.
        // Otherwise fall back to state.
        const valToSave = cached ? cached.value : values[activity.id];
        
        if (valToSave !== undefined) {
            updateValue(activity, valToSave, true); // Immediate Save
        }
    };

    const handleQuickAdd = (activity) => {
        if (!activity.increment || activity.managed) return;
        const currentValue = values[activity.id] || 0;
        updateValue(activity, currentValue + activity.increment, true);
    };
    
    const handleQuickSubtract = (activity) => {
        if (!activity.increment || activity.managed) return;
        const currentValue = values[activity.id] || 0;
        updateValue(activity, Math.max(0, currentValue - activity.increment), true);
    };
    
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const success = theme?.["color-success"] || "#10b981";
    
    if (themeLoading || loading) return <div style={{padding: 20, textAlign: "center", color: textMuted}}>Loading...</div>;
    if (activities.length === 0) return <div style={{padding: 20, textAlign: "center", color: textMuted}}>No activities configured.</div>;
    
    return (
        <div style={{
            background: showBackgrounds ? surface : "transparent",
            border: showBackgrounds ? `1px solid ${primary}33` : "none",
            borderRadius: 12, padding: 20, color: text,
        }}>
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: primary }}>📊 Today's Activities</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activities.filter(a => !a.hidden).map((activity) => (
                    <ActivityRow
                        key={activity.id}
                        activity={activity}
                        value={values[activity.id]}
                        onChange={(val) => updateValue(activity, val, false)}
                        onDragEnd={() => handleDragEnd(activity)}
                        onQuickAdd={() => handleQuickAdd(activity)}
                        onQuickSubtract={() => handleQuickSubtract(activity)}
                        theme={theme}
                        primary={primary}
                        textMuted={textMuted}
                        success={success}
                        showBackgrounds={showBackgrounds}
                    />
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Activity Row
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityRow({
    activity,
    value,
    onChange,
    onDragEnd,
    onQuickAdd,
    onQuickSubtract,
    theme,
    primary,
    textMuted,
    success,
    showBackgrounds,
}) {
    const activityColor = activity.color || primary;
    const currentValue = value || 0;
    
    let progress = 0;
    let goalReached = false;
    
    if (activity.type === "value" && activity.goal) {
        progress = Math.min((currentValue / activity.goal) * 100, 100);
        goalReached = currentValue >= activity.goal;
    } else if (activity.type === "rating" && activity.max) {
        progress = (currentValue / activity.max) * 100;
        goalReached = currentValue >= activity.max;
    } else if (activity.type === "boolean") {
        progress = currentValue ? 100 : 0;
        goalReached = currentValue;
    }
    
    const formatValue = () => {
        if (activity.type === "boolean") return currentValue ? "Yes" : "No";
        if (activity.type === "rating") return `${currentValue} / ${activity.max || 5}`;
        if (activity.goal) return `${currentValue} / ${activity.goal} ${activity.unit || ""}`;
        return `${currentValue} ${activity.unit || ""}`;
    };
    
    // Theme vars
    const barSprite = theme["bar-sprite"] || null;
    const barSpriteWidth = theme["bar-sprite-width"] || 34;
    const barSpriteHeight = theme["bar-sprite-height"] || 21;
    const barTrackBg = theme["bar-track-bg"] || `${activityColor}22`;
    
    const buttonSprite = theme["button-sprite"] || null;
    const buttonSpriteWidth = theme["button-sprite-width"];
    const buttonSpriteHeight = theme["button-sprite-height"];
    
    const renderInput = () => {
        if (activity.managed) {
            const managedMax = activity.type === "rating" ? (activity.max || 5) : (activity.goal || 100);
            return (
                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                    <GloBar
                        value={currentValue} max={managedMax} draggable={false}
                        showSprite={true} sprite={barSprite} spriteWidth={barSpriteWidth} spriteHeight={barSpriteHeight}
                        fillGradient={`linear-gradient(90deg, ${activityColor}, ${activityColor}aa)`}
                        trackBg={barTrackBg}
                        height="14px"
                    />
                    <GloBadge variant="outlined" size="small" color={textMuted}>managed</GloBadge>
                </div>
            );
        }
        
        switch (activity.type) {
            case "value":
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 200px" }}>
                            <GloBar
                                value={currentValue}
                                max={(activity.goal || 100) * 1.5}
                                draggable={true}
                                onChange={onChange}
                                onDragEnd={onDragEnd} 
                                showSprite={true}
                                sprite={barSprite}
                                spriteWidth={barSpriteWidth}
                                spriteHeight={barSpriteHeight}
                                fillGradient={`linear-gradient(90deg, ${activityColor}, ${activityColor}aa)`}
                                trackBg={barTrackBg}
                                height="14px"
                            />
                        </div>
                        {activity.increment && (
                            <div style={{ display: "flex", gap: 4 }}>
                                <GloButton 
                                    label={`-${activity.increment}`} size="small" onClick={onQuickSubtract} variant="primary"
                                    showSprite={!!buttonSprite} sprite={buttonSprite} spriteWidth={buttonSpriteWidth} spriteHeight={buttonSpriteHeight}
                                />
                                <GloButton 
                                    label={`+${activity.increment}`} size="small" onClick={onQuickAdd} variant="primary"
                                    showSprite={!!buttonSprite} sprite={buttonSprite} spriteWidth={buttonSpriteWidth} spriteHeight={buttonSpriteHeight}
                                />
                            </div>
                        )}
                    </div>
                );
                
            case "rating":
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 150px" }}>
                            <GloBar
                                value={currentValue} max={activity.max || 5} draggable={true}
                                onChange={(val) => onChange(Math.round(val))}
                                onDragEnd={onDragEnd}
                                showSprite={true} sprite={barSprite} spriteWidth={barSpriteWidth} spriteHeight={barSpriteHeight}
                                fillGradient={`linear-gradient(90deg, ${activityColor}, ${activityColor}aa)`}
                                trackBg={barTrackBg} height="14px"
                            />
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                            {Array.from({ length: activity.max || 5 }, (_, i) => (
                                <span key={i} onClick={() => { onChange(i + 1); onDragEnd(); }} style={{ cursor: "pointer", fontSize: 18, opacity: i < currentValue ? 1 : 0.3 }}>⭐</span>
                            ))}
                        </div>
                    </div>
                );
                
            case "boolean":
                return (
                    <GloToggle
                        targetKey={activity.field} onLabel="Done" offLabel="Not yet"
                        showSprite={true} glow={true} width="auto" padding="10px 16px"
                    />
                );
                
            case "count":
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <GloBadge variant="soft" color={activityColor} size="large">{currentValue}</GloBadge>
                        <span style={{ fontSize: 11, color: textMuted }}>(auto-counted)</span>
                    </div>
                );
                
            default: return null;
        }
    };
    
    return (
        <div style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: showBackgrounds ? "rgba(255,255,255,0.02)" : "transparent",
            borderLeft: `4px solid ${goalReached ? success : activityColor}`,
            marginBottom: 8
        }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 140px", minWidth: "140px" }}>
                    <IconPreview icon={activity.icon} size={22} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{activity.label}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{formatValue()}</div>
                    </div>
                </div>
                <div style={{ flex: "10 1 300px", minWidth: "200px" }}>
                    {renderInput()}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 40 }}>
                    {goalReached ? (
                        <GloBadge variant="filled" color={success} size="small">✓</GloBadge>
                    ) : activity.goal && (
                        <span style={{ fontSize: 11, color: activityColor, fontWeight: 600, whiteSpace: "nowrap" }}>{Math.round(progress)}%</span>
                    )}
                </div>
            </div>
        </div>
    );
}

return { Func: ActivityLogger };