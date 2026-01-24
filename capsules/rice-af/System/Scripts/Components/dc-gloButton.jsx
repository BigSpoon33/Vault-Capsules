// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-BUTTON - Global Themed Button Component (Fixed Export)
// A fully customizable, theme-aware button with glow, lift, press, and rainbow effects
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Wrap a value in url() if it's an image data/path
// ─────────────────────────────────────────────────────────────────────────────
function wrapImageUrl(value) {
    if (!value) return value;
    if (value.startsWith("url(")) return value;
    if (value.startsWith("data:image")) return `url("${value}")`;
    if (value.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return `url("${value}")`;
    return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Resolve background
// ─────────────────────────────────────────────────────────────────────────────
function resolveBackground(value, themeGradient, themeSolid) {
    if (!value) {
        const fallback = themeGradient || themeSolid;
        return wrapImageUrl(fallback);
    }
    if (value.startsWith("data:image")) return `url("${value}")`;
    if (value.startsWith("linear-gradient") || value.startsWith("radial-gradient")) return value;
    if (value.startsWith("url(")) return value;
    if (value.startsWith("#") || value.startsWith("rgb") || /^[a-z]+$/i.test(value)) return value;
    if (value.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return `url("${value}")`;
    
    const fallback = themeGradient || themeSolid;
    return wrapImageUrl(fallback);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Load shared CSS (Includes Rainbow Animation & Click Animations)
// ─────────────────────────────────────────────────────────────────────────────
function useComponentCSS() {
    dc.useEffect(() => {
        const styleId = "dc-components-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                /* ═══════════════════════════════════════════════════════════════════
                   RAINBOW TEXT ANIMATION
                   ═══════════════════════════════════════════════════════════════════ */
                @keyframes dc-rainbow-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .dc-rainbow-text {
                    background: linear-gradient(
                        90deg, 
                        #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee, #ff0000
                    );
                    background-size: 200% auto;
                    color: transparent !important;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: dc-rainbow-move 3s linear infinite;
                    font-weight: bold;
                    text-shadow: none !important;
                }

                /* ═══════════════════════════════════════════════════════════════════
                   LOADING SPINNER
                   ═══════════════════════════════════════════════════════════════════ */
                @keyframes dc-spin {
                    to { transform: rotate(360deg); }
                }

                /* ═══════════════════════════════════════════════════════════════════
                   CLICK ANIMATIONS - Single trigger (for clicks)
                   Duration controlled by --dc-anim-duration CSS variable
                   ═══════════════════════════════════════════════════════════════════ */

                /* SQUISH - Compress vertically and spring back */
                @keyframes dc-anim-squish-keyframes {
                    0% { transform: scale(1, 1); }
                    30% { transform: scale(1.1, 0.8); }
                    50% { transform: scale(0.9, 1.1); }
                    70% { transform: scale(1.05, 0.95); }
                    100% { transform: scale(1, 1); }
                }
                .dc-anim-squish {
                    animation: dc-anim-squish-keyframes var(--dc-anim-duration, 0.3s) ease-out;
                }

                /* BOUNCE - Hop up and down */
                @keyframes dc-anim-bounce-keyframes {
                    0% { transform: translateY(0); }
                    20% { transform: translateY(-8px); }
                    40% { transform: translateY(0); }
                    60% { transform: translateY(-4px); }
                    80% { transform: translateY(0); }
                    100% { transform: translateY(0); }
                }
                .dc-anim-bounce {
                    animation: dc-anim-bounce-keyframes var(--dc-anim-duration, 0.3s) ease-out;
                }

                /* SPIN - Full 360° rotation */
                @keyframes dc-anim-spin-keyframes {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .dc-anim-spin {
                    animation: dc-anim-spin-keyframes var(--dc-anim-duration, 0.3s) ease-in-out;
                }

                /* TWIST - Rotation wobble */
                @keyframes dc-anim-twist-keyframes {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(15deg); }
                    50% { transform: rotate(-15deg); }
                    75% { transform: rotate(8deg); }
                    100% { transform: rotate(0deg); }
                }
                .dc-anim-twist {
                    animation: dc-anim-twist-keyframes var(--dc-anim-duration, 0.3s) ease-out;
                }

                /* JIGGLE - Quick horizontal shake */
                @keyframes dc-anim-jiggle-keyframes {
                    0% { transform: translateX(0); }
                    20% { transform: translateX(-4px); }
                    40% { transform: translateX(4px); }
                    60% { transform: translateX(-2px); }
                    80% { transform: translateX(2px); }
                    100% { transform: translateX(0); }
                }
                .dc-anim-jiggle {
                    animation: dc-anim-jiggle-keyframes var(--dc-anim-duration, 0.3s) ease-out;
                }

                /* PULSE - Scale up and back */
                @keyframes dc-anim-pulse-keyframes {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }
                .dc-anim-pulse {
                    animation: dc-anim-pulse-keyframes var(--dc-anim-duration, 0.3s) ease-out;
                }

                /* WIGGLE - Rotation shake */
                @keyframes dc-anim-wiggle-keyframes {
                    0% { transform: rotate(0deg); }
                    15% { transform: rotate(-10deg); }
                    30% { transform: rotate(10deg); }
                    45% { transform: rotate(-8deg); }
                    60% { transform: rotate(8deg); }
                    75% { transform: rotate(-4deg); }
                    90% { transform: rotate(4deg); }
                    100% { transform: rotate(0deg); }
                }
                .dc-anim-wiggle {
                    animation: dc-anim-wiggle-keyframes var(--dc-anim-duration, 0.3s) ease-out;
                }

                /* FLIP - Horizontal flip */
                @keyframes dc-anim-flip-keyframes {
                    0% { transform: perspective(400px) rotateY(0deg); }
                    50% { transform: perspective(400px) rotateY(180deg); }
                    100% { transform: perspective(400px) rotateY(360deg); }
                }
                .dc-anim-flip {
                    animation: dc-anim-flip-keyframes var(--dc-anim-duration, 0.3s) ease-in-out;
                }

                /* ═══════════════════════════════════════════════════════════════════
                   LOOP ANIMATIONS - Continuous (for drag/hold states)
                   ═══════════════════════════════════════════════════════════════════ */

                .dc-anim-squish-loop {
                    animation: dc-anim-squish-keyframes var(--dc-anim-duration, 0.3s) ease-out infinite;
                }
                .dc-anim-bounce-loop {
                    animation: dc-anim-bounce-keyframes var(--dc-anim-duration, 0.3s) ease-out infinite;
                }
                .dc-anim-spin-loop {
                    animation: dc-anim-spin-keyframes var(--dc-anim-duration, 0.3s) linear infinite;
                }
                .dc-anim-twist-loop {
                    animation: dc-anim-twist-keyframes var(--dc-anim-duration, 0.3s) ease-out infinite;
                }
                .dc-anim-jiggle-loop {
                    animation: dc-anim-jiggle-keyframes var(--dc-anim-duration, 0.3s) ease-out infinite;
                }
                .dc-anim-pulse-loop {
                    animation: dc-anim-pulse-keyframes var(--dc-anim-duration, 0.3s) ease-out infinite;
                }
                .dc-anim-wiggle-loop {
                    animation: dc-anim-wiggle-keyframes var(--dc-anim-duration, 0.3s) ease-out infinite;
                }
                .dc-anim-flip-loop {
                    animation: dc-anim-flip-keyframes var(--dc-anim-duration, 0.3s) ease-in-out infinite;
                }

                /* ═══════════════════════════════════════════════════════════════════
                   TAB FADE ANIMATION (used by GloTabs)
                   ═══════════════════════════════════════════════════════════════════ */
                @keyframes dc-tab-fade {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ═══════════════════════════════════════════════════════════════════
                   PULSE ANIMATION (used by GloBadge)
                   ═══════════════════════════════════════════════════════════════════ */
                @keyframes dc-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                .dc-pulse-anim {
                    animation: dc-pulse 2s ease-in-out infinite;
                }

                /* ═══════════════════════════════════════════════════════════════════
                   SCROLLBAR HIDE (used by GloTabs horizontal scroll)
                   ═══════════════════════════════════════════════════════════════════ */
                .dc-glo-tabs-bar::-webkit-scrollbar {
                    display: none;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Flashy Mode
// ─────────────────────────────────────────────────────────────────────────────
function useFlashyMode() {
    const [flashy, setFlashy] = dc.useState(true);
    dc.useEffect(() => {
        const settingsFile = app.vault.getAbstractFileByPath("System/Settings.md");
        if (settingsFile) {
            const cache = app.metadataCache.getFileCache(settingsFile);
            setFlashy(cache?.frontmatter?.["flashy-mode"] !== false);
        }
    }, []);
    return flashy;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Hex to RGBA
// ─────────────────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha = 1) {
    if (!hex || !hex.startsWith("#")) return `rgba(124, 58, 237, ${alpha})`;
    let r, g, b;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloButton
// ═══════════════════════════════════════════════════════════════════════════════
function GloButton({
    label,
    onClick = () => {},
    variant = "primary",
    size = "medium",
    bg = null,
    hoverBg = null,
    activeBg = null,

    // Background Sizing (Idle)
    bgSize = null,                // "auto" | "cover" | "contain" | "50%" | etc.
    bgRepeat = null,              // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    bgPosition = null,            // "center" | "top left" | "50% 50%" | etc.

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

    glow = true,
    lift = true,
    press = true,
    rainbow = false,

    icon = null,
    iconRight = null,

    showSprite = false,
    sprite = null,
    spriteWidth = null,
    spriteHeight = null,
    spriteAnimation = null,
    spritePosition = "left",

    disabled = false,
    loading = false,
    active = false,

    style = {},
    className = "",
    flashy = null,

    // Theme Override (for preview purposes in theme editor)
    themeOverride = null,
}) {
    const { theme: loadedTheme, isLoading } = useTheme();
    const theme = themeOverride || loadedTheme;
    const globalFlashyMode = useFlashyMode();
    const [isHovered, setIsHovered] = dc.useState(false);
    const [isPressed, setIsPressed] = dc.useState(false);
    
    const [isSpriteAnimating, setIsSpriteAnimating] = dc.useState(false);
    const [spriteClass, setSpriteClass] = dc.useState("");
    const [isRainbowAnimating, setIsRainbowAnimating] = dc.useState(false);
    
    useComponentCSS();
    
    if (isLoading) return <button disabled style={{ padding: "10px 20px", opacity: 0.5 }}>...</button>;
    
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    
    // Theme Values
    const sizeKey = `button-size-${size}`;
    const padding = theme[`${sizeKey}-padding`] || (size === "small" ? "6px 12px" : "10px 20px");
    const fontSize = theme[`${sizeKey}-font`] || (size === "small" ? "12px" : "14px");
    const borderRadius = theme[`${sizeKey}-radius`] || (size === "small" ? "6px" : "8px");
    
    const themeIdleBg = theme["button-idle-bg"] || "#667eea";
    const themeHoverBg = theme["button-hover-bg"] || "#764ba2";
    const themeActiveBg = theme["button-active-bg"] || "#5a67d8";
    const themeSolid = theme["color-primary"] || "#667eea";
    
    const idleBackground = resolveBackground(bg, themeIdleBg, themeSolid);
    const hoverBackground = resolveBackground(hoverBg, themeHoverBg, themeSolid);
    const activeBackground = resolveBackground(activeBg, themeActiveBg, themeSolid);

    // Background Sizing - Hybrid approach: props override theme defaults
    const bgSizeResolved = bgSize || theme["button-idle-bg-size"] || "auto";
    const bgRepeatResolved = bgRepeat || theme["button-idle-bg-repeat"] || "repeat";
    const bgPositionResolved = bgPosition || theme["button-idle-bg-position"] || "center";

    const hoverBgSizeResolved = hoverBgSize || theme["button-hover-bg-size"] || "auto";
    const hoverBgRepeatResolved = hoverBgRepeat || theme["button-hover-bg-repeat"] || "repeat";
    const hoverBgPositionResolved = hoverBgPosition || theme["button-hover-bg-position"] || "center";

    const activeBgSizeResolved = activeBgSize || theme["button-active-bg-size"] || "auto";
    const activeBgRepeatResolved = activeBgRepeat || theme["button-active-bg-repeat"] || "repeat";
    const activeBgPositionResolved = activeBgPosition || theme["button-active-bg-position"] || "center";

    // Transition Direction
    const transitionDir = transitionDirection || theme["button-transition-direction"] || "none";

    // Determine current background and sizing based on state
    let currentBg = idleBackground;
    let currentBgSize = bgSizeResolved;
    let currentBgRepeat = bgRepeatResolved;
    let currentBgPosition = bgPositionResolved;

    if (active || isPressed) {
        currentBg = activeBackground;
        currentBgSize = activeBgSizeResolved;
        currentBgRepeat = activeBgRepeatResolved;
        currentBgPosition = activeBgPositionResolved;
    } else if (isHovered && !disabled) {
        currentBg = hoverBackground;
        currentBgSize = hoverBgSizeResolved;
        currentBgRepeat = hoverBgRepeatResolved;
        currentBgPosition = hoverBgPositionResolved;
    }

    const isImageBg = currentBg.startsWith("url(") || currentBg.includes("gradient(");
    const textColor = theme["button-text-color"] || "#ffffff";
    const accentColor = theme["color-accent"] || "#ffff00";
    const primaryColor = theme["color-primary"] || "#ff69b4";
    
    const glowColorHover = theme["glow-color-hover"] || hexToRgba(accentColor, 0.4);
    const glowColorActive = theme["glow-color-active"] || hexToRgba(accentColor, 0.3);
    
    const transitionSpeed = theme["transition-normal"] || "0.3s";
    const transitionFast = theme["transition-fast"] || "0.15s";
    
    const spriteUrl = sprite || theme["button-sprite"] || null;
    const spWidth = spriteWidth || parseInt(theme["button-sprite-width"]) || 34;
    const spHeight = spriteHeight || parseInt(theme["button-sprite-height"]) || 21;
    const animation = spriteAnimation || theme["button-sprite-click-animation"] || "bounce";
    const animDuration = theme["button-sprite-click-duration"] || "0.3s";
    
    let variantStyles = {};
    if (variant === "ghost") {
        currentBg = "transparent";
        variantStyles = { border: `2px solid ${primaryColor}`, color: primaryColor };
        if (isHovered && !disabled) currentBg = hexToRgba(primaryColor, 0.15);
        if (active || isPressed) currentBg = hexToRgba(primaryColor, 0.25);
    } else if (variant === "secondary") {
        currentBg = theme["color-surface"] || "#2a2a4e";
        variantStyles = { border: `1px solid ${primaryColor}` };
        if (isHovered && !disabled) {
            currentBg = theme["color-surface"] || "#3a3a5e";
            variantStyles.borderColor = accentColor;
        }
    }
    
    let transform = "";
    let boxShadow = "none";
    
    if (effectsEnabled && !disabled) {
        if ((active || isPressed) && press) {
            transform = "translateY(1px) scale(0.98)";
        } else if (isHovered) {
            if (lift) {
                transform = "translateY(-2px)";
                boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
            }
            if (glow) {
                const glowShadow = `0 0 15px 3px ${glowColorHover}`;
                boxShadow = boxShadow === "none" ? glowShadow : `${glowShadow}, ${boxShadow}`;
            }
        }
    }
    
    if (active && effectsEnabled && glow) {
        const activeGlow = `0 0 20px 5px ${glowColorActive}`;
        boxShadow = boxShadow === "none" ? activeGlow : `${activeGlow}, ${boxShadow}`;
    }
    
    const showRainbow = effectsEnabled && (rainbow || isRainbowAnimating);
    
    const handleClick = () => {
        if (disabled || loading) return;
        
        if (showSprite && spriteUrl && effectsEnabled && !isSpriteAnimating && animation !== "none") {
            setIsSpriteAnimating(true);
            setSpriteClass(`dc-anim-${animation}`);
            setTimeout(() => { setIsSpriteAnimating(false); setSpriteClass(""); }, parseFloat(animDuration) * 1000 + 100);
        }
        
        if (effectsEnabled && !isRainbowAnimating) {
            setIsRainbowAnimating(true);
            setTimeout(() => setIsRainbowAnimating(false), 2000);
        }
        
        onClick();
    };
    
    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
            onMouseDown={() => { if (!disabled) setIsPressed(true); }}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => { if (!disabled) { setIsHovered(true); setIsPressed(true); } }}
            onTouchEnd={() => { setIsHovered(false); setIsPressed(false); }}
            disabled={disabled || loading}
            className={`dc-glo-button ${className}`.trim()}
            style={{
                padding, fontSize, fontWeight: "bold", borderRadius, border: "none",
                backgroundImage: currentBg,
                backgroundColor: isImageBg ? "transparent" : currentBg,
                backgroundSize: currentBgSize,
                backgroundRepeat: currentBgRepeat,
                backgroundPosition: currentBgPosition,
                color: textColor, textShadow: showRainbow ? "none" : "0 1px 3px rgba(0,0,0,0.5)",
                cursor: disabled ? "not-allowed" : loading ? "wait" : "pointer",
                userSelect: "none", touchAction: "manipulation",
                transform, boxShadow, transition: "all 0.3s ease, background-position 0.3s ease-out",
                opacity: disabled ? 0.5 : 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
                ...variantStyles, ...style
            }}
        >
            {loading && <span style={{ width: "1em", height: "1em", border: "2px solid transparent", borderTopColor: textColor, borderRadius: "50%", animation: "dc-spin 0.8s linear infinite" }}></span>}
            
            {showSprite && spriteUrl && spritePosition === "left" && !loading && (
                <div className={spriteClass} style={{ width: `${spWidth}px`, height: `${spHeight}px`, flexShrink: 0, "--dc-anim-duration": animDuration }}>
                    <img src={spriteUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} draggable={false} />
                </div>
            )}
            
            {icon && !loading && !showSprite && <span>{icon}</span>}
            <span className={showRainbow ? "dc-rainbow-text" : ""}>{label}</span>
            {iconRight && !showSprite && <span>{iconRight}</span>}
            
            {showSprite && spriteUrl && spritePosition === "right" && !loading && (
                <div className={spriteClass} style={{ width: `${spWidth}px`, height: `${spHeight}px`, flexShrink: 0, "--dc-anim-duration": animDuration }}>
                    <img src={spriteUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} draggable={false} />
                </div>
            )}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// ⚠️ THIS was the missing piece!
const renderedView = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloButton Component Demo
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <GloButton label="Primary" onClick={() => {}} />
            <GloButton label="Secondary" variant="secondary" onClick={() => {}} />
            <GloButton label="Rainbow" rainbow={true} onClick={() => {}} />
        </div>
    </div>
);

return { 
    renderedView, 
    GloButton,
    resolveBackground,
    useComponentCSS,
    useFlashyMode,
    hexToRgba,
};