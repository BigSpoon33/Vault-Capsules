// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-TOGGLE - Global Themed Toggle Component
// A fully customizable, theme-aware toggle with sprite, labels, and premium effects
// Based on dc-mothToggle but reads all values from theme
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, hexToRgba, resolveBackground } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloToggle
// ═══════════════════════════════════════════════════════════════════════════════
function GloToggle({
    // Target (what frontmatter key to toggle)
    targetKey,                    // Required: frontmatter key to toggle (e.g., "night_mode")
    targetFile = null,            // Optional: file path (null = current file)
    
    // Labels (override theme defaults)
    onLabel = null,               // Label when ON (null = use theme's label-active)
    offLabel = null,              // Label when OFF (null = use theme's label-inactive)
    onSub = null,                 // Sub-label when ON (null = use theme's label-active-sub)
    offSub = null,                // Sub-label when OFF (null = use theme's label-inactive-sub)
    
    // Sprite
    showSprite = true,            // Show the theme sprite
    sprite = null,                // Override sprite (base64 string)
    spriteWidth = null,           // Override sprite width
    spriteHeight = null,          // Override sprite height
    spriteAnimation = null,       // Override click animation (squish, spin, etc.)
    
    // Backgrounds (override theme defaults - uses fallback chain)
    idleBg = null,                // Background when OFF
    hoverBg = null,               // Background when hovering
    activeBg = null,              // Background when ON

    // Background Sizing (Idle)
    idleBgSize = null,            // "auto" | "cover" | "contain" | "50%" | etc.
    idleBgRepeat = null,          // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    idleBgPosition = null,        // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Hover)
    hoverBgSize = null,           // "auto" | "cover" | "contain" | "50%" | etc.
    hoverBgRepeat = null,         // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    hoverBgPosition = null,       // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Active)
    activeBgSize = null,          // "auto" | "cover" | "contain" | "50%" | etc.
    activeBgRepeat = null,        // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    activeBgPosition = null,      // "center" | "top left" | "50% 50%" | etc.

    // Transition Direction (for hover/state change animations)
    transitionDirection = null,   // "none" | "left" | "right" | "top" | "bottom"

    // Effects
    glow = true,                  // Enable glow effects
    lift = true,                  // Enable lift on hover
    press = true,                 // Enable press on click
    rainbow = true,               // Enable rainbow text on hover/active

    // Styling
    width = null,                 // Override container width
    padding = null,               // Override padding
    borderRadius = null,          // Override border radius

    // Callbacks
    onChange = null,              // Called with new value when toggled

    // Overrides
    style = {},                   // Additional inline styles
    className = "",               // Additional CSS classes
    flashy = null,                // Override flashy mode (null = use global setting)

    // Theme Override (for preview purposes in theme editor)
    themeOverride = null,
}) {
    const { theme: loadedTheme, isLoading } = useTheme();
    const theme = themeOverride || loadedTheme;
    const globalFlashyMode = useFlashyMode();
    const current = dc.useCurrentFile();
    
    // State
    const [isHovered, setIsHovered] = dc.useState(false);
    const [isPressed, setIsPressed] = dc.useState(false);
    const [isAnimating, setIsAnimating] = dc.useState(false);
    const [animationClass, setAnimationClass] = dc.useState("");
    
    // Load shared CSS
    useComponentCSS();
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET CURRENT VALUE FROM FRONTMATTER
    // ─────────────────────────────────────────────────────────────────────────
    const getTargetFile = () => {
        if (targetFile) {
            return app.vault.getAbstractFileByPath(targetFile);
        }
        return app.workspace.getActiveFile();
    };
    
    const getCurrentValue = () => {
        if (!targetKey) return false;
        
        if (targetFile) {
            const file = app.vault.getAbstractFileByPath(targetFile);
            if (file) {
                const cache = app.metadataCache.getFileCache(file);
                return cache?.frontmatter?.[targetKey] || false;
            }
            return false;
        }
        
        // Current file
        return current?.value(targetKey) || false;
    };
    
    const initialValue = getCurrentValue();
    const [isActive, setIsActive] = dc.useState(initialValue);
    
    // Sync with frontmatter changes
    dc.useEffect(() => {
        setIsActive(getCurrentValue());
    }, [targetKey, targetFile]);
    
    // Loading state
    if (isLoading) {
        return (
            <div style={{ 
                padding: "15px", 
                background: "#2b2b2b", 
                borderRadius: "12px",
                opacity: 0.5 
            }}>
                Loading...
            </div>
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // RESOLVE THEME VALUES
    // ─────────────────────────────────────────────────────────────────────────
    
    // Determine if effects are enabled
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    
    // Labels
    const labelOn = onLabel || theme["label-active"] || "Active";
    const labelOff = offLabel || theme["label-inactive"] || "Inactive";
    const subOn = onSub || theme["label-active-sub"] || "";
    const subOff = offSub || theme["label-inactive-sub"] || "";
    
    // Sprite
    const spriteUrl = sprite || theme["toggle-sprite"] || theme["bar-sprite"] || null;
    const spWidth = spriteWidth || theme["toggle-sprite-width"] || theme["bar-sprite-width"] || 50;
    const spHeight = spriteHeight || theme["toggle-sprite-height"] || theme["bar-sprite-height"] || 50;
    const animation = spriteAnimation || theme["toggle-sprite-click-animation"] || "squish";
    const animDuration = theme["toggle-sprite-click-duration"] || "0.3s";
    
    // ─────────────────────────────────────────────────────────────────────────
    // SPRITE ANIMATION
    // ─────────────────────────────────────────────────────────────────────────
    const triggerSpriteAnimation = () => {
        if (isAnimating) return;
        if (animation === "none") return;
        
        setIsAnimating(true);
        setAnimationClass(`dc-anim-${animation}`);
        
        const durationMs = parseFloat(animDuration) * 1000;
        setTimeout(() => {
            setIsAnimating(false);
            setAnimationClass("");
        }, durationMs + 100);
    };
    
    // Backgrounds with fallback chain
    const themeIdleBg = theme["toggle-idle-bg"] || theme["color-surface"] || "#2b2b2b";
    const themeHoverBg = theme["toggle-hover-bg"] || theme["color-surface"] || "#3b3b3b";
    const themeActiveBg = theme["toggle-active-bg"] || theme["color-surface"] || "#4b4b4b";

    const bgIdle = resolveBackground(idleBg, null, themeIdleBg);
    const bgHover = resolveBackground(hoverBg, null, themeHoverBg);
    const bgActive = resolveBackground(activeBg, null, themeActiveBg);

    // Background Sizing - Hybrid approach: props override theme defaults
    const idleBgSizeResolved = idleBgSize || theme["toggle-idle-bg-size"] || "auto";
    const idleBgRepeatResolved = idleBgRepeat || theme["toggle-idle-bg-repeat"] || "repeat";
    const idleBgPositionResolved = idleBgPosition || theme["toggle-idle-bg-position"] || "center";

    const hoverBgSizeResolved = hoverBgSize || theme["toggle-hover-bg-size"] || "auto";
    const hoverBgRepeatResolved = hoverBgRepeat || theme["toggle-hover-bg-repeat"] || "repeat";
    const hoverBgPositionResolved = hoverBgPosition || theme["toggle-hover-bg-position"] || "center";

    const activeBgSizeResolved = activeBgSize || theme["toggle-active-bg-size"] || "auto";
    const activeBgRepeatResolved = activeBgRepeat || theme["toggle-active-bg-repeat"] || "repeat";
    const activeBgPositionResolved = activeBgPosition || theme["toggle-active-bg-position"] || "center";

    // Transition Direction
    const transitionDir = transitionDirection || theme["toggle-transition-direction"] || "none";

    // Determine current background and sizing based on state
    let currentBg = bgIdle;
    let currentBgSize = idleBgSizeResolved;
    let currentBgRepeat = idleBgRepeatResolved;
    let currentBgPosition = idleBgPositionResolved;

    if (isActive) {
        currentBg = bgActive;
        currentBgSize = activeBgSizeResolved;
        currentBgRepeat = activeBgRepeatResolved;
        currentBgPosition = activeBgPositionResolved;
    } else if (isHovered) {
        currentBg = bgHover;
        currentBgSize = hoverBgSizeResolved;
        currentBgRepeat = hoverBgRepeatResolved;
        currentBgPosition = hoverBgPositionResolved;
    }

    const isImageBg = currentBg.startsWith("url(") || currentBg.includes("gradient(");
    
    // Colors
    const primaryColor = theme["color-primary"] || "#ff69b4";
    const accentColor = theme["color-accent"] || "#ffd700";
    const textColor = theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "rgba(255,255,255,0.7)";
    
    // Glow colors
    const glowColorHover = theme["glow-color-hover"] || hexToRgba(primaryColor, 0.4);
    const glowColorActive = theme["glow-color-active"] || hexToRgba(accentColor, 0.3);
    
    // Borders
    const borderColorIdle = theme["card-border"] ? 
        theme["card-border"].replace(/1px solid /, "") : 
        hexToRgba(primaryColor, 0.3);
    const borderColorActive = accentColor;
    
    // Transitions
    const transitionSpeed = theme["transition-normal"] || "0.3s";
    const transitionFast = theme["transition-fast"] || "0.15s";
    
    // Sizing - use maxWidth instead of fixed width for mobile compatibility
    const containerWidth = width || "100%";
    const containerMaxWidth = "220px";
    const containerPadding = padding || "15px";
    const containerRadius = borderRadius || theme["border-radius-medium"] || "12px";
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOGGLE HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    const handleToggle = async () => {
        if (!targetKey) {
            console.warn("GloToggle: No targetKey specified");
            return;
        }
        
        // Trigger sprite animation on toggle
        if (showSprite && spriteUrl && effectsEnabled) {
            triggerSpriteAnimation();
        }
        
        const newState = !isActive;
        setIsActive(newState);
        
        const file = getTargetFile();
        if (file) {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm[targetKey] = newState;
            });
        }
        
        // Call onChange callback if provided
        if (onChange) {
            onChange(newState);
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // COMPUTE EFFECTS
    // ─────────────────────────────────────────────────────────────────────────
    let transform = "";
    let boxShadow = "none";
    
    if (effectsEnabled) {
        // Press effect
        if (isPressed && press) {
            transform = "translateY(1px) scale(0.98)";
            boxShadow = "none";
        }
        // Hover lift
        else if (isHovered && lift) {
            transform = "translateY(-2px)";
            boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";
        }
        
        // Glow effects
        if (glow) {
            if (isActive) {
                const activeGlow = `0 0 20px 5px ${glowColorActive}`;
                boxShadow = boxShadow === "none" ? activeGlow : `${activeGlow}, ${boxShadow}`;
            } else if (isHovered) {
                const hoverGlow = `0 0 15px 2px ${glowColorHover}`;
                boxShadow = boxShadow === "none" ? hoverGlow : `${hoverGlow}, ${boxShadow}`;
            }
        }
    }
    
    // Rainbow text logic
    const showRainbow = effectsEnabled && rainbow && (isActive || isHovered);
    
    // Sprite styling - NO grayscale filter to allow GIF animation
    const spriteStyle = {
        width: `${spWidth}px`,
        height: `${spHeight}px`,
        objectFit: "contain",
        transition: `transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease`,
        transformOrigin: "center center",
        pointerEvents: "none", // Prevent cursor change on sprite
    };
    
    // Active vs inactive sprite transforms
    // NOTE: We don't use grayscale filter because it stops GIF animation
    // Instead we use opacity and scale to differentiate states
    if (isActive) {
        spriteStyle.transform = "scale(1.1)";
        spriteStyle.opacity = 1;
        // Only add drop-shadow, no grayscale
        if (effectsEnabled && glow) {
            spriteStyle.filter = `drop-shadow(0 0 8px ${glowColorActive})`;
        }
    } else {
        spriteStyle.transform = "scale(0.85)";
        spriteStyle.opacity = 0.6;
        // No filter at all - allows GIF to play but appears dimmer via opacity
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => { setIsHovered(true); setIsPressed(true); }}
            onTouchEnd={() => { setIsHovered(false); setIsPressed(false); }}
            className={`dc-glo-toggle ${isActive ? "dc-active" : ""} ${className}`.trim()}
            style={{
                // Layout
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: containerPadding,
                width: containerWidth,
                maxWidth: containerMaxWidth,
                minHeight: "44px", // Minimum touch target height
                margin: "15px", // Buffer for glow
                boxSizing: "border-box",
                touchAction: "manipulation", // Prevent double-tap zoom

                // Background - use backgroundImage for proper sizing control
                backgroundImage: currentBg,
                backgroundColor: isImageBg ? "transparent" : currentBg,
                backgroundSize: currentBgSize,
                backgroundRepeat: currentBgRepeat,
                backgroundPosition: currentBgPosition,

                // Border
                borderRadius: containerRadius,
                border: `1px solid ${isActive ? borderColorActive : borderColorIdle}`,
                
                // Interaction
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                overflow: "visible",
                
                // Effects
                transform,
                boxShadow,
                transition: `all ${transitionSpeed} ease, transform ${transitionFast} ease, background-position 0.3s ease-out`,

                // User overrides
                ...style,
            }}
        >
            {/* Sprite */}
            {showSprite && spriteUrl && (
                <div 
                    className={animationClass}
                    style={{
                        position: "relative",
                        width: `${spWidth}px`,
                        height: `${spHeight}px`,
                        flexShrink: 0,
                        zIndex: 10,
                        "--dc-anim-duration": animDuration,
                    }}
                >
                    <img 
                        src={spriteUrl} 
                        alt="" 
                        style={spriteStyle}
                    />
                </div>
            )}
            
            {/* Labels */}
            <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                zIndex: 2,
                flex: 1,
                minWidth: 0,
            }}>
                {/* Main Label */}
                <span
                    className={showRainbow ? "dc-rainbow-text" : ""}
                    style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: isActive ? accentColor : textColor,
                        textShadow: showRainbow ? "none" : "0 2px 4px rgba(0,0,0,0.9)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {isActive ? labelOn : labelOff}
                </span>
                
                {/* Sub Label */}
                {(subOn || subOff) && (
                    <span style={{
                        fontSize: "0.75em",
                        color: mutedColor,
                        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}>
                        {isActive ? subOn : subOff}
                    </span>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Demo view showing the toggle
const renderedView = (
    <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: "1rem",
        padding: "1rem",
    }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloToggle Component Demo
        </div>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "1rem" }}>
            Note: Requires a targetKey prop to toggle frontmatter. This demo shows styling only.
        </div>
        
        <GloToggle 
            targetKey="demo_toggle"
            onLabel="Activated!"
            offLabel="Click to activate"
            onSub="Feature is enabled"
            offSub="Feature is disabled"
        />
    </div>
);

return { 
    renderedView, 
    GloToggle,
};
