// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-BAR - Global Themed Progress Bar Component (Vertical & Mobile Touch)
// A fully customizable, theme-aware progress bar with draggable sprite
// Fix: Added 'vertical' prop to support vertical orientation
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, resolveBackground } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get Coordinates
// ─────────────────────────────────────────────────────────────────────────────
const getClientXY = (e) => {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloBar
// ═══════════════════════════════════════════════════════════════════════════════
function GloBar({
    // Value
    value = null,
    max = 100,
    targetKey = null,
    targetFile = null,
    
    // Orientation
    vertical = false,             // ⚠️ NEW: Vertical mode
    
    // Display
    label = null,
    showValue = true,
    valueFormat = null,
    showPercentage = false,
    
    // Sprite
    showSprite = true,
    sprite = null,
    spriteWidth = null,
    spriteHeight = null,
    
    // Animation
    clickAnimation = null,
    clickDuration = null,
    
    // Dragging
    draggable = false,
    step = 1,
    
    // Appearance
    trackBg = null,
    fillGradient = null,
    height = null,                // In vertical mode, this becomes the WIDTH of the bar
    length = null,                // Length of the bar (width if horiz, height if vert)
    borderRadius = null,
    width = "100%",               // Container width

    // Background Sizing (Track)
    trackBgSize = null,           // "auto" | "cover" | "contain" | "50%" | etc.
    trackBgRepeat = null,         // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    trackBgPosition = null,       // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Fill)
    fillBgSize = null,            // "auto" | "cover" | "contain" | "50%" | etc.
    fillBgRepeat = null,          // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    fillBgPosition = null,        // "center" | "top left" | "50% 50%" | etc.

    // Transition Direction (for hover/state change animations)
    transitionDirection = null,   // "none" | "left" | "right" | "top" | "bottom"

    // Callbacks
    onChange = null,
    onDragStart = null,
    onDragEnd = null,

    // Overrides
    style = {},
    className = "",
    flashy = null,

    // Theme Override (for preview purposes in theme editor)
    themeOverride = null,
}) {
    const { theme: loadedTheme, isLoading } = useTheme();
    const theme = themeOverride || loadedTheme;
    const globalFlashyMode = useFlashyMode();
    const current = dc.useCurrentFile();
    
    const [isAnimating, setIsAnimating] = dc.useState(false);
    const [animationClass, setAnimationClass] = dc.useState("");
    const [localValue, setLocalValue] = dc.useState(0);
    
    const barRef = dc.useRef(null);
    const isDraggingRef = dc.useRef(false);
    const dragStartPosRef = dc.useRef({ x: 0, y: 0 });
    const hasDraggedRef = dc.useRef(false);
    const [, forceUpdate] = dc.useState(0);
    const justFinishedDraggingRef = dc.useRef(false);
    
    useComponentCSS();
    
    // ─────────────────────────────────────────────────────────────────────────
    // DATA SYNC
    // ─────────────────────────────────────────────────────────────────────────
    const getValueFromFrontmatter = () => {
        if (!targetKey) return 0;
        if (targetFile) {
            const file = app.vault.getAbstractFileByPath(targetFile);
            if (file) {
                const cache = app.metadataCache.getFileCache(file);
                return cache?.frontmatter?.[targetKey] || 0;
            }
            return 0;
        }
        return current?.value(targetKey) || 0;
    };
    
    const getCurrentValue = () => {
        if (isDraggingRef.current || justFinishedDraggingRef.current) return localValue;
        if (value !== null) return value;
        if (targetKey) return getValueFromFrontmatter();
        return localValue;
    };
    
    const currentValue = getCurrentValue();
    
    dc.useEffect(() => {
        if (justFinishedDraggingRef.current) {
            justFinishedDraggingRef.current = false;
            return;
        }
        if (value !== null) setLocalValue(value);
        else if (targetKey) setLocalValue(getValueFromFrontmatter());
    }, [value, targetKey, targetFile]);
    
    const percentage = Math.min(100, Math.max(0, (currentValue / max) * 100));
    
    if (isLoading) return <div style={{ width, height: "20px", background: "#2b2b2b", borderRadius: "6px", opacity: 0.5 }}></div>;
    
    // ─────────────────────────────────────────────────────────────────────────
    // THEME RESOLUTION
    // ─────────────────────────────────────────────────────────────────────────
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    const spriteUrl = sprite || theme["bar-sprite"] || null;
    const spWidth = spriteWidth || parseInt(theme["bar-sprite-width"]) || 34;
    const spHeight = spriteHeight || parseInt(theme["bar-sprite-height"]) || 21;
    const animation = clickAnimation || theme["bar-sprite-click-animation"] || "squish";
    const animDuration = clickDuration || theme["bar-sprite-click-duration"] || "0.3s";
    const trackBackground = resolveBackground(trackBg, null, theme["bar-track-bg"] || "#1a1a2e");

    // Resolve fill background (handles images, gradients, and colors)
    const fillBgRaw = fillGradient || theme["bar-fill-gradient"] || "linear-gradient(to right, #ff69b4, #ff1493)";
    let fillBackground = resolveBackground(fillGradient, null, theme["bar-fill-gradient"] || "linear-gradient(to right, #ff69b4, #ff1493)");

    // Handle Gradient Direction for Vertical (only if it's a gradient)
    if (vertical && fillBackground.includes("gradient(") && !fillGradient && theme["bar-fill-gradient"]) {
        // Smart-rotate the gradient string if it's default
        fillBackground = fillBackground.replace("to right", "to top");
    }

    // Sizing Logic
    // Horizontal: height is thickness, length is width
    // Vertical: height is thickness (width), length is height
    const barThickness = height || theme["bar-height"] || "14px";
    const barLength = length || (vertical ? "150px" : "100%");
    const barRadius = borderRadius || theme["bar-border-radius"] || "6px";

    const textColor = theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "#888";

    // Background Sizing - Hybrid approach: props override theme defaults
    const trackBgSizeResolved = trackBgSize || theme["bar-track-bg-size"] || "auto";
    const trackBgRepeatResolved = trackBgRepeat || theme["bar-track-bg-repeat"] || "repeat";
    const trackBgPositionResolved = trackBgPosition || theme["bar-track-bg-position"] || "center";

    const fillBgSizeResolved = fillBgSize || theme["bar-fill-bg-size"] || "auto";
    const fillBgRepeatResolved = fillBgRepeat || theme["bar-fill-bg-repeat"] || "repeat";
    const fillBgPositionResolved = fillBgPosition || theme["bar-fill-bg-position"] || "center";

    // Transition Direction
    const transitionDir = transitionDirection || theme["bar-transition-direction"] || "none";

    // Calculate background-position for transition direction
    const getTransitionPositions = (direction) => {
        // Returns [initial, final] background positions for slide-in effect
        switch (direction) {
            case "left":
                return ["-100% center", "center center"];
            case "right":
                return ["200% center", "center center"];
            case "top":
                return ["center -100%", "center center"];
            case "bottom":
                return ["center 200%", "center center"];
            case "none":
            default:
                return ["center center", "center center"];
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DRAG LOGIC
    // ─────────────────────────────────────────────────────────────────────────
    
    const updateValue = async (newValue, saveToFrontmatter = true) => {
        const clampedValue = Math.min(max, Math.max(0, Math.round(newValue / step) * step));
        setLocalValue(clampedValue);
        if (saveToFrontmatter && targetKey) {
            const file = targetFile ? app.vault.getAbstractFileByPath(targetFile) : app.workspace.getActiveFile();
            if (file) await app.fileManager.processFrontMatter(file, (fm) => { fm[targetKey] = clampedValue; });
        }
        if (onChange) onChange(clampedValue);
    };
    
    const getValueFromPosition = (clientX, clientY) => {
        if (!barRef.current) return currentValue;
        const rect = barRef.current.getBoundingClientRect();
        
        let percent = 0;
        
        if (vertical) {
            // Vertical: Bottom is 0%, Top is 100%
            // clientY increases downwards. 
            // y relative to bottom = (rect.bottom - clientY)
            const yFromBottom = rect.bottom - clientY;
            percent = Math.min(100, Math.max(0, (yFromBottom / rect.height) * 100));
        } else {
            // Horizontal: Left is 0%, Right is 100%
            const x = clientX - rect.left;
            percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
        }
        
        return (percent / 100) * max;
    };
    
    const handleDragMove = (e) => {
        if (!isDraggingRef.current) return;
        if (e.type === 'touchmove') e.preventDefault(); 
        
        const coords = getClientXY(e);
        const start = dragStartPosRef.current;
        
        const dx = Math.abs(coords.x - start.x);
        const dy = Math.abs(coords.y - start.y);
        
        if (dx > 5 || dy > 5) hasDraggedRef.current = true;
        
        if (hasDraggedRef.current) {
            const newValue = getValueFromPosition(coords.x, coords.y);
            updateValue(newValue, false);
            forceUpdate(n => n + 1);
        }
    };
    
    const handleDragEnd = (e) => {
        if (!isDraggingRef.current) return;
        const wasDragged = hasDraggedRef.current;
        isDraggingRef.current = false;
        hasDraggedRef.current = false;
        stopAnimation();
        
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
        document.removeEventListener("touchmove", handleDragMove);
        document.removeEventListener("touchend", handleDragEnd);
        
        if (!wasDragged) { forceUpdate(n => n + 1); return; }
        
        justFinishedDraggingRef.current = true;
        forceUpdate(n => n + 1);
        
        const coords = getClientXY(e);
        const finalValue = getValueFromPosition(coords.x, coords.y);
        updateValue(finalValue, true);
        
        setTimeout(() => { justFinishedDraggingRef.current = false; }, 500);
        if (onDragEnd) onDragEnd();
    };
    
    const handleDragStart = (e) => {
        if (!draggable) return;
        if (e.type === 'touchstart') e.preventDefault();
        e.stopPropagation();
        
        const coords = getClientXY(e);
        dragStartPosRef.current = coords;
        
        hasDraggedRef.current = false;
        isDraggingRef.current = true;
        forceUpdate(n => n + 1);
        startAnimation();
        
        if (onDragStart) onDragStart();
        
        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);
        document.addEventListener("touchmove", handleDragMove, { passive: false });
        document.addEventListener("touchend", handleDragEnd);
    };
    
    // Cleanup
    dc.useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("mouseup", handleDragEnd);
            document.removeEventListener("touchmove", handleDragMove);
            document.removeEventListener("touchend", handleDragEnd);
        };
    }, []);
    
    const startAnimation = () => { if (animation !== "none") { setIsAnimating(true); setAnimationClass(`dc-anim-${animation}-loop`); } };
    const stopAnimation = () => { setIsAnimating(false); setAnimationClass(""); };
    
    // ─────────────────────────────────────────────────────────────────────────
    // DISPLAY
    // ─────────────────────────────────────────────────────────────────────────
    const formatValue = () => {
        const displayValue = isDraggingRef.current ? localValue : currentValue;
        if (valueFormat) return valueFormat(displayValue, max);
        if (showPercentage) return `${Math.round((displayValue / max) * 100)}%`;
        return `${Math.round(displayValue)}/${max}`;
    };
    
    const displayPercentage = isDraggingRef.current ? Math.min(100, Math.max(0, (localValue / max) * 100)) : percentage;
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    // Dynamic Styles based on Orientation
    const containerStyle = vertical ? {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%", // Fill parent
        width: "auto",  // Width defined by children
    } : {
        width: width,
    };

    const trackStyle = vertical ? {
        position: "relative",
        height: barLength, // Length becomes height
        width: barThickness, // Thickness becomes width
        backgroundImage: trackBackground,
        backgroundColor: trackBackground.startsWith("url(") || trackBackground.includes("gradient(") ? "transparent" : trackBackground,
        backgroundSize: trackBgSizeResolved,
        backgroundRepeat: trackBgRepeatResolved,
        backgroundPosition: trackBgPositionResolved,
        borderRadius: barRadius,
        overflow: "visible",
        cursor: draggable ? (isDraggingRef.current ? "grabbing" : "grab") : "default",
        touchAction: "none"
    } : {
        position: "relative",
        width: barLength,
        height: barThickness,
        backgroundImage: trackBackground,
        backgroundColor: trackBackground.startsWith("url(") || trackBackground.includes("gradient(") ? "transparent" : trackBackground,
        backgroundSize: trackBgSizeResolved,
        backgroundRepeat: trackBgRepeatResolved,
        backgroundPosition: trackBgPositionResolved,
        borderRadius: barRadius,
        overflow: "visible",
        cursor: draggable ? (isDraggingRef.current ? "grabbing" : "grab") : "default",
        touchAction: "none"
    };

    const fillStyle = vertical ? {
        position: "absolute",
        left: 0,
        bottom: 0, // Vertical grows from bottom
        width: "100%",
        height: `${displayPercentage}%`, // Height is percentage
        backgroundImage: fillBackground,
        backgroundColor: fillBackground.startsWith("url(") || fillBackground.includes("gradient(") ? "transparent" : fillBackground,
        backgroundSize: fillBgSizeResolved,
        backgroundRepeat: fillBgRepeatResolved,
        backgroundPosition: fillBgPositionResolved,
        borderRadius: barRadius,
        transition: "height 0.15s ease-out, background-position 0.3s ease-out",
        pointerEvents: "none",
    } : {
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: `${displayPercentage}%`,
        backgroundImage: fillBackground,
        backgroundColor: fillBackground.startsWith("url(") || fillBackground.includes("gradient(") ? "transparent" : fillBackground,
        backgroundSize: fillBgSizeResolved,
        backgroundRepeat: fillBgRepeatResolved,
        backgroundPosition: fillBgPositionResolved,
        borderRadius: barRadius,
        transition: "width 0.15s ease-out, background-position 0.3s ease-out",
        pointerEvents: "none",
    };

    // Touch target should be at least 44x44px for mobile accessibility
    const minTouchTarget = 44;
    const touchPadX = Math.max(0, (minTouchTarget - spWidth) / 2);
    const touchPadY = Math.max(0, (minTouchTarget - spHeight) / 2);
    
    const spriteStyle = vertical ? {
        position: "absolute",
        left: "50%",
        bottom: `calc(${displayPercentage}% - ${spHeight / 2}px)`, // Position based on bottom
        transform: "translateX(-50%)", // Center horizontally
        width: `${spWidth}px`,
        height: `${spHeight}px`,
        zIndex: 10,
        cursor: draggable ? (isDraggingRef.current ? "grabbing" : "grab") : "pointer",
        transition: isDraggingRef.current ? "none" : "bottom 0.3s ease",
        userSelect: "none",
        // Expand touch target with padding
        padding: `${touchPadY}px ${touchPadX}px`,
        margin: `-${touchPadY}px -${touchPadX}px`,
        boxSizing: "content-box",
    } : {
        position: "absolute",
        left: `calc(${displayPercentage}% - ${spWidth / 2}px)`,
        top: "50%",
        transform: "translateY(-50%)",
        width: `${spWidth}px`,
        height: `${spHeight}px`,
        zIndex: 10,
        cursor: draggable ? (isDraggingRef.current ? "grabbing" : "grab") : "pointer",
        transition: isDraggingRef.current ? "none" : "left 0.3s ease",
        userSelect: "none",
        // Expand touch target with padding
        padding: `${touchPadY}px ${touchPadX}px`,
        margin: `-${touchPadY}px -${touchPadX}px`,
        boxSizing: "content-box",
    };

    return (
        <div className={`dc-glo-bar-container ${className}`.trim()} style={{ ...containerStyle, ...style }}>
            
            {/* Label Row (Always on top for both modes) */}
            {(label || showValue) && (
                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "6px", 
                    fontSize: "12px",
                    width: vertical ? "100%" : "100%" // Ensure label takes space
                }}>
                    {label && <span style={{ color: textColor, fontWeight: "bold" }}>{label}</span>}
                    {showValue && <span style={{ color: mutedColor }}>{formatValue()}</span>}
                </div>
            )}
            
            {/* Bar Track */}
            <div
                ref={barRef}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className={`dc-glo-bar-track ${draggable ? "dc-glo-bar-draggable" : ""}`}
                style={trackStyle}
            >
                {/* Fill */}
                <div className="dc-glo-bar-fill" style={fillStyle} />
                
                {/* Sprite */}
                {showSprite && spriteUrl && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (draggable) handleDragStart(e);
                            else {
                                startAnimation();
                                const handleUp = () => { stopAnimation(); document.removeEventListener("mouseup", handleUp); };
                                document.addEventListener("mouseup", handleUp);
                            }
                        }}
                        onTouchStart={(e) => { if (draggable) handleDragStart(e); }}
                        className="dc-glo-bar-sprite"
                        style={spriteStyle}
                    >
                        <div className={animationClass} style={{ width: "100%", height: "100%", "--dc-anim-duration": animDuration }}>
                            <img src={spriteUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }} draggable={false} />
                        </div>
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
    <div style={{ display: "flex", gap: "2rem", padding: "1rem" }}>
        <div style={{ width: "200px" }}>
            <GloBar value={65} label="Horizontal" />
        </div>
        <div style={{ height: "200px" }}>
            <GloBar value={65} label="Vertical" vertical={true} length="150px" height="20px" draggable={true} />
        </div>
    </div>
);

return { renderedView, GloBar };