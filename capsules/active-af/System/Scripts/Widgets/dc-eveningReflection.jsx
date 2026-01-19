// ═══════════════════════════════════════════════════════════════════════════════
// EVENING REFLECTION WIDGET (Mobile Responsive)
// Tracks evening mood and emotions
// Fixes: Mood rating icons wrap/shrink on mobile, header wrapping
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
const EMPTY_ICON = "○";

const EMOTION_CHIPS = [
    // High Energy / Positive
    { label: "Excited", color: "#FFD700" },
    { label: "Confident", color: "#FFA500" },
    { label: "Grateful", color: "#32CD32" },
    // Low Energy / Positive
    { label: "Calm", color: "#87CEEB" },
    { label: "Content", color: "#40E0D0" },
    { label: "Relieved", color: "#98FB98" },
    // High Energy / Negative
    { label: "Stressed", color: "#FF6347" },
    { label: "Frustrated", color: "#FF4500" },
    { label: "Anxious", color: "#FF69B4" },
    // Low Energy / Negative
    { label: "Tired", color: "#708090" },
    { label: "Sad", color: "#6495ED" },
    { label: "Bored", color: "#A9A9A9" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function EveningReflection({ targetDate }) {
    // ─────────────────────────────────────────────────────────────────────────
    // THEME & SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    
    useComponentCSS();
    
    const dateStr = resolveDateStr(targetDate);
    const file = getFileForDate(dateStr);
    const fm = getFrontmatterForDate(dateStr);

    const primary = theme?.["color-primary"] || "#7c3aed";
    const accent = theme?.["color-accent"] || "#f59e0b";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";

    // ─────────────────────────────────────────────────────────────────────────
    // DATA LOADING
    // ─────────────────────────────────────────────────────────────────────────
    
    const getActivityConfig = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return { icon: "🌙", color: "#A29BFE", label: "Evening Mood" };
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            const activity = activities.find(a => a.id === 'mood-evening');
            
            return {
                icon: activity?.icon || "🌙",
                color: activity?.color || "#A29BFE",
                label: activity?.label || "Evening Mood"
            };
        } catch (e) {
            return { icon: "🌙", color: "#A29BFE", label: "Evening Mood" };
        }
    };

    const activityConfig = getActivityConfig();

// ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const [eveningMood, setEveningMood] = dc.useState(fm["mood-evening"] || 0);
    const [selectedEmotions, setSelectedEmotions] = dc.useState(fm["emotions"] || []);
    const [customInput, setCustomInput] = dc.useState("");
    const [hoveredRating, setHoveredRating] = dc.useState(null);
    
    // 👇👇👇 INSERT THIS BLOCK 👇👇👇
    // When the date changes, refresh the state from the new frontmatter
    dc.useEffect(() => {
        const newFm = getFrontmatterForDate(dateStr);
        setEveningMood(newFm["mood-evening"] || 0);
        setSelectedEmotions(newFm["emotions"] || []);
        setCustomInput(""); // Clear any typed custom text
    }, [dateStr]);
    // 👆👆👆 END BLOCK 👆👆👆
    
    const savingRef = dc.useRef(false);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const saveToFrontmatter = async (updates) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            if (savingRef.current) return;
            savingRef.current = true;
            try { await saveFrontmatterForDate(dateStr, updates); } catch (e) {}
            savingRef.current = false;
        }, 200);
    };

    const handleMoodChange = (value) => {
        setEveningMood(value);
        saveToFrontmatter({ "mood-evening": value, "emotions": selectedEmotions });
    };

    const toggleEmotion = (label) => {
        let newList = selectedEmotions.includes(label) 
            ? selectedEmotions.filter(e => e !== label) 
            : [...selectedEmotions, label];
        setSelectedEmotions(newList);
        saveToFrontmatter({ "mood-evening": eveningMood, "emotions": newList });
    };

    const addCustomEmotion = () => {
        if (customInput.trim() === "") return;
        const label = customInput.trim();
        if (!selectedEmotions.includes(label)) {
            const newList = [...selectedEmotions, label];
            setSelectedEmotions(newList);
            saveToFrontmatter({ "mood-evening": eveningMood, "emotions": newList });
        }
        setCustomInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomEmotion();
        }
    };

    if (themeLoading) return <div>Loading...</div>;

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-COMPONENT: ICON RATING (Mobile Optimized)
    // ─────────────────────────────────────────────────────────────────────────
    
    const IconRating = () => {
        return (
            <div style={{
                display: "flex",
                flexWrap: "wrap", // ⚠️ MOBILE FIX: Allow wrapping
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                justifyContent: "space-between"
            }}>
                {/* Icon + Label (grows to fill space on mobile) */}
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8,
                    flex: "1 1 120px", // Allow shrink/grow
                    minWidth: "120px",
                }}>
                    <span style={{ fontSize: 24 }}>{activityConfig.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: activityConfig.color }}>
                        {activityConfig.label}
                    </span>
                </div>
                
                {/* Icons Container (wraps if needed) */}
                <div style={{ 
                    display: "flex", 
                    gap: 4, // ⚠️ MOBILE FIX: Tighter gap
                    flex: "0 1 auto",
                    justifyContent: "center",
                }}>
                    {[1, 2, 3, 4, 5].map(i => {
                        const isFilled = i <= eveningMood;
                        const isHovered = hoveredRating !== null && i <= hoveredRating;
                        
                        return (
                            <div
                                key={i}
                                onClick={() => handleMoodChange(i)}
                                onMouseEnter={() => setHoveredRating(i)}
                                onMouseLeave={() => setHoveredRating(null)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 22,
                                    cursor: "pointer",
                                    opacity: isFilled || isHovered ? 1 : 0.3,
                                    transform: isHovered ? "scale(1.2)" : "scale(1)",
                                    transition: "all 0.15s ease",
                                    filter: isFilled ? `drop-shadow(0 0 6px ${activityConfig.color})` : "none",
                                }}
                            >
                                {isFilled ? activityConfig.icon : EMPTY_ICON}
                            </div>
                        );
                    })}
                </div>
                
                {/* Score (stays on right or wraps) */}
                <div style={{ 
                    fontSize: 16, 
                    fontWeight: "bold", 
                    color: eveningMood > 0 ? activityConfig.color : textMuted,
                    minWidth: 40,
                    textAlign: "right",
                }}>
                    {eveningMood > 0 ? `${eveningMood}/5` : "-"}
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // COMPONENT HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const EmotionChip = ({ label, color, isActive, onClick }) => {
        const [isHovered, setIsHovered] = dc.useState(false);
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px",
                    border: `1px solid ${isActive ? color : `${textMuted}33`}`,
                    borderRadius: 20,
                    background: isActive ? `${color}22` : (isHovered ? `${textMuted}11` : "transparent"),
                    color: isActive ? text : textMuted,
                    fontSize: 13, cursor: "pointer", transition: "all 0.2s ease",
                    boxShadow: isActive ? `0 0 10px ${hexToRgba(color, 0.4)}` : "none",
                    transform: isHovered ? "translateY(-1px)" : "none",
                }}
            >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, opacity: isActive ? 1 : 0.6 }} />
                {label}
            </button>
        );
    };

    const CustomTag = ({ label, onRemove }) => {
        const [isHovered, setIsHovered] = dc.useState(false);
        return (
            <span
                onClick={onRemove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    fontSize: 12, padding: "4px 10px",
                    background: isHovered ? `${theme?.["color-error"] || "#ff6b6b"}22` : `${textMuted}22`,
                    borderRadius: 6, cursor: "pointer",
                    color: isHovered ? (theme?.["color-error"] || "#ff6b6b") : text,
                    transition: "all 0.2s ease", display: "inline-flex", alignItems: "center", gap: 4,
                }}
            >
                {label} <span style={{ opacity: 0.7 }}>×</span>
            </span>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    const customEmotions = selectedEmotions.filter(e => !EMOTION_CHIPS.find(c => c.label === e));

    return (
        <div style={{
            background: showBackgrounds ? surface : "transparent",
            border: showBackgrounds ? `1px solid ${primary}33` : "none",
            borderRadius: 12, padding: 16, color: text,
        }}>
            {/* Header - Mobile Wrapped */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap", // ⚠️ MOBILE FIX
                gap: 8,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>✨</span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: primary }}>Evening Reflection</h3>
                </div>
                {selectedEmotions.length > 0 && (
                    <GloBadge color={accent} size="small" variant="soft">
                        {selectedEmotions.length} emotion{selectedEmotions.length !== 1 ? 's' : ''}
                    </GloBadge>
                )}
            </div>

            {/* Mood Rating - Now Responsive */}
            <div style={{ background: showBackgrounds ? surfaceAlt : `${primary}11`, borderRadius: 10, padding: "4px 12px", marginBottom: 16 }}>
                <IconRating />
            </div>

            {/* Emotion Chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>
                {EMOTION_CHIPS.map(chip => (
                    <EmotionChip key={chip.label} label={chip.label} color={chip.color} isActive={selectedEmotions.includes(chip.label)} onClick={() => toggleEmotion(chip.label)} />
                ))}
            </div>

            {/* Custom Input */}
            <div style={{ borderTop: `1px solid ${textMuted}22`, paddingTop: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: customEmotions.length > 0 ? 10 : 0 }}>
                    <input type="text" placeholder="+ Add custom emotion..." value={customInput} onChange={(e) => setCustomInput(e.target.value)} onKeyDown={handleKeyDown}
                        style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px dashed ${textMuted}44`, color: text, padding: "6px 0", fontSize: 13, outline: "none" }}
                    />
                    {customInput.trim() && <GloButton label="Add" size="small" onClick={addCustomEmotion} style={{ padding: "4px 12px" }} />}
                </div>
                
                {customEmotions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {customEmotions.map(e => <CustomTag key={e} label={e} onRemove={() => toggleEmotion(e)} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

return { Func: EveningReflection };