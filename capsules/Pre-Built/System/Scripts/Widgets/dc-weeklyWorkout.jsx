// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY WORKOUT SCHEDULER (Themed Native Select V2)
// Manages weekly workout schedule and exercise goals
// Targets: System/Planners/Exercise Planner.md
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

const { GloInput } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloInput.jsx")
);

const { GloBar } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBar.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_PATH = "System/Settings.md";
const PLANNER_PATH = "System/Planners/Exercise Planner.md"; 
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Themed Native Select
// Uses CSS Variables + JS Hover states to mimic Glo Components
// ═══════════════════════════════════════════════════════════════════════════════

function NativeSelect({ value, options, onChange, theme, style }) {
    // STATE: Track hover locally since we can't use :hover in inline styles
    const [isHovered, setIsHovered] = dc.useState(false);
    const [isFocused, setIsFocused] = dc.useState(false);

    // THEME & COLORS
    const primary = theme?.["color-primary"] || "var(--interactive-accent)";
    const text = theme?.["color-text"] || "var(--text-normal)";
    const radius = theme?.["button-radius"] || "var(--input-radius)";
    
    // Dynamic Styles
    // 1. Background: Use theme prop if available, otherwise fallback to Obsidian's standard input bg
    const bgNormal = theme?.["input-bg"] || "var(--background-modifier-form-field)";
    // 2. Hover: Slightly lighter/different version of the background
    const bgHover = theme?.["input-bg-hover"] || "var(--background-modifier-hover)";
    
    const borderNormal = theme?.["input-border"] || "var(--background-modifier-border)";
    const borderFocus = primary;

    return (
        <div style={{ position: "relative", width: "100%", ...style }}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: "100%",
                    // Match GloInput padding
                    padding: "8px 30px 8px 12px", 
                    fontSize: "13px",
                    fontFamily: "var(--font-ui)",
                    
                    // COLORS
                    color: text,
                    // Dynamic background based on hover state
                    background: isHovered ? bgHover : bgNormal,
                    
                    // BORDERS
                    border: `1px solid ${isFocused ? borderFocus : borderNormal}`,
                    borderRadius: radius,
                    
                    // SHADOWS
                    boxShadow: isFocused 
                        ? `0 0 0 2px ${primary}44` 
                        : "none",
                    
                    // RESET NATIVE STYLES
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",       
                    WebkitAppearance: "none", 
                    transition: "all 0.2s ease"
                }}
            >
                {options.map((opt, i) => (
                    <option 
                        key={i} 
                        value={opt.value}
                        style={{
                            // Dropdown list background (OS Dependent, but this usually sets the color)
                            backgroundColor: "var(--background-primary)",
                            color: "var(--text-normal)",
                        }}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
            
            {/* Custom SVG Arrow */}
            <div style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                opacity: 0.8
            }}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function WeeklyScheduler() {
    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    useComponentCSS();
    
    // File Target
    const plannerFile = app.vault.getAbstractFileByPath(PLANNER_PATH);
    const cache = plannerFile ? app.metadataCache.getFileCache(plannerFile) : null;
    const frontmatter = cache?.frontmatter || {};
    
    // State
    const [localChanges, setLocalChanges] = dc.useState({});
    const [showGoals, setShowGoals] = dc.useState(false);
    const [localGoals, setLocalGoals] = dc.useState(null);
    
    // Colors - Mapping to CSS Variables for consistency
    const primary = theme?.["color-primary"] || "var(--interactive-accent)";
    const accent = theme?.["color-accent"] || "var(--text-accent)";
    const surface = theme?.["color-surface"] || "var(--background-secondary)";
    const text = theme?.["color-text"] || "var(--text-normal)";
    const textMuted = theme?.["color-text-muted"] || "var(--text-muted)";
    const success = theme?.["color-success"] || "var(--color-green)";
    const error = theme?.["color-red"] || "var(--color-red)";
    
    const buttonIdleBg = theme?.["button-idle-bg"] || null;
    const buttonHoverBg = theme?.["button-hover-bg"] || null;
    const buttonActiveBg = theme?.["button-active-bg"] || null;

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIC
    // ─────────────────────────────────────────────────────────────────────────
    
    const getGoalsFromSettings = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return null;
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            return {
                daysPerWeek: activities.find(a => a.id === 'workout-days')?.goal || 4,
                minutesPerDay: activities.find(a => a.id === 'exercise-minutes')?.goal || 45
            };
        } catch (e) { return null; }
    };

    const settingsGoals = getGoalsFromSettings();
    const goals = localGoals || settingsGoals || { daysPerWeek: 4, minutesPerDay: 45 };

    const getServerValue = (day) => {
        const raw = frontmatter[`schedule-${day}`] || frontmatter[`schedule-${day.toLowerCase()}`];
        if (!raw) return "";
        let str = (typeof raw === 'object' && raw.path) ? raw.path : (typeof raw === 'string' ? raw : "");
        if (str.endsWith(".md")) str = str.slice(0, -3);
        return str.replace(/[\[\]"]/g, "").trim();
    };

    const allFiles = app.vault.getMarkdownFiles();
    const plans = allFiles.filter(f => {
        const fCache = app.metadataCache.getFileCache(f);
        const fFm = fCache?.frontmatter;
        if (!fFm) return false;
        const hasTag = fFm.tags && (Array.isArray(fFm.tags) ? fFm.tags.includes('workout-plan') : fFm.tags === 'workout-plan');
        const hasCategory = fFm.categories && JSON.stringify(fFm.categories).includes("Workout Plan");
        return hasTag || hasCategory;
    }).map(f => f.basename).sort();

    const planOptions = [
        { value: "", label: "-- Rest Day --" },
        ...plans.map(p => ({ value: p, label: p }))
    ];

    const getScheduledDaysCount = () => {
        return DAYS.filter(day => {
            const val = localChanges[day] !== undefined ? localChanges[day] : getServerValue(day);
            return val && val !== "";
        }).length;
    };
    
    const scheduledDays = getScheduledDaysCount();
    const progressPercent = Math.min((scheduledDays / goals.daysPerWeek) * 100, 100);
    const goalMet = scheduledDays >= goals.daysPerWeek;

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const updateSchedule = async (day, planName) => {
        if (!plannerFile) { new Notice(`❌ Error: ${PLANNER_PATH} not found.`); return; }
        setLocalChanges(prev => ({ ...prev, [day]: planName }));
        await app.fileManager.processFrontMatter(plannerFile, (fm) => {
            const key = `schedule-${day}`;
            if (planName === "") delete fm[key]; 
            else fm[key] = `[[${planName}]]`; 
        });
    };

    const updateGoal = async (activityId, newGoal) => {
        const numGoal = Number(newGoal) || 0;
        setLocalGoals(prev => {
            const current = prev || goals;
            const updated = { ...current };
            if (activityId === 'workout-days') updated.daysPerWeek = numGoal;
            else if (activityId === 'exercise-minutes') updated.minutesPerDay = numGoal;
            return updated;
        });
        
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) { new Notice("Settings.md not found!"); return; }
            await app.fileManager.processFrontMatter(settingsFile, (fm) => {
                const activities = fm.activities || [];
                const idx = activities.findIndex(a => a.id === activityId);
                if (idx !== -1) {
                    activities[idx].goal = numGoal;
                    fm.activities = activities;
                }
            });
        } catch (e) { new Notice("Failed to save goal"); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    if (themeLoading) return <div>Loading...</div>;

    if (!plannerFile) {
        return (
            <div style={{ padding: 16, border: `1px solid ${error}`, borderRadius: 8, background: `${error}15`, color: error, textAlign: "center" }}>
                <strong>⚠️ Planner Not Found</strong>
                <p style={{ margin: "8px 0 0 0", fontSize: 13, color: text }}>
                    Please create: <code style={{ fontSize: 12 }}>{PLANNER_PATH}</code>
                </p>
            </div>
        );
    }
    
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 16,
            background: showBackgrounds ? surface : "transparent",
            borderRadius: 12,
            border: showBackgrounds ? `1px solid ${primary}33` : "none",
            color: text,
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🗓️</span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: primary }}>
                        Weekly Schedule
                    </h3>
                </div>
                <GloButton
                    label={showGoals ? "✕ Close" : "⚙️ Goals"}
                    size="small"
                    onClick={() => setShowGoals(!showGoals)}
                    bg={showGoals ? buttonActiveBg : buttonIdleBg}
                    hoverBg={buttonHoverBg}
                    activeBg={buttonActiveBg}
                    style={{ fontSize: 11, padding: "6px 12px" }}
                />
            </div>

            {/* Goals */}
            {showGoals && (
                <div style={{ display: "flex", gap: 16, padding: 14, background: `${accent}15`, borderRadius: 8, border: `1px solid ${accent}44`, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 10, color: textMuted, textTransform: "uppercase" }}>Days / Week</label>
                        <GloInput type="number" value={goals.daysPerWeek} onChange={(val) => updateGoal('workout-days', val)} min={1} max={7} size="small" style={{ width: 70 }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 10, color: textMuted, textTransform: "uppercase" }}>Minutes / Day</label>
                        <GloInput type="number" value={goals.minutesPerDay} onChange={(val) => updateGoal('exercise-minutes', val)} min={1} max={300} size="small" style={{ width: 70 }} />
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div style={{ padding: 12, background: showBackgrounds ? `${primary}11` : "transparent", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13 }}>
                    <span>
                        <strong style={{ color: primary }}>{scheduledDays}</strong>
                        <span style={{ color: textMuted }}> / {goals.daysPerWeek} days scheduled</span>
                    </span>
                    {goalMet ? (
                        <GloBadge variant="filled" color={success} size="small">✓ Goal met!</GloBadge>
                    ) : (
                        <span style={{ fontSize: 12, color: textMuted }}>{Math.round(progressPercent)}%</span>
                    )}
                </div>
                <GloBar value={scheduledDays} max={goals.daysPerWeek} draggable={false} showSprite={true} showValue={false} height="10px" fillGradient={goalMet ? `linear-gradient(90deg, ${success}, ${success}cc)` : `linear-gradient(90deg, ${primary}, ${accent})`} />
            </div>
            
            {/* Schedule Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DAYS.map(day => {
                    const fileValue = getServerValue(day);
                    const displayValue = localChanges[day] !== undefined ? localChanges[day] : fileValue;
                    const hasWorkout = displayValue && displayValue !== "";
                    
                    let dayOptions = [...planOptions];
                    if (displayValue && !plans.includes(displayValue)) {
                        dayOptions.push({ value: displayValue, label: displayValue });
                    }
                    
                    return (
                        <div key={day} style={{
                            display: "grid",
                            gridTemplateColumns: "100px 1fr",
                            alignItems: "center",
                            gap: 10,
                        }}>
                            {/* Day Label */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                justifyContent: "flex-end",
                                fontSize: 13,
                                fontWeight: 600,
                                color: hasWorkout ? primary : `${textMuted}88`, 
                                textTransform: "capitalize",
                                transition: "color 0.2s"
                            }}>
                                <span style={{ opacity: hasWorkout ? 1 : 0.5 }}>
                                    {hasWorkout ? "💪" : "😴"}
                                </span>
                                <span>{day}</span>
                            </div>
                            
                            {/* THEMED NATIVE SELECT */}
                            <NativeSelect
                                value={displayValue}
                                options={dayOptions}
                                onChange={(val) => updateSchedule(day, val)}
                                theme={theme} 
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

return { Func: WeeklyScheduler };