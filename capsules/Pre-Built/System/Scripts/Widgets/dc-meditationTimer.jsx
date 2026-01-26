// ═══════════════════════════════════════════════════════════════════════════════
// MEDITATION TIMER WIDGET
// A self-contained meditation timer with breathing animations
// 
// Features:
//   - Configurable duration and breathing pattern
//   - Multiple animation styles (bubbles, flame, mandala, sacred geometry, etc.)
//   - Color customization with gradient support
//   - Audio cues (start, end, breath)
//   - Session logging to frontmatter
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

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

const { GloSelect } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx")
);

const {
    BreathingCircle,
    animations,
} = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-meditationAnimations.jsx")
);

const { ColorPicker, COLOR_PRESETS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-colorPicker.jsx")
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
const AUDIO_PATH = "System/Assets/Audio/";

// Breath pattern presets
const BREATH_PRESETS = {
    simple: { label: "Simple", breathIn: 4, breathHold: 0, breathOut: 4, breathHoldOut: 0 },
    relaxing: { label: "Relaxing", breathIn: 4, breathHold: 0, breathOut: 6, breathHoldOut: 0 },
    box: { label: "Box Breathing", breathIn: 4, breathHold: 4, breathOut: 4, breathHoldOut: 4 },
    "4-7-8": { label: "4-7-8", breathIn: 4, breathHold: 7, breathOut: 8, breathHoldOut: 0 },
    energizing: { label: "Energizing", breathIn: 2, breathHold: 0, breathOut: 2, breathHoldOut: 0 },
    custom: { label: "Custom", breathIn: 4, breathHold: 0, breathOut: 4, breathHoldOut: 0 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function MeditationTimer({ targetDate }) {
    // ─────────────────────────────────────────────────────────────────────────
    // THEME & SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const { theme, isLoading: themeLoading, settings: themeSettings } = useTheme();
    const showBackgrounds = themeSettings?.widgetBackgrounds !== false;
    
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
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD SETTINGS FROM SETTINGS.MD
    // ─────────────────────────────────────────────────────────────────────────
    
    const getMeditationSettings = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return null;
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            return settingsCache?.frontmatter?.meditation || null;
        } catch (e) {
            console.error("Failed to load meditation settings:", e);
            return null;
        }
    };

    const getActivityConfig = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return { icon: "🧘", color: "#9b59b6", goal: 15 };
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            const activity = activities.find(a => a.id === 'meditation');
            return {
                icon: activity?.icon || "🧘",
                color: activity?.color || "#9b59b6",
                goal: activity?.goal || 15,
            };
        } catch (e) {
            return { icon: "🧘", color: "#9b59b6", goal: 15 };
        }
    };

    const savedSettings = getMeditationSettings();
    const activityConfig = getActivityConfig();

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    // Timer state
    const [isRunning, setIsRunning] = dc.useState(false);
    const [isPaused, setIsPaused] = dc.useState(false);
    const [timeRemaining, setTimeRemaining] = dc.useState((savedSettings?.duration || 10) * 60);
    const [sessionMinutes, setSessionMinutes] = dc.useState(0);
    
    // Breath state
    const [breathPhase, setBreathPhase] = dc.useState("in"); // "in" | "hold-in" | "out" | "hold-out"
    const [breathProgress, setBreathProgress] = dc.useState(0);
    
    // Settings panel
    const [showSettings, setShowSettings] = dc.useState(false);
    
    // Local settings (editable)
    const [duration, setDuration] = dc.useState(savedSettings?.duration || 10);
    const [preset, setPreset] = dc.useState(savedSettings?.preset || "simple");
    const [breathIn, setBreathIn] = dc.useState(savedSettings?.breathIn || 4);
    const [breathHold, setBreathHold] = dc.useState(savedSettings?.breathHold || 0);
    const [breathOut, setBreathOut] = dc.useState(savedSettings?.breathOut || 4);
    const [breathHoldOut, setBreathHoldOut] = dc.useState(savedSettings?.breathHoldOut || 0);
    const [selectedAnimation, setSelectedAnimation] = dc.useState(savedSettings?.animation || "mandala");
    const [colors, setColors] = dc.useState(savedSettings?.colors || [primary, accent]);
    const [audioEnabled, setAudioEnabled] = dc.useState(savedSettings?.audioEnabled !== false);
    const [audioStart, setAudioStart] = dc.useState(savedSettings?.audioStart !== false);
    const [audioEnd, setAudioEnd] = dc.useState(savedSettings?.audioEnd !== false);
    const [audioBreath, setAudioBreath] = dc.useState(savedSettings?.audioBreath || false);
    const [volume, setVolume] = dc.useState(savedSettings?.volume || 0.5);
    
    // Refs
    const timerRef = dc.useRef(null);
    const breathTimerRef = dc.useRef(null);
    const audioRef = dc.useRef(null);
    const startTimeRef = dc.useRef(null);

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIO FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    const playAudio = async (type) => {
        if (!audioEnabled) return;
        
        let audioFile = "";
        if (type === "start" && audioStart) {
            audioFile = savedSettings?.customAudioStart || `${AUDIO_PATH}singing-bowl-struck.mp3`;
        } else if (type === "end" && audioEnd) {
            audioFile = savedSettings?.customAudioEnd || `${AUDIO_PATH}singing-bowl-long.mp3`;
        }
        
        if (!audioFile) return;
        
        try {
            // Check if file exists
            const exists = await app.vault.adapter.exists(audioFile);
            if (!exists) {
                console.warn(`Audio file not found: ${audioFile}`);
                return;
            }
            
            // Get the file and create audio element
            const audioData = await app.vault.adapter.readBinary(audioFile);
            const blob = new Blob([audioData], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            audioRef.current = new Audio(url);
            audioRef.current.volume = volume;
            audioRef.current.play().catch(e => console.warn("Audio playback failed:", e));
        } catch (e) {
            console.error("Failed to play audio:", e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // BREATHING CYCLE
    // ─────────────────────────────────────────────────────────────────────────
    
    dc.useEffect(() => {
        if (!isRunning || isPaused) {
            if (breathTimerRef.current) clearInterval(breathTimerRef.current);
            return;
        }
        
        // Calculate total cycle time
        const cycleDurations = {
            in: breathIn * 1000,
            "hold-in": breathHold * 1000,
            out: breathOut * 1000,
            "hold-out": breathHoldOut * 1000,
        };
        
        let phaseStartTime = Date.now();
        let currentPhase = "in";
        setBreathPhase("in");
        setBreathProgress(0);
        
        const tick = () => {
            const elapsed = Date.now() - phaseStartTime;
            const phaseDuration = cycleDurations[currentPhase];
            
            if (phaseDuration === 0) {
                // Skip this phase
                currentPhase = getNextPhase(currentPhase);
                phaseStartTime = Date.now();
                setBreathPhase(currentPhase);
                setBreathProgress(0);
                return;
            }
            
            const progress = Math.min(elapsed / phaseDuration, 1);
            setBreathProgress(progress);
            
            if (progress >= 1) {
                // Move to next phase
                currentPhase = getNextPhase(currentPhase);
                phaseStartTime = Date.now();
                setBreathPhase(currentPhase);
                setBreathProgress(0);
            }
        };
        
        breathTimerRef.current = setInterval(tick, 50);
        
        return () => {
            if (breathTimerRef.current) clearInterval(breathTimerRef.current);
        };
    }, [isRunning, isPaused, breathIn, breathHold, breathOut, breathHoldOut]);
    
    const getNextPhase = (phase) => {
        const sequence = ["in", "hold-in", "out", "hold-out"];
        const idx = sequence.indexOf(phase);
        return sequence[(idx + 1) % 4];
    };

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN TIMER
    // ─────────────────────────────────────────────────────────────────────────
    
    dc.useEffect(() => {
        if (!isRunning || isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        
        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Timer complete
                    handleComplete();
                    return 0;
                }
                return prev - 1;
            });
            
            // Track session time
            setSessionMinutes(prev => {
                const newVal = Math.floor((Date.now() - startTimeRef.current) / 60000);
                return newVal;
            });
        }, 1000);
        
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, isPaused]);

    // ─────────────────────────────────────────────────────────────────────────
    // TIMER CONTROLS
    // ─────────────────────────────────────────────────────────────────────────
    
    const handleStart = () => {
        setIsRunning(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();
        playAudio("start");
    };
    
    const handlePause = () => {
        setIsPaused(true);
    };
    
    const handleResume = () => {
        setIsPaused(false);
    };
    
    const handleReset = () => {
        setIsRunning(false);
        setIsPaused(false);
        setTimeRemaining(duration * 60);
        setBreathPhase("in");
        setBreathProgress(0);
        setSessionMinutes(0);
        
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
    
    const handleComplete = async () => {
        setIsRunning(false);
        setIsPaused(false);
        playAudio("end");
        
        // Log to frontmatter
        const completedMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
        
        try {
            const currentFm = getFrontmatterForDate(dateStr);
            await saveFrontmatterForDate(dateStr, {
                "meditation-minutes": (currentFm["meditation-minutes"] || 0) + completedMinutes,
                "meditation-sessions": (currentFm["meditation-sessions"] || 0) + 1,
            });
            new Notice(`Meditation complete! ${completedMinutes} min logged 🧘`);
        } catch (e) {
            console.error("Failed to log meditation:", e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SAVE SETTINGS
    // ─────────────────────────────────────────────────────────────────────────
    
    const saveSettings = async () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) {
                new Notice("Settings.md not found!");
                return;
            }
            
            await app.fileManager.processFrontMatter(settingsFile, (fm) => {
                fm.meditation = {
                    duration,
                    breathIn,
                    breathHold,
                    breathOut,
                    breathHoldOut,
                    preset,
                    colors,
                    colorMode: "gradient",
                    animation: selectedAnimation,
                    audioEnabled,
                    audioStart,
                    audioEnd,
                    audioBreath,
                    volume,
                    customAudioStart: savedSettings?.customAudioStart || "",
                    customAudioEnd: savedSettings?.customAudioEnd || "",
                };
            });
            
            // Update time remaining if not running
            if (!isRunning) {
                setTimeRemaining(duration * 60);
            }
            
            new Notice("Meditation settings saved");
        } catch (e) {
            console.error("Failed to save settings:", e);
            new Notice("Failed to save settings");
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PRESET HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    
    const applyPreset = (presetKey) => {
        setPreset(presetKey);
        if (presetKey !== "custom" && BREATH_PRESETS[presetKey]) {
            const p = BREATH_PRESETS[presetKey];
            setBreathIn(p.breathIn);
            setBreathHold(p.breathHold);
            setBreathOut(p.breathOut);
            setBreathHoldOut(p.breathHoldOut);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FORMAT TIME
    // ─────────────────────────────────────────────────────────────────────────
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // BREATH CUE TEXT
    // ─────────────────────────────────────────────────────────────────────────
    
    const getBreathCue = () => {
        switch (breathPhase) {
            case "in": return "Breathe In...";
            case "hold-in": return "Hold...";
            case "out": return "Breathe Out...";
            case "hold-out": return "Hold...";
            default: return "";
        }
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
    // GET ANIMATION COMPONENT
    // ─────────────────────────────────────────────────────────────────────────
    
    const AnimationComponent = animations[selectedAnimation]?.component || animations.mandala.component;

    // ─────────────────────────────────────────────────────────────────────────
    // COMPUTED VALUES
    // ─────────────────────────────────────────────────────────────────────────
    
    const todayMinutes = fm["meditation-minutes"] || 0;
    const todaySessions = fm["meditation-sessions"] || 0;
    const goalProgress = Math.min((todayMinutes / activityConfig.goal) * 100, 100);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    return (
        <div style={{
            background: showBackgrounds ? surface : "transparent",
            border: showBackgrounds ? `1px solid ${primary}33` : "none",
            borderRadius: 16,
            padding: 20,
            color: text,
            maxWidth: 400,
            margin: "0 auto",
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{activityConfig.icon}</span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: primary }}>
                        Meditation
                    </h3>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <GloButton
                        label={showSettings ? "✕" : "⚙️"}
                        size="small"
                        onClick={() => setShowSettings(!showSettings)}
                        style={{ padding: "4px 8px" }}
                    />
                    <span style={{ 
                        fontSize: 20, 
                        fontWeight: "bold", 
                        fontFamily: "var(--font-monospace)",
                        color: isRunning ? (isPaused ? accent : success) : text,
                    }}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>
            </div>

            {/* Settings Panel (Collapsible) */}
            {showSettings && (
                <div style={{
                    background: showBackgrounds ? surfaceAlt : `${primary}11`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                }}>
                    {/* Duration */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: textMuted, width: 80 }}>Duration</span>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            max={120}
                            style={{
                                width: 60,
                                padding: "4px 8px",
                                background: `${primary}22`,
                                border: `1px solid ${primary}44`,
                                borderRadius: 6,
                                color: text,
                                fontSize: 13,
                            }}
                        />
                        <span style={{ fontSize: 12, color: textMuted }}>minutes</span>
                    </div>
                    
                    {/* Breath Pattern */}
                    <div>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Breathing Pattern</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                            {Object.entries(BREATH_PRESETS).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => applyPreset(key)}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: 11,
                                        background: preset === key ? primary : `${textMuted}22`,
                                        color: preset === key ? "#fff" : textMuted,
                                        border: "none",
                                        borderRadius: 12,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {val.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "1fr 1fr", 
                            gap: 8,
                            fontSize: 11,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ color: textMuted }}>In:</span>
                                <input type="number" value={breathIn} onChange={(e) => { setBreathIn(parseInt(e.target.value) || 0); setPreset("custom"); }} min={1} max={20} style={{ width: 40, padding: "2px 4px", background: `${primary}22`, border: `1px solid ${primary}33`, borderRadius: 4, color: text }} />
                                <span style={{ color: textMuted }}>s</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ color: textMuted }}>Hold:</span>
                                <input type="number" value={breathHold} onChange={(e) => { setBreathHold(parseInt(e.target.value) || 0); setPreset("custom"); }} min={0} max={20} style={{ width: 40, padding: "2px 4px", background: `${primary}22`, border: `1px solid ${primary}33`, borderRadius: 4, color: text }} />
                                <span style={{ color: textMuted }}>s</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ color: textMuted }}>Out:</span>
                                <input type="number" value={breathOut} onChange={(e) => { setBreathOut(parseInt(e.target.value) || 0); setPreset("custom"); }} min={1} max={20} style={{ width: 40, padding: "2px 4px", background: `${primary}22`, border: `1px solid ${primary}33`, borderRadius: 4, color: text }} />
                                <span style={{ color: textMuted }}>s</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ color: textMuted }}>Hold:</span>
                                <input type="number" value={breathHoldOut} onChange={(e) => { setBreathHoldOut(parseInt(e.target.value) || 0); setPreset("custom"); }} min={0} max={20} style={{ width: 40, padding: "2px 4px", background: `${primary}22`, border: `1px solid ${primary}33`, borderRadius: 4, color: text }} />
                                <span style={{ color: textMuted }}>s</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Animation */}
                    <div>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Animation</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {Object.entries(animations).map(([key, anim]) => {
                                const AnimPreview = anim.component;
                                const isSelected = selectedAnimation === key;
                                return (
                                    <div
                                        key={key}
                                        onClick={() => setSelectedAnimation(key)}
                                        title={anim.label}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 4,
                                            padding: 6,
                                            background: isSelected ? `${primary}33` : `${textMuted}11`,
                                            border: isSelected ? `2px solid ${primary}` : `1px solid ${textMuted}22`,
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            transform: isSelected ? "scale(1.05)" : "scale(1)",
                                            minWidth: 56,
                                        }}
                                    >
                                        {/* Mini preview */}
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 6,
                                            overflow: "hidden",
                                            background: surfaceAlt,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative",
                                        }}>
                                            <div style={{
                                                transform: "scale(0.28)",
                                                transformOrigin: "center center",
                                            }}>
                                                <AnimPreview
                                                    colors={colors}
                                                    isRunning={isSelected}
                                                    breathPhase="in"
                                                    breathProgress={0.5}
                                                    size={140}
                                                />
                                            </div>
                                        </div>
                                        {/* Label */}
                                        <span style={{
                                            fontSize: 9,
                                            color: isSelected ? primary : textMuted,
                                            textAlign: "center",
                                            lineHeight: 1.1,
                                            maxWidth: 52,
                                        }}>
                                            {anim.icon} {anim.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Colors */}
                    <div>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Animation Colors</div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: textMuted }}>Primary:</span>
                                <ColorPicker
                                    value={colors[0] || primary}
                                    onChange={(newColor) => setColors([newColor, colors[1] || accent])}
                                    size="small"
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: textMuted }}>Secondary:</span>
                                <ColorPicker
                                    value={colors[1] || accent}
                                    onChange={(newColor) => setColors([colors[0] || primary, newColor])}
                                    size="small"
                                />
                            </div>
                            {/* Quick color swap */}
                            <button
                                onClick={() => setColors([colors[1] || accent, colors[0] || primary])}
                                title="Swap colors"
                                style={{
                                    padding: "4px 8px",
                                    fontSize: 12,
                                    background: `${textMuted}22`,
                                    border: `1px solid ${textMuted}33`,
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    color: textMuted,
                                }}
                            >
                                ⇄
                            </button>
                        </div>
                        {/* Color presets */}
                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {[
                                    { label: "Purple/Gold", colors: ["#7c3aed", "#f59e0b"] },
                                    { label: "Blue/Cyan", colors: ["#3b82f6", "#06b6d4"] },
                                    { label: "Pink/Orange", colors: ["#ec4899", "#f97316"] },
                                    { label: "Green/Teal", colors: ["#10b981", "#14b8a6"] },
                                    { label: "Indigo/Rose", colors: ["#6366f1", "#f43f5e"] },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setColors(preset.colors)}
                                        title={preset.label}
                                        style={{
                                            display: "flex",
                                            gap: 2,
                                            padding: 4,
                                            background: (colors[0] === preset.colors[0] && colors[1] === preset.colors[1]) 
                                                ? `${primary}33` : `${textMuted}11`,
                                            border: (colors[0] === preset.colors[0] && colors[1] === preset.colors[1])
                                                ? `1px solid ${primary}` : `1px solid ${textMuted}22`,
                                            borderRadius: 6,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div style={{ 
                                            width: 14, 
                                            height: 14, 
                                            borderRadius: 3, 
                                            background: preset.colors[0],
                                        }} />
                                        <div style={{ 
                                            width: 14, 
                                            height: 14, 
                                            borderRadius: 3, 
                                            background: preset.colors[1],
                                        }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Audio */}
                    <div>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Audio</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: textMuted, cursor: "pointer" }}>
                                <input type="checkbox" checked={audioEnabled} onChange={(e) => setAudioEnabled(e.target.checked)} />
                                Enable
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: textMuted, cursor: "pointer" }}>
                                <input type="checkbox" checked={audioStart} onChange={(e) => setAudioStart(e.target.checked)} disabled={!audioEnabled} />
                                Start
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: textMuted, cursor: "pointer" }}>
                                <input type="checkbox" checked={audioEnd} onChange={(e) => setAudioEnd(e.target.checked)} disabled={!audioEnabled} />
                                End
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 11, color: textMuted }}>Vol:</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    disabled={!audioEnabled}
                                    style={{ width: 60 }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Save Button */}
                    <GloButton
                        label="Save Settings"
                        onClick={saveSettings}
                        size="small"
                        style={{ alignSelf: "flex-end" }}
                    />
                </div>
            )}

            {/* Animation Area */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                minHeight: 220,
                position: "relative",
            }}>
                {/* Breathing Circle (outer) */}
                <div style={{ position: "relative" }}>
                    <BreathingCircle
                        breathPhase={breathPhase}
                        breathProgress={breathProgress}
                        colors={colors}
                        size={200}
                        isRunning={isRunning && !isPaused}
                    />
                    
                    {/* Center Animation */}
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                    }}>
                        <AnimationComponent
                            colors={colors}
                            isRunning={isRunning && !isPaused}
                            breathPhase={breathPhase}
                            breathProgress={breathProgress}
                            size={140}
                        />
                    </div>
                </div>
            </div>

            {/* Breath Cue */}
            {isRunning && (
                <div style={{
                    textAlign: "center",
                    marginBottom: 16,
                    fontSize: 14,
                    color: breathPhase.includes("hold") ? accent : primary,
                    fontStyle: "italic",
                    opacity: 0.9,
                    transition: "color 0.3s ease",
                }}>
                    ~ {getBreathCue()} ~
                </div>
            )}

            {/* Controls */}
            <div style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                marginBottom: 16,
            }}>
                {!isRunning ? (
                    <GloButton
                        label="▶ Start"
                        onClick={handleStart}
                        style={{ flex: 1, maxWidth: 120 }}
                    />
                ) : isPaused ? (
                    <>
                        <GloButton
                            label="▶ Resume"
                            onClick={handleResume}
                            style={{ flex: 1 }}
                        />
                        <GloButton
                            label="↺ Reset"
                            onClick={handleReset}
                            variant="secondary"
                            style={{ flex: 1 }}
                        />
                    </>
                ) : (
                    <>
                        <GloButton
                            label="⏸ Pause"
                            onClick={handlePause}
                            style={{ flex: 1 }}
                        />
                        <GloButton
                            label="↺ Reset"
                            onClick={handleReset}
                            variant="secondary"
                            style={{ flex: 1 }}
                        />
                    </>
                )}
            </div>

            {/* Stats Footer */}
            <div style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                padding: "12px 0",
                borderTop: `1px solid ${textMuted}22`,
                fontSize: 12,
                color: textMuted,
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, color: text }}>{todaySessions}</div>
                    <div>sessions</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, color: text }}>{todayMinutes} min</div>
                    <div>today</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, color: goalProgress >= 100 ? success : text }}>
                        {activityConfig.goal} min
                    </div>
                    <div>goal {goalProgress >= 100 && "✓"}</div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

return { Func: MeditationTimer };
