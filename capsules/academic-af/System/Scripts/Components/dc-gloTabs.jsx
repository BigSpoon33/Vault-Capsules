// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-TABS - Global Themed Tab Component
// A flexible, theme-aware tab switcher with various styles and animations
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloTabs
// ═══════════════════════════════════════════════════════════════════════════════
function GloTabs({
    // Tabs configuration (required)
    tabs = [],                    // Array of { id, label, icon?, disabled?, content? }
    
    // Active tab control
    activeTab = null,             // Controlled active tab id
    defaultTab = null,            // Initial tab if uncontrolled (or first tab)
    
    // Frontmatter binding
    targetKey = null,             // Frontmatter key to read/write active tab
    targetFile = null,            // File path (null = current file)
    
    // Style variants
    variant = "underline",        // "underline" | "pills" | "boxed" | "minimal"
    size = "medium",              // "small" | "medium" | "large"
    align = "left",               // "left" | "center" | "right" | "stretch"
    
    // Layout
    orientation = "horizontal",   // "horizontal" | "vertical"
    width = "100%",               // Container width
    tabsWidth = null,             // Fixed tabs section width (for vertical)
    
    // Effects
    glow = true,                  // Glow on active tab
    animated = true,              // Animate tab indicator
    
    // Content
    renderContent = true,         // Render tab content below tabs
    contentPadding = "16px",      // Content area padding
    
    // Callbacks
    onChange = null,              // Called with new tab id
    
    // Overrides
    style = {},                   // Additional container styles
    tabsStyle = {},               // Additional tabs bar styles
    contentStyle = {},            // Additional content styles
    className = "",               // Additional CSS classes
    flashy = null,                // Override flashy mode
    
    // Theme overrides (for preview purposes)
    accentColorOverride = null,   // Override accent/primary color
    surfaceColorOverride = null,  // Override surface color
}) {
    const { theme, isLoading } = useTheme();
    const globalFlashyMode = useFlashyMode();
    const current = dc.useCurrentFile();
    
    // State
    const [localActiveTab, setLocalActiveTab] = dc.useState(
        defaultTab || (tabs.length > 0 ? tabs[0].id : null)
    );
    const [indicatorStyle, setIndicatorStyle] = dc.useState({});
    
    // Refs
    const tabsRef = dc.useRef(null);
    const tabRefs = dc.useRef({});
    
    // Load shared CSS
    useComponentCSS();
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET ACTIVE TAB
    // ─────────────────────────────────────────────────────────────────────────
    const getValueFromFrontmatter = () => {
        if (!targetKey) return null;
        
        if (targetFile) {
            const file = app.vault.getAbstractFileByPath(targetFile);
            if (file) {
                const cache = app.metadataCache.getFileCache(file);
                return cache?.frontmatter?.[targetKey] || null;
            }
            return null;
        }
        
        return current?.value(targetKey) || null;
    };
    
    const getCurrentTab = () => {
        if (activeTab !== null) return activeTab;
        if (targetKey) {
            const fmValue = getValueFromFrontmatter();
            if (fmValue) return fmValue;
        }
        return localActiveTab;
    };
    
    const currentTabId = getCurrentTab();
    const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];
    
    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE INDICATOR POSITION
    // ─────────────────────────────────────────────────────────────────────────
    dc.useEffect(() => {
        if (variant !== "underline" || !animated) return;
        
        const activeTabEl = tabRefs.current[currentTabId];
        if (activeTabEl && tabsRef.current) {
            const tabsRect = tabsRef.current.getBoundingClientRect();
            const tabRect = activeTabEl.getBoundingClientRect();
            
            if (orientation === "horizontal") {
                setIndicatorStyle({
                    left: tabRect.left - tabsRect.left,
                    width: tabRect.width,
                });
            } else {
                setIndicatorStyle({
                    top: tabRect.top - tabsRect.top,
                    height: tabRect.height,
                });
            }
        }
    }, [currentTabId, variant, animated, orientation, tabs]);
    
    // Loading state
    if (isLoading) {
        return (
            <div style={{ 
                width,
                height: "48px",
                background: "#2b2b2b",
                borderRadius: "8px",
                opacity: 0.5,
            }} />
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // RESOLVE THEME VALUES
    // ─────────────────────────────────────────────────────────────────────────
    const effectsEnabled = flashy !== null ? flashy : globalFlashyMode;
    
    // Colors (with override support)
    const primaryColor = accentColorOverride || theme["color-primary"] || "#ff69b4";
    const textColor = theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "#888";
    const surfaceColor = surfaceColorOverride || theme["color-surface"] || "#2a2a4e";
    const bgColor = theme["tabs-bg"] || "transparent";
    
    // Sizing
    const sizeConfig = {
        small: { padding: "6px 12px", fontSize: "12px", gap: "4px" },
        medium: { padding: "10px 16px", fontSize: "14px", gap: "8px" },
        large: { padding: "14px 24px", fontSize: "16px", gap: "12px" },
    };
    const sizing = sizeConfig[size] || sizeConfig.medium;
    
    // Glow
    const glowColor = hexToRgba ? hexToRgba(primaryColor, 0.4) : "rgba(255, 105, 180, 0.4)";
    
    // ─────────────────────────────────────────────────────────────────────────
    // TAB CHANGE HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    const handleTabChange = async (tabId) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab || tab.disabled) return;
        
        setLocalActiveTab(tabId);
        
        // Update frontmatter if bound
        if (targetKey) {
            const file = targetFile 
                ? app.vault.getAbstractFileByPath(targetFile) 
                : app.workspace.getActiveFile();
                
            if (file) {
                await app.fileManager.processFrontMatter(file, (fm) => {
                    fm[targetKey] = tabId;
                });
            }
        }
        
        // Callback
        if (onChange) onChange(tabId);
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // VARIANT STYLES
    // ─────────────────────────────────────────────────────────────────────────
    const getTabStyle = (tab) => {
        const isActive = tab.id === currentTabId;
        const isDisabled = tab.disabled;
        
        const baseStyle = {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: sizing.padding,
            fontSize: sizing.fontSize,
            fontWeight: isActive ? "bold" : "normal",
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.4 : 1,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            border: "none",
            outline: "none",
            position: "relative",
            zIndex: isActive ? 1 : 0,
        };
        
        switch (variant) {
            case "pills":
                return {
                    ...baseStyle,
                    background: isActive ? primaryColor : "transparent",
                    color: isActive ? "#fff" : mutedColor,
                    borderRadius: "20px",
                    boxShadow: isActive && effectsEnabled && glow 
                        ? `0 0 15px ${glowColor}` 
                        : "none",
                };
            case "boxed":
                return {
                    ...baseStyle,
                    background: isActive ? surfaceColor : "transparent",
                    color: isActive ? textColor : mutedColor,
                    borderRadius: "8px 8px 0 0",
                    borderBottom: isActive ? `2px solid ${primaryColor}` : "2px solid transparent",
                    marginBottom: "-2px",
                };
            case "minimal":
                return {
                    ...baseStyle,
                    background: "transparent",
                    color: isActive ? primaryColor : mutedColor,
                };
            case "underline":
            default:
                return {
                    ...baseStyle,
                    background: "transparent",
                    color: isActive ? textColor : mutedColor,
                    borderBottom: animated ? "none" : (isActive ? `2px solid ${primaryColor}` : "2px solid transparent"),
                    paddingBottom: animated ? sizing.padding.split(" ")[0] : undefined,
                };
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    const isVertical = orientation === "vertical";
    
    return (
        <div
            className={`dc-glo-tabs dc-glo-tabs-${variant} ${className}`.trim()}
            style={{
                width,
                display: isVertical ? "flex" : "block",
                gap: isVertical ? "16px" : 0,
                ...style,
            }}
        >
            {/* Tabs Bar */}
            <div
                ref={tabsRef}
                className="dc-glo-tabs-bar"
                role="tablist"
                style={{
                    display: "flex",
                    flexDirection: isVertical ? "column" : "row",
                    alignItems: isVertical ? "stretch" : (
                        align === "center" ? "center" :
                        align === "right" ? "flex-end" :
                        align === "stretch" ? "stretch" :
                        "flex-start"
                    ),
                    justifyContent: align === "stretch" ? "stretch" : undefined,
                    gap: sizing.gap,
                    width: isVertical ? tabsWidth : "100%",
                    flexShrink: 0,
                    background: bgColor,
                    borderBottom: !isVertical && variant === "underline" ? "2px solid rgba(255,255,255,0.1)" : "none",
                    borderRight: isVertical && variant === "underline" ? "2px solid rgba(255,255,255,0.1)" : "none",
                    position: "relative",
                    // Mobile horizontal scroll
                    overflowX: isVertical ? "visible" : "auto",
                    overflowY: isVertical ? "auto" : "visible",
                    scrollSnapType: isVertical ? "none" : "x mandatory",
                    WebkitOverflowScrolling: "touch", // Smooth scroll on iOS
                    scrollbarWidth: "none", // Hide scrollbar on Firefox
                    msOverflowStyle: "none", // Hide scrollbar on IE/Edge
                    ...tabsStyle,
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        ref={(el) => { tabRefs.current[tab.id] = el; }}
                        role="tab"
                        aria-selected={tab.id === currentTabId}
                        aria-disabled={tab.disabled}
                        onClick={() => handleTabChange(tab.id)}
                        style={{
                            ...getTabStyle(tab),
                            flex: align === "stretch" ? 1 : undefined,
                            justifyContent: align === "stretch" ? "center" : undefined,
                            minHeight: "44px", // Minimum touch target
                            minWidth: "44px", // Minimum touch target
                            scrollSnapAlign: "start", // Snap to tab start
                            flexShrink: 0, // Don't shrink tabs
                            touchAction: "manipulation", // Prevent double-tap zoom
                        }}
                    >
                        {tab.icon && <span>{tab.icon}</span>}
                        <span>{tab.label}</span>
                    </button>
                ))}
                
                {/* Animated indicator for underline variant */}
                {variant === "underline" && animated && (
                    <div
                        className="dc-glo-tabs-indicator"
                        style={{
                            position: "absolute",
                            bottom: isVertical ? undefined : 0,
                            right: isVertical ? 0 : undefined,
                            height: isVertical ? indicatorStyle.height : "2px",
                            width: isVertical ? "2px" : indicatorStyle.width,
                            left: isVertical ? undefined : indicatorStyle.left,
                            top: isVertical ? indicatorStyle.top : undefined,
                            background: primaryColor,
                            transition: "all 0.25s ease",
                            boxShadow: effectsEnabled && glow 
                                ? `0 0 10px ${glowColor}` 
                                : "none",
                        }}
                    />
                )}
            </div>
            
            {/* Tab Content */}
            {renderContent && currentTab && (
                <div
                    role="tabpanel"
                    className="dc-glo-tabs-content"
                    style={{
                        flex: 1,
                        padding: contentPadding,
                        color: textColor,
                        fontSize: sizing.fontSize,
                        animation: effectsEnabled ? "dc-tab-fade 0.2s ease" : "none",
                        ...contentStyle,
                    }}
                >
                    {currentTab.content}
                </div>
            )}
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
        gap: "2rem",
        padding: "1rem",
        maxWidth: "500px",
    }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloTabs Component Demo
        </div>
        
        {/* Underline variant (default) */}
        <GloTabs 
            tabs={[
                { id: "today", label: "Today", icon: "📅", content: <p>Today's content goes here.</p> },
                { id: "week", label: "This Week", icon: "📆", content: <p>Weekly overview content.</p> },
                { id: "month", label: "Month", icon: "🗓️", content: <p>Monthly summary content.</p> },
            ]}
        />
        
        {/* Pills variant */}
        <GloTabs 
            variant="pills"
            tabs={[
                { id: "all", label: "All", content: <p>All items</p> },
                { id: "active", label: "Active", content: <p>Active items</p> },
                { id: "completed", label: "Completed", content: <p>Completed items</p> },
            ]}
        />
        
        {/* Boxed variant */}
        <GloTabs 
            variant="boxed"
            tabs={[
                { id: "overview", label: "Overview", icon: "📊" },
                { id: "details", label: "Details", icon: "📝" },
                { id: "settings", label: "Settings", icon: "⚙️", disabled: true },
            ]}
            renderContent={false}
        />
        
        {/* Centered stretch */}
        <GloTabs 
            variant="pills"
            align="stretch"
            size="small"
            tabs={[
                { id: "1", label: "One" },
                { id: "2", label: "Two" },
                { id: "3", label: "Three" },
            ]}
            renderContent={false}
        />
    </div>
);

return { 
    renderedView, 
    GloTabs,
};
