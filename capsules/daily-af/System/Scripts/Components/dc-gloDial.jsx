// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-DIAL - Global Themed Circular Dial/Time Input Component
// A mobile-optimized circular input for time, angles, or percentages
// Features: Touch-friendly, theme-aware, trail effects, sprite knob
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get touch/mouse coordinates
// ─────────────────────────────────────────────────────────────────────────────
const getEventXY = (e) => {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Parse time string to minutes
// ─────────────────────────────────────────────────────────────────────────────
const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours * 60) + (minutes || 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Format minutes to time string
// ─────────────────────────────────────────────────────────────────────────────
const formatMinutesToTime = (totalMins) => {
    const hours = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloDial
// ═══════════════════════════════════════════════════════════════════════════════
function GloDial({
    // Value
    value = "12:00",              // Time string "HH:MM" or number (0-360 for angle, 0-100 for percentage)
    mode = "time",                // "time" | "time12" | "angle" | "percentage"
    
    // Time-specific options
    snapMinutes = 15,             // Snap to intervals (5, 10, 15, 30, 60)
    showAmPm = true,              // Show AM/PM toggle for time modes
    
    // Appearance
    size = "medium",              // "small" (100px) | "medium" (120px) | "large" (150px) | number
    label = null,                 // Label above dial
    showValue = true,             // Show value in center
    showTicks = true,             // Show tick marks
    showTrail = true,             // Show drag trail effect
    
    // Sprite/Knob
    showSprite = true,            // Use theme sprite as knob
    sprite = null,                // Override sprite
    spriteWidth = null,           // Override sprite width
    spriteHeight = null,          // Override sprite height
    
    // Colors
    color = null,                 // Primary color override
    trackColor = null,            // Track/border color override
    
    // Behavior
    disabled = false,             // Disable interaction
    
    // Callbacks
    onChange = null,              // Called with new value
    onDragStart = null,           // Called when drag starts
    onDragEnd = null,             // Called when drag ends
    
    // Overrides
    style = {},                   // Additional container styles
    className = "",               // Additional CSS classes
    flashy = null,                // Override flashy mode
}) {
    const { theme, isLoading } = useTheme();
    const globalFlashyMode = useFlashyMode();
    
    // State
    const [isDragging, setIsDragging] = dc.useState(false);
    const [trail, setTrail] = dc.useState([]);
    const containerRef = dc.useRef(null);
    
    // Load shared CSS
    useComponentCSS();
    
    // Loading state
    if (isLoading) {
        const loadingSize = typeof size === 'number' ? size : (size === 'small' ? 130 : size === 'large' ? 200 : 160);
        return (
            <div style={{ 
                width: loadingSize, 
                height: loadingSize, 
                borderRadius: "50%",
                background: "#2b2b2b",
                opacity: 0.5,
            }} />
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // RESOLVE THEME VALUES
    // ─────────────────────────────────────────────────────────────────────────
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    
    // Colors
    const primaryColor = color || theme["color-primary"] || "#7c3aed";
    const accentColor = theme["color-accent"] || "#f59e0b";
    const surfaceColor = theme["color-surface"] || "#2a2a3e";
    const surfaceAlt = theme["color-background"] || "#1e1e2e";
    const textColor = theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "#a0a0b0";
    
    // Sprite
    const spriteUrl = sprite || theme["bar-sprite"] || null;
    const spWidth = spriteWidth || parseInt(theme["bar-sprite-width"]) || 34;
    const spHeight = spriteHeight || parseInt(theme["bar-sprite-height"]) || 21;
    
    // Size - larger defaults for better touch targets and center content space
    // knobRadius is set to leave ~60px center area for time + AM/PM button
    const sizeConfig = {
        small: { diameter: 130, knobRadius: 48, fontSize: 18, labelSize: 10, ampmSize: 12 },
        medium: { diameter: 160, knobRadius: 60, fontSize: 22, labelSize: 11, ampmSize: 13 },
        large: { diameter: 200, knobRadius: 76, fontSize: 26, labelSize: 12, ampmSize: 14 },
    };
    const sizing = typeof size === 'number' 
        ? { 
            diameter: size, 
            knobRadius: size * 0.38, // Leaves ~24% for center content
            fontSize: size * 0.14, 
            labelSize: size * 0.07,
            ampmSize: size * 0.08,
        }
        : (sizeConfig[size] || sizeConfig.medium);
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALUE PARSING & CONVERSION
    // ─────────────────────────────────────────────────────────────────────────
    
    // Convert value to degrees (0-360)
    const valueToDegrees = () => {
        if (mode === "time" || mode === "time12") {
            const totalMins = parseTimeToMinutes(value);
            // 12-hour dial: 720 minutes = 360 degrees
            return ((totalMins % 720) / 720) * 360;
        } else if (mode === "percentage") {
            return (Number(value) / 100) * 360;
        } else {
            // angle mode
            return Number(value) % 360;
        }
    };
    
    // Convert degrees to value
    const degreesToValue = (deg, isPm = null) => {
        if (mode === "time" || mode === "time12") {
            let mins = Math.round((deg / 360) * 720);
            mins = Math.round(mins / snapMinutes) * snapMinutes;
            if (mins >= 720) mins = 0;
            
            let hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            
            // Handle AM/PM
            if (isPm !== null) {
                if (isPm && hours < 12) hours += 12;
                if (!isPm && hours === 12) hours = 0;
            }
            
            return formatMinutesToTime((hours * 60) + minutes);
        } else if (mode === "percentage") {
            return Math.round((deg / 360) * 100);
        } else {
            return Math.round(deg);
        }
    };
    
    const currentDegrees = valueToDegrees();
    const isPm = mode === "time" || mode === "time12" 
        ? parseTimeToMinutes(value) >= 720 || (parseTimeToMinutes(value) >= 0 && Math.floor(parseTimeToMinutes(value) / 60) >= 12)
        : false;
    
    // Knob position
    const rad = (currentDegrees - 90) * (Math.PI / 180);
    const knobX = 50 + sizing.knobRadius * Math.cos(rad) * (100 / sizing.diameter);
    const knobY = 50 + sizing.knobRadius * Math.sin(rad) * (100 / sizing.diameter);
    const spriteRotation = currentDegrees + 90;
    
    // ─────────────────────────────────────────────────────────────────────────
    // TRAIL ANIMATION
    // ─────────────────────────────────────────────────────────────────────────
    const addToTrail = (deg) => {
        if (!effectsEnabled || !showTrail) return;
        const now = Date.now();
        setTrail(prev => [...prev, { deg, time: now }].slice(-12));
    };
    
    dc.useEffect(() => {
        if (trail.length === 0) return;
        const interval = setInterval(() => {
            const now = Date.now();
            setTrail(prev => prev.filter(t => now - t.time < 600));
        }, 50);
        return () => clearInterval(interval);
    }, [trail.length > 0]);
    
    // ─────────────────────────────────────────────────────────────────────────
    // DRAG HANDLING
    // ─────────────────────────────────────────────────────────────────────────
    const handleDrag = (e) => {
        if (disabled) return;
        
        // Prevent scrolling on mobile
        if (e.cancelable && (e.type === 'touchmove' || e.type === 'touchstart')) {
            e.preventDefault();
        }
        
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const point = getEventXY(e);
        
        let angle = Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
        angle = angle + 90;
        if (angle < 0) angle += 360;
        
        addToTrail(angle);
        
        const newValue = degreesToValue(angle, isPm);
        if (onChange) onChange(newValue);
    };
    
    const handleDragStart = (e) => {
        if (disabled) return;
        setIsDragging(true);
        handleDrag(e);
        if (onDragStart) onDragStart();
    };
    
    const handleDragEnd = () => {
        setIsDragging(false);
        if (onDragEnd) onDragEnd();
    };
    
    const toggleAmPm = (e) => {
        if (disabled) return;
        e.stopPropagation();
        
        if (mode !== "time" && mode !== "time12") return;
        
        const totalMins = parseTimeToMinutes(value);
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        
        let newHours = hours;
        if (hours >= 12) {
            newHours = hours - 12;
        } else {
            newHours = hours + 12;
        }
        
        const newValue = formatMinutesToTime((newHours * 60) + mins);
        if (onChange) onChange(newValue);
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DISPLAY VALUE
    // ─────────────────────────────────────────────────────────────────────────
    const getDisplayValue = () => {
        if (mode === "time" || mode === "time12") {
            const totalMins = parseTimeToMinutes(value);
            const hours = Math.floor(totalMins / 60);
            const mins = totalMins % 60;
            const displayHours = mode === "time12" ? (hours % 12) || 12 : hours;
            return `${displayHours}:${String(mins).padStart(2, '0')}`;
        } else if (mode === "percentage") {
            return `${value}%`;
        } else {
            return `${value}°`;
        }
    };
    
    const getAmPmDisplay = () => {
        if (mode !== "time" && mode !== "time12") return null;
        const totalMins = parseTimeToMinutes(value);
        return Math.floor(totalMins / 60) >= 12 ? "PM" : "AM";
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOUCH TARGET SIZE
    // ─────────────────────────────────────────────────────────────────────────
    // Ensure the knob has at least 44px touch target
    const minTouchTarget = 44;
    const knobTouchPadX = Math.max(0, (minTouchTarget - spWidth) / 2);
    const knobTouchPadY = Math.max(0, (minTouchTarget - spHeight) / 2);
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div 
            className={`dc-glo-dial ${className}`.trim()}
            style={{ 
                textAlign: "center", 
                width: sizing.diameter,
                opacity: disabled ? 0.5 : 1,
                ...style,
            }}
        >
            {/* Label */}
            {label && (
                <div style={{ 
                    fontSize: sizing.labelSize, 
                    color: mutedColor, 
                    marginBottom: 8, 
                    textTransform: "uppercase", 
                    letterSpacing: 1,
                }}>
                    {label}
                </div>
            )}
            
            {/* Dial */}
            <div
                ref={containerRef}
                style={{
                    width: sizing.diameter,
                    height: sizing.diameter,
                    borderRadius: "50%",
                    border: `2px solid ${isDragging ? primaryColor : (trackColor || `${primaryColor}44`)}`,
                    background: surfaceAlt,
                    position: "relative",
                    cursor: disabled ? "not-allowed" : "pointer",
                    userSelect: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: isDragging && effectsEnabled 
                        ? `0 0 20px ${hexToRgba(primaryColor, 0.4)}` 
                        : "none",
                    margin: "0 auto",
                    overflow: "hidden",
                    touchAction: "none", // Critical for mobile
                }}
                onMouseDown={handleDragStart}
                onMouseMove={(e) => e.buttons === 1 && isDragging && handleDrag(e)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onClick={handleDrag}
                onTouchStart={handleDragStart}
                onTouchMove={handleDrag}
                onTouchEnd={handleDragEnd}
            >
                {/* Tick Marks */}
                {showTicks && [0, 90, 180, 270].map(deg => (
                    <div 
                        key={deg} 
                        style={{ 
                            position: "absolute", 
                            width: 2, 
                            height: 8, 
                            background: `${mutedColor}44`, 
                            left: "50%", 
                            top: 4, 
                            transformOrigin: `50% ${sizing.diameter / 2 - 4}px`, 
                            transform: `translateX(-50%) rotate(${deg}deg)`,
                        }} 
                    />
                ))}
                
                {/* Trail Effect */}
                {effectsEnabled && showTrail && trail.map((t, i) => {
                    const trailRad = (t.deg - 90) * (Math.PI / 180);
                    const trailX = 50 + sizing.knobRadius * Math.cos(trailRad) * (100 / sizing.diameter);
                    const trailY = 50 + sizing.knobRadius * Math.sin(trailRad) * (100 / sizing.diameter);
                    const age = (Date.now() - t.time) / 600;
                    
                    return (
                        <div 
                            key={`${t.time}-${i}`} 
                            style={{ 
                                position: "absolute", 
                                left: `${trailX}%`, 
                                top: `${trailY}%`, 
                                transform: `translate(-50%, -50%) scale(${Math.max(0.3, 1 - age)})`, 
                                width: 8, 
                                height: 8, 
                                borderRadius: "50%", 
                                background: primaryColor, 
                                opacity: Math.max(0, 1 - age) * 0.6, 
                                pointerEvents: "none",
                            }} 
                        />
                    );
                })}
                
                {/* Knob/Sprite with expanded touch target */}
                <div 
                    style={{ 
                        position: "absolute", 
                        left: `${knobX}%`, 
                        top: `${knobY}%`, 
                        transform: `translate(-50%, -50%) rotate(${spriteRotation}deg)`, 
                        width: spWidth,
                        height: spHeight,
                        // Expand touch target
                        padding: `${knobTouchPadY}px ${knobTouchPadX}px`,
                        margin: `-${knobTouchPadY}px -${knobTouchPadX}px`,
                        boxSizing: "content-box",
                        transition: isDragging ? "none" : "all 0.1s ease", 
                        filter: isDragging && effectsEnabled 
                            ? `drop-shadow(0 0 8px ${primaryColor})` 
                            : "none", 
                        zIndex: 10, 
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {showSprite && spriteUrl ? (
                        <img 
                            src={spriteUrl} 
                            alt="" 
                            style={{ 
                                width: spWidth, 
                                height: spHeight, 
                                objectFit: "contain", 
                                pointerEvents: "none",
                            }} 
                            draggable={false} 
                        />
                    ) : (
                        <div style={{ 
                            width: Math.max(16, spWidth * 0.5), 
                            height: Math.max(16, spHeight * 0.5), 
                            borderRadius: "50%", 
                            background: primaryColor, 
                            border: "2px solid white",
                            boxShadow: isDragging ? `0 0 10px ${primaryColor}` : "none",
                        }} />
                    )}
                </div>
                
                {/* Center Display */}
                {showValue && (
                    <div style={{ 
                        position: "absolute", 
                        top: "50%", 
                        left: "50%", 
                        transform: "translate(-50%, -50%)", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        pointerEvents: "none",
                    }}>
                        <div style={{ 
                            fontWeight: "bold", 
                            fontSize: sizing.fontSize, 
                            color: textColor,
                        }}>
                            {getDisplayValue()}
                        </div>
                        
                        {/* AM/PM Toggle - Large touch-friendly button */}
                        {showAmPm && (mode === "time" || mode === "time12") && (
                            <div 
                                onClick={toggleAmPm}
                                onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    toggleAmPm(e);
                                }}
                                style={{ 
                                    fontSize: sizing.ampmSize || sizing.labelSize, 
                                    fontWeight: "600",
                                    color: primaryColor, 
                                    background: `${primaryColor}20`, 
                                    border: `1px solid ${primaryColor}40`,
                                    padding: "8px 16px", 
                                    borderRadius: 8, 
                                    marginTop: 6, 
                                    cursor: disabled ? "not-allowed" : "pointer", 
                                    pointerEvents: "auto",
                                    minWidth: 52,
                                    minHeight: 36,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    touchAction: "manipulation",
                                    transition: "all 0.15s ease",
                                    userSelect: "none",
                                }}
                            >
                                {getAmPmDisplay()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

const renderedView = (
    <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: "2rem",
        padding: "1rem",
    }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloDial Component Demo
        </div>
        
        {/* Time mode */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "12px" }}>Time Input (24h)</div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
                <GloDial 
                    label="Bedtime"
                    value="23:00"
                    mode="time"
                    snapMinutes={15}
                    onChange={(v) => console.log("Bedtime:", v)}
                />
                <GloDial 
                    label="Wake Up"
                    value="07:30"
                    mode="time"
                    snapMinutes={15}
                    onChange={(v) => console.log("Wake up:", v)}
                />
            </div>
        </div>
        
        {/* Sizes */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "12px" }}>Sizes</div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "center" }}>
                <GloDial value="09:00" mode="time" size="small" label="Small" />
                <GloDial value="12:00" mode="time" size="medium" label="Medium" />
                <GloDial value="15:00" mode="time" size="large" label="Large" />
            </div>
        </div>
        
        {/* Other modes */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "12px" }}>Other Modes</div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
                <GloDial 
                    label="Angle"
                    value={45}
                    mode="angle"
                    showAmPm={false}
                    onChange={(v) => console.log("Angle:", v)}
                />
                <GloDial 
                    label="Percentage"
                    value={75}
                    mode="percentage"
                    showAmPm={false}
                    onChange={(v) => console.log("Percentage:", v)}
                />
            </div>
        </div>
        
        {/* Without sprite */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "12px" }}>Without Sprite</div>
            <GloDial 
                label="Simple Knob"
                value="10:30"
                mode="time"
                showSprite={false}
            />
        </div>
    </div>
);

return { 
    renderedView, 
    GloDial,
};
