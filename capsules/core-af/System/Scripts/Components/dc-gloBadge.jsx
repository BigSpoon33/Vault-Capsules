// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-BADGE - Global Themed Badge/Tag/Chip Component
// A versatile, theme-aware label for status indicators, tags, and categories
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET STATUS COLORS
// ═══════════════════════════════════════════════════════════════════════════════
const STATUS_PRESETS = {
    success: { bg: "rgba(51, 255, 0, 0.15)", color: "#33ff00", border: "rgba(51, 255, 0, 0.3)" },
    warning: { bg: "rgba(255, 153, 0, 0.15)", color: "#ff9900", border: "rgba(255, 153, 0, 0.3)" },
    error: { bg: "rgba(255, 0, 0, 0.15)", color: "#ff0000", border: "rgba(255, 0, 0, 0.3)" },
    info: { bg: "rgba(0, 153, 255, 0.15)", color: "#0099ff", border: "rgba(0, 153, 255, 0.3)" },
    neutral: { bg: "rgba(255, 255, 255, 0.1)", color: "#888888", border: "rgba(255, 255, 255, 0.2)" },
    primary: null, // Uses theme primary color
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloBadge
// ═══════════════════════════════════════════════════════════════════════════════
function GloBadge({
    // Content
    children,                     // Badge text/content
    label = null,                 // Alternative to children
    icon = null,                  // Left icon (emoji or component)
    iconRight = null,             // Right icon
    
    // Appearance
    variant = "filled",           // "filled" | "outlined" | "soft" | "dot"
    size = "medium",              // "small" | "medium" | "large"
    status = null,                // "success" | "warning" | "error" | "info" | "neutral" | "primary"
    color = null,                 // Custom color (overrides status)
    
    // Shape
    rounded = true,               // Pill shape vs rounded rectangle
    
    // Interactivity
    clickable = false,            // Make clickable
    removable = false,            // Show remove X button
    onClick = null,               // Click handler
    onRemove = null,              // Remove handler
    
    // Effects
    glow = false,                 // Enable glow
    pulse = false,                // Pulse animation (for notifications)
    
    // Overrides
    style = {},                   // Additional inline styles
    className = "",               // Additional CSS classes
    flashy = null,                // Override flashy mode
}) {
    const { theme, isLoading } = useTheme();
    const globalFlashyMode = useFlashyMode();
    
    // Load shared CSS
    useComponentCSS();
    
    // Loading state
    if (isLoading) {
        return (
            <span style={{ 
                display: "inline-block",
                width: "60px",
                height: "24px",
                background: "#2b2b2b",
                borderRadius: "12px",
                opacity: 0.5,
            }} />
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // RESOLVE THEME VALUES
    // ─────────────────────────────────────────────────────────────────────────
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    
    // Colors from theme
    const primaryColor = theme["color-primary"] || "#ff69b4";
    const chipBg = theme["chip-bg"] || "rgba(255,105,180,0.1)";
    const chipBgActive = theme["chip-bg-active"] || "rgba(255,105,180,0.3)";
    const chipRadius = theme["chip-border-radius"] || "20px";
    
    // Sizing - ensure minimum touch target when clickable/removable
    const needsTouchTarget = clickable || removable;
    const sizeConfig = {
        small: { 
            padding: needsTouchTarget ? "8px 12px" : "2px 8px", 
            fontSize: "10px", 
            iconSize: "10px", 
            gap: "4px", 
            dotSize: "6px",
            minHeight: needsTouchTarget ? "32px" : "auto",
        },
        medium: { 
            padding: needsTouchTarget ? "10px 14px" : "4px 12px", 
            fontSize: "12px", 
            iconSize: "12px", 
            gap: "6px", 
            dotSize: "8px",
            minHeight: needsTouchTarget ? "36px" : "auto",
        },
        large: { 
            padding: needsTouchTarget ? "12px 18px" : "6px 16px", 
            fontSize: "14px", 
            iconSize: "14px", 
            gap: "8px", 
            dotSize: "10px",
            minHeight: needsTouchTarget ? "44px" : "auto",
        },
    };
    const sizing = sizeConfig[size] || sizeConfig.medium;
    
    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINE COLORS
    // ─────────────────────────────────────────────────────────────────────────
    const getColors = () => {
        // Custom color takes priority
        if (color) {
            return {
                bg: hexToRgba ? hexToRgba(color, 0.15) : `${color}26`,
                color: color,
                border: hexToRgba ? hexToRgba(color, 0.3) : `${color}4d`,
            };
        }
        
        // Status presets
        if (status && STATUS_PRESETS[status]) {
            if (status === "primary") {
                return {
                    bg: hexToRgba ? hexToRgba(primaryColor, 0.15) : chipBg,
                    color: primaryColor,
                    border: hexToRgba ? hexToRgba(primaryColor, 0.3) : primaryColor,
                };
            }
            return STATUS_PRESETS[status];
        }
        
        // Default (primary theme color)
        return {
            bg: chipBg,
            color: primaryColor,
            border: hexToRgba ? hexToRgba(primaryColor, 0.3) : primaryColor,
        };
    };
    
    const colors = getColors();
    
    // ─────────────────────────────────────────────────────────────────────────
    // VARIANT STYLES
    // ─────────────────────────────────────────────────────────────────────────
    const getVariantStyles = () => {
        switch (variant) {
            case "outlined":
                return {
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    color: colors.color,
                };
            case "soft":
                return {
                    background: colors.bg,
                    border: "none",
                    color: colors.color,
                };
            case "dot":
                return {
                    background: "transparent",
                    border: "none",
                    color: theme["color-text"] || "#ffffff",
                };
            case "filled":
            default:
                return {
                    background: colors.color,
                    border: "none",
                    color: "#ffffff",
                };
        }
    };
    
    const variantStyles = getVariantStyles();
    
    // Glow color
    const glowColor = hexToRgba ? hexToRgba(colors.color, 0.4) : colors.bg;
    
    // ─────────────────────────────────────────────────────────────────────────
    // CONTENT
    // ─────────────────────────────────────────────────────────────────────────
    const content = children || label;
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <span
            className={`dc-glo-badge dc-glo-badge-${variant} ${pulse && effectsEnabled ? "dc-pulse-anim" : ""} ${className}`.trim()}
            onClick={clickable && onClick ? onClick : undefined}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: sizing.gap,
                padding: variant === "dot" ? `${sizing.padding.split(" ")[0]} 0` : sizing.padding,
                minHeight: sizing.minHeight,
                fontSize: sizing.fontSize,
                fontWeight: "600",
                lineHeight: 1,
                borderRadius: rounded ? chipRadius : "6px",
                cursor: clickable ? "pointer" : "default",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                userSelect: "none",
                touchAction: clickable ? "manipulation" : "auto", // Prevent double-tap zoom
                ...variantStyles,
                boxShadow: effectsEnabled && glow 
                    ? `0 0 12px ${glowColor}` 
                    : "none",
                ...style,
            }}
        >
            {/* Dot indicator */}
            {variant === "dot" && (
                <span style={{
                    width: sizing.dotSize,
                    height: sizing.dotSize,
                    borderRadius: "50%",
                    background: colors.color,
                    flexShrink: 0,
                    boxShadow: effectsEnabled && glow 
                        ? `0 0 8px ${colors.color}` 
                        : "none",
                }} />
            )}
            
            {/* Left icon */}
            {icon && variant !== "dot" && (
                <span style={{ 
                    fontSize: sizing.iconSize,
                    display: "flex",
                    alignItems: "center",
                }}>
                    {icon}
                </span>
            )}
            
            {/* Content */}
            {content && (
                <span>{content}</span>
            )}
            
            {/* Right icon */}
            {iconRight && (
                <span style={{ 
                    fontSize: sizing.iconSize,
                    display: "flex",
                    alignItems: "center",
                }}>
                    {iconRight}
                </span>
            )}
            
            {/* Remove button - larger touch target */}
            {removable && (
                <span
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onRemove) onRemove();
                    }}
                    onTouchStart={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.4)";
                    }}
                    onTouchEnd={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        // Minimum 24px touch target for remove button (inside badge)
                        width: Math.max(parseInt(sizing.iconSize) + 8, 24) + "px",
                        height: Math.max(parseInt(sizing.iconSize) + 8, 24) + "px",
                        marginLeft: "2px",
                        marginRight: "-4px", // Compensate for larger target
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                        touchAction: "manipulation",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                    }}
                >
                    <svg 
                        width={parseInt(sizing.iconSize)} 
                        height={parseInt(sizing.iconSize)} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </span>
            )}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE GROUP - For displaying multiple badges together
// ═══════════════════════════════════════════════════════════════════════════════
function GloBadgeGroup({
    children,
    gap = "8px",
    wrap = true,
    style = {},
    className = "",
}) {
    return (
        <div 
            className={`dc-glo-badge-group ${className}`.trim()}
            style={{
                display: "flex",
                flexWrap: wrap ? "wrap" : "nowrap",
                gap,
                alignItems: "center",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Demo view
const renderedView = (
    <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: "1.5rem",
        padding: "1rem",
        maxWidth: "400px",
    }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloBadge Component Demo
        </div>
        
        {/* Status badges */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Status Badges</div>
            <GloBadgeGroup>
                <GloBadge status="success">Complete</GloBadge>
                <GloBadge status="warning">Pending</GloBadge>
                <GloBadge status="error">Overdue</GloBadge>
                <GloBadge status="info">New</GloBadge>
                <GloBadge status="neutral">Draft</GloBadge>
            </GloBadgeGroup>
        </div>
        
        {/* Variants */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Variants</div>
            <GloBadgeGroup>
                <GloBadge variant="filled">Filled</GloBadge>
                <GloBadge variant="soft">Soft</GloBadge>
                <GloBadge variant="outlined">Outlined</GloBadge>
                <GloBadge variant="dot">With Dot</GloBadge>
            </GloBadgeGroup>
        </div>
        
        {/* With icons */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>With Icons</div>
            <GloBadgeGroup>
                <GloBadge icon="🏷️" variant="soft">Tag</GloBadge>
                <GloBadge icon="⭐" status="warning" variant="soft">Featured</GloBadge>
                <GloBadge icon="🔥" color="#ff4500" variant="soft">Hot</GloBadge>
            </GloBadgeGroup>
        </div>
        
        {/* Sizes */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Sizes</div>
            <GloBadgeGroup>
                <GloBadge size="small" variant="soft">Small</GloBadge>
                <GloBadge size="medium" variant="soft">Medium</GloBadge>
                <GloBadge size="large" variant="soft">Large</GloBadge>
            </GloBadgeGroup>
        </div>
        
        {/* Removable */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Removable</div>
            <GloBadgeGroup>
                <GloBadge removable onRemove={() => console.log("Remove 1")}>Breakfast</GloBadge>
                <GloBadge removable onRemove={() => console.log("Remove 2")} status="info">Lunch</GloBadge>
                <GloBadge removable onRemove={() => console.log("Remove 3")} color="#9333ea">Dinner</GloBadge>
            </GloBadgeGroup>
        </div>
        
        {/* Effects */}
        <div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Effects</div>
            <GloBadgeGroup>
                <GloBadge glow={true}>Glow</GloBadge>
                <GloBadge pulse={true} status="error">Pulse</GloBadge>
                <GloBadge glow={true} status="success" variant="soft">Success Glow</GloBadge>
            </GloBadgeGroup>
        </div>
    </div>
);

return { 
    renderedView, 
    GloBadge,
    GloBadgeGroup,
};
