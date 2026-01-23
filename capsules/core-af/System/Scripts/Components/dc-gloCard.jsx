// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-CARD - Global Themed Card/Container Component
// Mobile-ready, theme-aware container with flexible layouts.
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, resolveBackground, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

function GloCard({
    children, title = null, subtitle = null, icon = null, footer = null,
    actions = null, variant = "default", size = "medium",
    bg = null, headerBg = null, footerBg = null, borderColor = null,
    width = "100%", minHeight = null, maxHeight = null,
    glow = false, glowColor = null, hover = true, clickable = false,
    collapsible = false, defaultCollapsed = false,
    image = null, imageHeight = "150px", imagePosition = "top",
    onClick = null, onCollapse = null,
    style = {}, className = "", headerStyle = {}, bodyStyle = {}, footerStyle = {}, flashy = null,

    // Background Sizing (Card Idle)
    bgSize = null,                // "auto" | "cover" | "contain" | "50%" | etc.
    bgRepeat = null,              // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    bgPosition = null,            // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Card Hover)
    hoverBgSize = null,           // "auto" | "cover" | "contain" | "50%" | etc.
    hoverBgRepeat = null,         // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    hoverBgPosition = null,       // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Header)
    headerBgSize = null,          // "auto" | "cover" | "contain" | "50%" | etc.
    headerBgRepeat = null,        // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    headerBgPosition = null,      // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Footer)
    footerBgSize = null,          // "auto" | "cover" | "contain" | "50%" | etc.
    footerBgRepeat = null,        // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    footerBgPosition = null,      // "center" | "top left" | "50% 50%" | etc.

    // Transition Direction (for hover animations)
    transitionDirection = null,   // "none" | "left" | "right" | "top" | "bottom"

    // Theme Override (for preview purposes in theme editor)
    themeOverride = null,
}) {
    const { theme: loadedTheme, isLoading } = useTheme();
    const theme = themeOverride || loadedTheme;
    const globalFlashyMode = useFlashyMode();
    
    const [isCollapsed, setIsCollapsed] = dc.useState(defaultCollapsed);
    const [isHovered, setIsHovered] = dc.useState(false);
    
    useComponentCSS();
    
    if (isLoading) return <div style={{ width, height: "100px", background: "#2b2b2b", borderRadius: "12px", opacity: 0.5 }} />;
    
    // ─── THEME & VARIANTS ────────────────────────────────────────────────────────
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    const themeCardBg = theme["card-bg-color"] || theme["color-surface"] || "#2a2a4e";
    const themeBorder = theme["card-border"] || "1px solid rgba(255,255,255,0.1)";
    const themeShadow = theme["card-shadow"] || "0 4px 15px rgba(0,0,0,0.1)";
    const themePadding = theme["card-padding"] || "16px";
    const primaryColor = theme["color-primary"] || "#ff69b4";
    const textColor = theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "#888";

    const sizeConfig = {
        small: { padding: "12px", headerPad: "12px", fontSize: "13px", titleSize: "14px" },
        medium: { padding: themePadding, headerPad: "16px", fontSize: "14px", titleSize: "16px" },
        large: { padding: "24px", headerPad: "20px", fontSize: "15px", titleSize: "18px" },
    };
    const sizing = sizeConfig[size] || sizeConfig.medium;

    const resolvedGlowColor = glowColor || (hexToRgba ? hexToRgba(primaryColor, 0.4) : "rgba(255, 105, 180, 0.4)");

    // Background Sizing - Hybrid approach: props override theme defaults
    const bgSizeResolved = bgSize || theme["card-bg-size"] || "auto";
    const bgRepeatResolved = bgRepeat || theme["card-bg-repeat"] || "repeat";
    const bgPositionResolved = bgPosition || theme["card-bg-position"] || "center";

    const hoverBgSizeResolved = hoverBgSize || theme["card-hover-bg-size"] || bgSizeResolved;
    const hoverBgRepeatResolved = hoverBgRepeat || theme["card-hover-bg-repeat"] || bgRepeatResolved;
    const hoverBgPositionResolved = hoverBgPosition || theme["card-hover-bg-position"] || bgPositionResolved;

    const headerBgSizeResolved = headerBgSize || theme["card-header-bg-size"] || "auto";
    const headerBgRepeatResolved = headerBgRepeat || theme["card-header-bg-repeat"] || "repeat";
    const headerBgPositionResolved = headerBgPosition || theme["card-header-bg-position"] || "center";

    const footerBgSizeResolved = footerBgSize || theme["card-footer-bg-size"] || "auto";
    const footerBgRepeatResolved = footerBgRepeat || theme["card-footer-bg-repeat"] || "repeat";
    const footerBgPositionResolved = footerBgPosition || theme["card-footer-bg-position"] || "center";

    // Transition Direction
    const transitionDir = transitionDirection || theme["card-transition-direction"] || "none";

    // Determine current background sizing based on hover state
    const currentBgSize = isHovered ? hoverBgSizeResolved : bgSizeResolved;
    const currentBgRepeat = isHovered ? hoverBgRepeatResolved : bgRepeatResolved;
    const currentBgPosition = isHovered ? hoverBgPositionResolved : bgPositionResolved;

    // Resolve backgrounds
    const resolvedHeaderBg = headerBg ? resolveBackground(headerBg) : "transparent";
    const resolvedFooterBg = footerBg ? resolveBackground(footerBg) : "transparent";

    const getVariantStyles = () => {
        const baseBg = bg ? resolveBackground(bg) : themeCardBg;
        const isImageBg = baseBg.startsWith("url(") || baseBg.includes("gradient(");

        const baseStyles = {
            backgroundSize: currentBgSize,
            backgroundRepeat: currentBgRepeat,
            backgroundPosition: currentBgPosition,
        };

        switch (variant) {
            case "elevated":
                return {
                    backgroundImage: isImageBg ? baseBg : "none",
                    backgroundColor: isImageBg ? "transparent" : baseBg,
                    ...baseStyles,
                    border: "none",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                };
            case "outlined":
                return {
                    backgroundImage: "none",
                    backgroundColor: "transparent",
                    ...baseStyles,
                    border: borderColor ? `1px solid ${borderColor}` : themeBorder,
                    boxShadow: "none",
                };
            case "ghost":
                return {
                    backgroundImage: "none",
                    backgroundColor: "transparent",
                    ...baseStyles,
                    border: "none",
                    boxShadow: "none",
                };
            case "glass":
                return {
                    backgroundImage: "none",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    ...baseStyles,
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: themeShadow,
                    backdropFilter: "blur(10px)",
                };
            default:
                return {
                    backgroundImage: isImageBg ? baseBg : "none",
                    backgroundColor: isImageBg ? "transparent" : baseBg,
                    ...baseStyles,
                    border: borderColor ? `1px solid ${borderColor}` : themeBorder,
                    boxShadow: themeShadow,
                };
        }
    };
    
    const variantStyles = getVariantStyles();

    // ─── RENDERERS ───────────────────────────────────────────────────────────────
    const hasHeader = title || subtitle || icon || actions || collapsible;
    
    const renderHeader = () => {
        if (!hasHeader) return null;
        const isHeaderImageBg = resolvedHeaderBg.startsWith("url(") || resolvedHeaderBg.includes("gradient(");
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                padding: sizing.headerPad,
                backgroundImage: isHeaderImageBg ? resolvedHeaderBg : "none",
                backgroundColor: isHeaderImageBg ? "transparent" : resolvedHeaderBg,
                backgroundSize: headerBgSizeResolved,
                backgroundRepeat: headerBgRepeatResolved,
                backgroundPosition: headerBgPositionResolved,
                borderBottom: (children || footer) && !isCollapsed ? "1px solid rgba(255,255,255,0.05)" : "none",
                cursor: collapsible ? "pointer" : "default",
                touchAction: collapsible ? "manipulation" : "auto",
                ...headerStyle,
            }} onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                    {icon && <span style={{ fontSize: sizing.titleSize, flexShrink: 0 }}>{icon}</span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {title && <div style={{ fontSize: sizing.titleSize, fontWeight: "bold", color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>}
                        {subtitle && <div style={{ fontSize: "12px", color: mutedColor, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {actions}
                    {collapsible && (
                        <div style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", color: mutedColor }}>▼</div>
                    )}
                </div>
            </div>
        );
    };

    const renderImage = () => {
        if (!image) return null;
        return (
            <div style={{
                width: imagePosition === "left" || imagePosition === "right" ? "40%" : "100%",
                height: imagePosition === "left" || imagePosition === "right" ? "auto" : imageHeight,
                minHeight: imagePosition === "left" || imagePosition === "right" ? "100%" : undefined,
                backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0,
            }} />
        );
    };

    const isHorizontal = imagePosition === "left" || imagePosition === "right";

    return (
        <div 
            onClick={clickable && onClick ? onClick : undefined}
            onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
            style={{
                width, minHeight, maxHeight, borderRadius: "12px", overflow: "hidden",
                display: isHorizontal ? "flex" : "block", flexDirection: imagePosition === "right" ? "row-reverse" : "row",
                cursor: clickable ? "pointer" : "default", transition: "all 0.2s ease", ...variantStyles,
                boxShadow: effectsEnabled && glow && isHovered ? `0 0 20px 5px ${resolvedGlowColor}` : variantStyles.boxShadow,
                transform: hover && isHovered && effectsEnabled ? "translateY(-2px)" : "none",
                touchAction: clickable ? "manipulation" : "auto", // Prevent double-tap zoom when clickable
                ...style,
            }}
        >
            {(imagePosition === "top" || imagePosition === "left") && renderImage()}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                {renderHeader()}
                {!isCollapsed && children && <div style={{ padding: sizing.padding, fontSize: sizing.fontSize, color: textColor, flex: 1, overflow: maxHeight ? "auto" : "visible", ...bodyStyle }}>{children}</div>}
                {!isCollapsed && footer && (() => {
                    const isFooterImageBg = resolvedFooterBg.startsWith("url(") || resolvedFooterBg.includes("gradient(");
                    return (
                        <div style={{
                            padding: sizing.headerPad,
                            backgroundImage: isFooterImageBg ? resolvedFooterBg : "none",
                            backgroundColor: isFooterImageBg ? "transparent" : resolvedFooterBg,
                            backgroundSize: footerBgSizeResolved,
                            backgroundRepeat: footerBgRepeatResolved,
                            backgroundPosition: footerBgPositionResolved,
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            fontSize: "12px",
                            color: mutedColor,
                            ...footerStyle,
                        }}>{footer}</div>
                    );
                })()}
            </div>
            {(imagePosition === "bottom" || imagePosition === "right") && renderImage()}
        </div>
    );
}

return { GloCard, Func: GloCard };