// ═══════════════════════════════════════════════════════════════════════════════
// TODAY'S WORKOUT WIDGET (History Logging)
// saves the specific workout plan to the daily note so history is preserved.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloToggle } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

const { GloButton, useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const resolveDisplayName = (raw) => {
    if (!raw) return "Unknown";
    let val = raw;
    if (typeof raw === 'object' && raw !== null) {
        if (raw.link) val = raw.link;
        else if (raw.fileName && typeof raw.fileName === 'function') val = raw.fileName();
        else if (raw.path) val = raw.path;
    }
    const str = String(val);
    return str.replace(/\[\[(?:.*?\|)?(.*?)\]\]/g, "$1").replace(/[\[\]]/g, "");
};

const resolveLinkPath = (raw) => {
    if (!raw) return "";
    let val = raw;
    if (typeof raw === 'object' && raw !== null) {
        if (raw.link) val = raw.link;
        else if (raw.path) val = raw.path;
        else if (raw.file && raw.file.path) val = raw.file.path;
    }
    const str = String(val);
    return str.replace(/\[\[(.*?)(?:\|.*)?\]\]/g, "$1").replace(/[\[\]]/g, "");
};

const PLANNER_PATH = "System/Planners/Exercise Planner.md";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function WorkoutWidget({ targetDate }) {
    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    useComponentCSS();
    
    const dateStr = resolveDateStr(targetDate);
    const targetFileObj = getFileForDate(dateStr); 
    const fm = getFrontmatterForDate(dateStr);

    // ─────────────────────────────────────────────────────────────────────────
    // COLORS
    // ─────────────────────────────────────────────────────────────────────────
    
    const primary = theme?.["color-primary"] || "#7c3aed";
    const accent = theme?.["color-accent"] || "#f59e0b";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    const warning = theme?.["color-warning"] || "#f59e0b";
    const info = theme?.["color-info"] || "#3b82f6";
    const error = theme?.["color-red"] || "#ef4444";
    
    // ─────────────────────────────────────────────────────────────────────────
    // DATA LOADING
    // ─────────────────────────────────────────────────────────────────────────
    
    const pages = dc.useQuery("@page");
    
    if (themeLoading || !pages) {
        return <div style={{ padding: 20, textAlign: "center", color: textMuted }}>Loading...</div>;
    }

    const plannerNote = pages.find(p => p.$path.endsWith(PLANNER_PATH));

    if (!plannerNote) {
        return (
            <div style={{ padding: 16, border: `1px solid ${error}`, color: error, textAlign: "center" }}>
                ⚠️ Planner not found: <br/><code>{PLANNER_PATH}</code>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULE & LOGIC (The Fix)
    // ─────────────────────────────────────────────────────────────────────────
    
    const [isCompleted, setIsCompleted] = dc.useState(fm["workout-completed"] || false);
    
    dc.useEffect(() => {
        setIsCompleted(fm["workout-completed"] || false);
    }, [fm["workout-completed"]]);
    
    const dayName = moment(dateStr).format('dddd').toLowerCase(); 
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // 1. CHECK HISTORY FIRST (Did we log a specific workout for this date?)
    let workoutLink = fm["exercise"];

    // 2. FALLBACK TO SCHEDULE (If nothing logged, check the planner)
    if (!workoutLink) {
        const scheduleKey = `schedule-${dayName}`;
        workoutLink = plannerNote.value(scheduleKey);
    }

    // Rest Day View
    if (!workoutLink) {
        return (
            <div style={{
                padding: 20,
                borderRadius: 12,
                background: showBackgrounds ? surface : "transparent",
                border: showBackgrounds ? `1px dashed ${textMuted}44` : "none",
                textAlign: "center",
                color: text,
            }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🧘</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: primary, marginBottom: 4 }}>Rest Day</div>
                <div style={{ fontSize: 12, color: textMuted }}>No workout scheduled for {dayNameCapitalized}</div>
            </div>
        );
    }

    // Resolve Workout Page
    const workoutPath = resolveLinkPath(workoutLink);
    const workoutPage = pages.find(p => p.$path === workoutPath || p.$path.endsWith(workoutPath) || p.$name === workoutPath);

    if (!workoutPage) {
        return (
            <div style={{ padding: 16, color: textMuted }}>
                ⚠️ Plan file not found: <strong>{workoutPath}</strong>
            </div>
        );
    }

    const focus = workoutPage.value("focus") || "Fitness";
    const duration = workoutPage.value("duration") || 0;
    const exercises = workoutPage.value("exercises") || [];
    const warmup = workoutPage.value("warmup") || [];
    const cooldown = workoutPage.value("cooldown") || [];

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const handleCompletionChange = async (completed) => {
        setIsCompleted(completed);
        
        // ⚠️ LOGGING MAGIC: Save the workout name so history is preserved
        await saveFrontmatterForDate(dateStr, {
            "exercise-minutes": completed ? (Number(duration) || 0) : 0,
            "exercise": completed ? `[[${workoutPage.$name}]]` : null // Saves link on done, clears on undo
        });

        if (completed) new Notice(`Logged: ${workoutPage.$name} (${duration} min)`);
    };

    const handleLinkClick = (e, rawItem) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const path = resolveLinkPath(rawItem);
        if (path && path !== "undefined") {
            app.workspace.openLinkText(path, "", false);
        } else {
            console.warn("Could not resolve path for:", rawItem);
            new Notice("Could not find note path");
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const renderSimpleList = (items, color, title, icon) => (
        <div style={{ marginBottom: 12, padding: 10, background: showBackgrounds ? `${color}11` : "transparent", borderRadius: 8, borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: color, marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{icon}</span><span>{title}</span>
            </div>
            {items.map((item, i) => {
                const displayName = resolveDisplayName(item);
                return (
                    <div key={i} style={{ fontSize: 12, opacity: 0.9, marginBottom: 3, paddingLeft: 4, display: "flex", gap: 6 }}>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span 
                            onClick={(e) => handleLinkClick(e, item)}
                            style={{ cursor: "pointer", textDecoration: "underline", textDecorationColor: `${color}44` }}
                            onMouseEnter={(e) => e.target.style.color = color}
                            onMouseLeave={(e) => e.target.style.color = "inherit"}
                        >
                            {displayName}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    return (
        <div style={{
            padding: 16,
            borderRadius: 12,
            background: showBackgrounds ? surface : "transparent",
            borderLeft: `4px solid ${isCompleted ? success : primary}`,
            border: showBackgrounds ? `1px solid ${isCompleted ? success : primary}33` : "none",
            borderLeftWidth: 4,
            color: text,
            transition: "all 0.3s ease",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <span style={{ fontSize: 28 }}>{isCompleted ? "✅" : "🏋️"}</span>
                    <div>
                        <h3 
                            onClick={(e) => handleLinkClick(e, workoutPage.$path)}
                            style={{ margin: 0, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                        >
                            {workoutPage.$name}
                        </h3>
                        <div style={{ fontSize: 11, color: textMuted, textTransform: "uppercase", marginTop: 2 }}>
                            {dayNameCapitalized} • {duration} min
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {targetFileObj ? (
                        <GloToggle
                            targetKey="workout-completed"
                            targetFile={targetFileObj.path}
                            onLabel="Done!"
                            offLabel="Mark Done"
                            onSub="Workout complete"
                            offSub="Tap to complete"
                            width="150px"
                            padding="8px 12px"
                            onChange={handleCompletionChange}
                        />
                    ) : (
                        <span style={{fontSize: 10, color: error}}>Create Daily Note</span>
                    )}
                </div>
            </div>

            {/* Focus */}
            <div style={{ fontSize: 13, marginBottom: 12, padding: "8px 10px", background: showBackgrounds ? `${primary}11` : "transparent", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🎯</span><span style={{ color: textMuted }}>Focus:</span><strong style={{ color: primary }}>{focus}</strong>
            </div>

            {/* Sections */}
            {warmup.length > 0 && renderSimpleList(warmup, warning, "Warm Up", "🔥")}
            
            {exercises.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: primary, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>💪</span><span>Exercises</span><GloBadge variant="soft" color={primary} size="small">{exercises.length}</GloBadge>
                    </div>
                    {exercises.map((ex, i) => {
                        const displayName = resolveDisplayName(ex);
                        const sets = ex?.sets || null;
                        const reps = ex?.reps || null;
                        const weight = ex?.weight || null;

                        return (
                            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "8px 10px", background: showBackgrounds ? `${text}05` : "transparent", borderRadius: 6, borderLeft: `2px solid ${primary}44` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ opacity: 0.4, fontSize: 11, width: 16, textAlign: "right" }}>{i + 1}.</span>
                                    <span 
                                        onClick={(e) => handleLinkClick(e, ex)}
                                        style={{ fontWeight: 600, fontSize: 13, cursor: "pointer", borderBottom: "1px dotted transparent" }}
                                        onMouseEnter={(e) => { e.target.style.color = primary; e.target.style.borderBottomColor = primary; }}
                                        onMouseLeave={(e) => { e.target.style.color = "inherit"; e.target.style.borderBottomColor = "transparent"; }}
                                    >
                                        {displayName}
                                    </span>
                                </div>
                                {(sets || reps || weight) && (
                                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: textMuted, marginLeft: 24 }}>
                                        {sets && <span>🔢 <strong style={{ color: accent }}>{sets}</strong> sets</span>}
                                        {reps && <span>🔁 <strong style={{ color: accent }}>{reps}</strong> reps</span>}
                                        {weight && <span>⚖️ {weight}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {cooldown.length > 0 && renderSimpleList(cooldown, info, "Cool Down", "❄️")}
        </div>
    );
}

return { Func: WorkoutWidget };