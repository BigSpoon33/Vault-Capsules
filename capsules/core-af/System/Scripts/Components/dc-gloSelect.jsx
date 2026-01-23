// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-SELECT - Global Themed Dropdown/Select Component
// A fully customizable, theme-aware dropdown with search, icons, and frontmatter binding
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, resolveBackground, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloSelect
// ═══════════════════════════════════════════════════════════════════════════════
function GloSelect({
    // Options (required)
    options = [],                 // Array of { value, label, icon?, disabled? } or strings
    
    // Value (controlled or frontmatter-bound)
    value = null,                 // Controlled value
    defaultValue = null,          // Initial value if uncontrolled
    targetKey = null,             // Frontmatter key to read/write
    targetFile = null,            // File path (null = current file)
    
    // Display
    placeholder = "Select...",   // Placeholder when no selection
    label = null,                 // Optional label above dropdown
    showIcon = true,              // Show icons from options
    
    // Search/Filter
    searchable = false,           // Enable search filtering
    searchPlaceholder = "Search...",
    
    // Multiple selection
    multiple = false,             // Allow multiple selections
    maxSelections = null,         // Limit selections (null = unlimited)
    
    // Appearance
    size = "medium",              // "small" | "medium" | "large"
    variant = "default",          // "default" | "ghost" | "minimal"
    width = "100%",               // Container width
    maxHeight = "250px",          // Max dropdown height before scroll
    
    // Dropdown position
    position = "bottom",          // "bottom" | "top" | "auto"
    align = "left",               // "left" | "right"
    
    // Effects
    glow = true,                  // Enable glow effect
    
    // Callbacks
    onChange = null,              // Called with new value(s)
    onOpen = null,                // Called when dropdown opens
    onClose = null,               // Called when dropdown closes
    
    // Overrides
    style = {},                   // Additional inline styles
    className = "",               // Additional CSS classes
    disabled = false,             // Disable the select
    flashy = null,                // Override flashy mode

    // Theme overrides (for preview purposes)
    bgOverride = null,            // Override background
    borderOverride = null,        // Override border
    accentColorOverride = null,   // Override accent/primary color

    // Background Sizing (Idle/Closed)
    bgSize = null,                // "auto" | "cover" | "contain" | "50%" | etc.
    bgRepeat = null,              // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    bgPosition = null,            // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Open/Focused)
    openBgSize = null,            // "auto" | "cover" | "contain" | "50%" | etc.
    openBgRepeat = null,          // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    openBgPosition = null,        // "center" | "top left" | "50% 50%" | etc.

    // Transition Direction (for open animations)
    transitionDirection = null,   // "none" | "left" | "right" | "top" | "bottom"

    // Theme Override (for preview purposes in theme editor)
    themeOverride = null,
}) {
    const { theme: loadedTheme, isLoading } = useTheme();
    const theme = themeOverride || loadedTheme;
    const globalFlashyMode = useFlashyMode();
    const current = dc.useCurrentFile();
    
    // State
    const [isOpen, setIsOpen] = dc.useState(false);
    const [searchQuery, setSearchQuery] = dc.useState("");
    const [localValue, setLocalValue] = dc.useState(defaultValue);
    const [focusedIndex, setFocusedIndex] = dc.useState(-1);
    
    // Refs
    const containerRef = dc.useRef(null);
    const searchRef = dc.useRef(null);
    const dropdownRef = dc.useRef(null);
    
    // State for auto-positioning
    const [dropdownPosition, setDropdownPosition] = dc.useState(position);
    
    // Load shared CSS
    useComponentCSS();
    
    // ─────────────────────────────────────────────────────────────────────────
    // NORMALIZE OPTIONS
    // ─────────────────────────────────────────────────────────────────────────
    const normalizedOptions = options.map(opt => {
        if (typeof opt === "string") {
            return { value: opt, label: opt };
        }
        return { 
            value: opt.value, 
            label: opt.label || opt.value,
            icon: opt.icon,
            disabled: opt.disabled || false,
        };
    });
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET CURRENT VALUE
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
    
    const getCurrentValue = () => {
        if (value !== null) return value;
        if (targetKey) return getValueFromFrontmatter();
        return localValue;
    };
    
    const currentValue = getCurrentValue();
    
    // For multiple, ensure it's an array
    const selectedValues = multiple 
        ? (Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []))
        : currentValue;
    
    // Sync local value with props
    dc.useEffect(() => {
        if (value !== null) {
            setLocalValue(value);
        } else if (targetKey) {
            setLocalValue(getValueFromFrontmatter());
        }
    }, [value, targetKey, targetFile]);
    
    // ─────────────────────────────────────────────────────────────────────────
    // FILTER OPTIONS BY SEARCH
    // ─────────────────────────────────────────────────────────────────────────
    const filteredOptions = searchable && searchQuery
        ? normalizedOptions.filter(opt => 
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : normalizedOptions;
    
    // ─────────────────────────────────────────────────────────────────────────
    // CLOSE ON OUTSIDE CLICK
    // ─────────────────────────────────────────────────────────────────────────
    dc.useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchQuery("");
                if (onClose) onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);
    
    // Focus search when opened + auto-position dropdown
    dc.useEffect(() => {
        if (isOpen && searchable && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
        
        // Auto-position dropdown based on viewport space
        if (isOpen && containerRef.current && position === "auto") {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = parseInt(maxHeight) || 250;
            
            // If not enough space below and more space above, position on top
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setDropdownPosition("top");
            } else {
                setDropdownPosition("bottom");
            }
        } else if (position !== "auto") {
            setDropdownPosition(position);
        }
    }, [isOpen, searchable, position, maxHeight]);
    
    // Loading state
    if (isLoading) {
        return (
            <div style={{ 
                width,
                height: "40px",
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
    // Use resolveBackground to properly wrap images in url()
    const bgColorRaw = bgOverride || theme["select-bg"] || theme["input-bg"] || "rgba(255,255,255,0.05)";
    const bgColor = resolveBackground(bgColorRaw);
    const borderColor = borderOverride || theme["select-border"] || theme["input-border"] || "1px solid rgba(255,105,180,0.3)";
    const borderFocus = theme["select-border-focus"] || theme["input-border-focus"] || "1px solid #ff69b4";
    const textColor = theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "#888";
    const primaryColor = accentColorOverride || theme["color-primary"] || "#ff69b4";
    const surfaceColorRaw = theme["color-surface"] || "#2a2a4e";
    const surfaceColor = resolveBackground(surfaceColorRaw);
    
    // Sizing
    const sizeConfig = {
        small: { padding: "6px 10px", fontSize: "12px", radius: "6px", height: "32px" },
        medium: { padding: "10px 14px", fontSize: "14px", radius: "8px", height: "40px" },
        large: { padding: "14px 18px", fontSize: "16px", radius: "10px", height: "48px" },
    };
    const sizing = sizeConfig[size] || sizeConfig.medium;
    
    // Glow
    const glowColor = hexToRgba ? hexToRgba(primaryColor, 0.4) : "rgba(255, 105, 180, 0.4)";

    // Background Sizing - Hybrid approach: props override theme defaults
    const bgSizeResolved = bgSize || theme["select-bg-size"] || "auto";
    const bgRepeatResolved = bgRepeat || theme["select-bg-repeat"] || "repeat";
    const bgPositionResolved = bgPosition || theme["select-bg-position"] || "center";

    const openBgSizeResolved = openBgSize || theme["select-open-bg-size"] || "auto";
    const openBgRepeatResolved = openBgRepeat || theme["select-open-bg-repeat"] || "repeat";
    const openBgPositionResolved = openBgPosition || theme["select-open-bg-position"] || "center";

    // Transition Direction
    const transitionDir = transitionDirection || theme["select-transition-direction"] || "none";

    // Determine current background sizing based on state
    const currentBgSize = isOpen ? openBgSizeResolved : bgSizeResolved;
    const currentBgRepeat = isOpen ? openBgRepeatResolved : bgRepeatResolved;
    const currentBgPosition = isOpen ? openBgPositionResolved : bgPositionResolved;

    // ─────────────────────────────────────────────────────────────────────────
    // VALUE UPDATE HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    const updateValue = async (newValue) => {
        let finalValue = newValue;
        
        if (multiple) {
            const currentArray = Array.isArray(selectedValues) ? selectedValues : [];
            
            if (currentArray.includes(newValue)) {
                // Remove if already selected
                finalValue = currentArray.filter(v => v !== newValue);
            } else {
                // Add if not at max
                if (maxSelections && currentArray.length >= maxSelections) {
                    return; // At max, don't add
                }
                finalValue = [...currentArray, newValue];
            }
        }
        
        setLocalValue(finalValue);
        
        // Update frontmatter if bound
        if (targetKey) {
            const file = targetFile 
                ? app.vault.getAbstractFileByPath(targetFile) 
                : app.workspace.getActiveFile();
                
            if (file) {
                await app.fileManager.processFrontMatter(file, (fm) => {
                    fm[targetKey] = finalValue;
                });
            }
        }
        
        // Callback
        if (onChange) {
            onChange(finalValue);
        }
        
        // Close if single select
        if (!multiple) {
            setIsOpen(false);
            setSearchQuery("");
            if (onClose) onClose();
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // KEYBOARD NAVIGATION
    // ─────────────────────────────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (disabled) return;
        
        switch (e.key) {
            case "Enter":
            case " ":
                if (!isOpen) {
                    e.preventDefault();
                    setIsOpen(true);
                    if (onOpen) onOpen();
                } else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
                    e.preventDefault();
                    const opt = filteredOptions[focusedIndex];
                    if (!opt.disabled) {
                        updateValue(opt.value);
                    }
                }
                break;
            case "Escape":
                setIsOpen(false);
                setSearchQuery("");
                if (onClose) onClose();
                break;
            case "ArrowDown":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    if (onOpen) onOpen();
                } else {
                    setFocusedIndex(prev => 
                        Math.min(prev + 1, filteredOptions.length - 1)
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET DISPLAY VALUE
    // ─────────────────────────────────────────────────────────────────────────
    const getDisplayValue = () => {
        if (multiple) {
            if (!selectedValues || selectedValues.length === 0) {
                return placeholder;
            }
            
            const selectedLabels = selectedValues.map(val => {
                const opt = normalizedOptions.find(o => o.value === val);
                return opt ? opt.label : val;
            });
            
            if (selectedLabels.length <= 2) {
                return selectedLabels.join(", ");
            }
            return `${selectedLabels.length} selected`;
        } else {
            const selectedOpt = normalizedOptions.find(o => o.value === currentValue);
            return selectedOpt ? selectedOpt.label : placeholder;
        }
    };
    
    const getSelectedIcon = () => {
        if (multiple || !showIcon) return null;
        const selectedOpt = normalizedOptions.find(o => o.value === currentValue);
        return selectedOpt?.icon || null;
    };
    
    const displayValue = getDisplayValue();
    const displayIcon = getSelectedIcon();
    const hasValue = multiple ? (selectedValues && selectedValues.length > 0) : !!currentValue;
    
    // ─────────────────────────────────────────────────────────────────────────
    // VARIANT STYLES
    // ─────────────────────────────────────────────────────────────────────────
    const getVariantStyles = () => {
        const isImageBg = bgColor.startsWith("url(") || bgColor.includes("gradient(");

        switch (variant) {
            case "ghost":
                return {
                    backgroundImage: "none",
                    backgroundColor: "transparent",
                    backgroundSize: currentBgSize,
                    backgroundRepeat: currentBgRepeat,
                    backgroundPosition: currentBgPosition,
                    border: "1px solid transparent",
                    borderHover: borderColor,
                };
            case "minimal":
                return {
                    backgroundImage: "none",
                    backgroundColor: "transparent",
                    backgroundSize: currentBgSize,
                    backgroundRepeat: currentBgRepeat,
                    backgroundPosition: currentBgPosition,
                    border: "none",
                    borderHover: "none",
                };
            default:
                return {
                    backgroundImage: isImageBg ? bgColor : "none",
                    backgroundColor: isImageBg ? "transparent" : bgColor,
                    backgroundSize: currentBgSize,
                    backgroundRepeat: currentBgRepeat,
                    backgroundPosition: currentBgPosition,
                    border: borderColor,
                    borderHover: borderFocus,
                };
        }
    };

    const variantStyles = getVariantStyles();
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className={`dc-glo-select ${className}`.trim()}
            style={{
                width,
                position: "relative",
                ...style,
            }}
        >
            {/* Label */}
            {label && (
                <div style={{
                    marginBottom: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: textColor,
                }}>
                    {label}
                </div>
            )}
            
            {/* Trigger Button */}
            <div
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setIsOpen(!isOpen);
                    if (!isOpen && onOpen) onOpen();
                    if (isOpen && onClose) onClose();
                }}
                onKeyDown={handleKeyDown}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    width: "100%",
                    minHeight: "44px", // Minimum touch target height
                    height: sizing.height,
                    padding: sizing.padding,
                    fontSize: sizing.fontSize,
                    borderRadius: sizing.radius,
                    backgroundImage: variantStyles.backgroundImage,
                    backgroundColor: variantStyles.backgroundColor,
                    backgroundSize: variantStyles.backgroundSize,
                    backgroundRepeat: variantStyles.backgroundRepeat,
                    backgroundPosition: variantStyles.backgroundPosition,
                    border: isOpen ? variantStyles.borderHover : variantStyles.border,
                    color: hasValue ? textColor : mutedColor,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    transition: "all 0.2s ease, background-position 0.3s ease-out",
                    boxShadow: effectsEnabled && glow && isOpen
                        ? `0 0 15px 3px ${glowColor}`
                        : "none",
                    outline: "none",
                    touchAction: "manipulation", // Prevent double-tap zoom
                }}
            >
                {/* Left side: icon + text */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflow: "hidden",
                    flex: 1,
                }}>
                    {displayIcon && (
                        <span style={{ flexShrink: 0 }}>{displayIcon}</span>
                    )}
                    <span style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}>
                        {displayValue}
                    </span>
                </div>
                
                {/* Chevron */}
                <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={mutedColor}
                    strokeWidth="2"
                    style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0,
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            
            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    role="listbox"
                    style={{
                        position: "absolute",
                        top: dropdownPosition === "top" ? "auto" : "100%",
                        bottom: dropdownPosition === "top" ? "100%" : "auto",
                        left: align === "right" ? "auto" : 0,
                        right: align === "right" ? 0 : "auto",
                        width: "100%",
                        minWidth: "150px", // Ensure dropdown is always readable
                        marginTop: dropdownPosition === "top" ? 0 : "4px",
                        marginBottom: dropdownPosition === "top" ? "4px" : 0,
                        background: surfaceColor,
                        border: borderColor,
                        borderRadius: sizing.radius,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        zIndex: 1000,
                        overflow: "hidden",
                    }}
                >
                    {/* Search Input */}
                    {searchable && (
                        <div style={{ padding: "8px" }}>
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setFocusedIndex(0);
                                }}
                                placeholder={searchPlaceholder}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    fontSize: sizing.fontSize,
                                    backgroundImage: bgColor.startsWith("url(") || bgColor.includes("gradient(") ? bgColor : "none",
                                    backgroundColor: bgColor.startsWith("url(") || bgColor.includes("gradient(") ? "transparent" : bgColor,
                                    border: borderColor,
                                    borderRadius: "4px",
                                    color: textColor,
                                    outline: "none",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    
                    {/* Options List */}
                    <div style={{
                        maxHeight: maxHeight,
                        overflowY: "auto",
                    }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{
                                padding: sizing.padding,
                                color: mutedColor,
                                textAlign: "center",
                                fontSize: sizing.fontSize,
                            }}>
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map((opt, index) => {
                                const isSelected = multiple 
                                    ? selectedValues.includes(opt.value)
                                    : currentValue === opt.value;
                                const isFocused = focusedIndex === index;
                                
                                return (
                                    <div
                                        key={opt.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        aria-disabled={opt.disabled}
                                        onClick={() => {
                                            if (!opt.disabled) {
                                                updateValue(opt.value);
                                            }
                                        }}
                                        onMouseEnter={() => setFocusedIndex(index)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: sizing.padding,
                                            minHeight: "44px", // Minimum touch target height
                                            fontSize: sizing.fontSize,
                                            cursor: opt.disabled ? "not-allowed" : "pointer",
                                            opacity: opt.disabled ? 0.4 : 1,
                                            background: isSelected 
                                                ? `${primaryColor}33`
                                                : isFocused 
                                                    ? "rgba(255,255,255,0.05)"
                                                    : "transparent",
                                            color: isSelected ? primaryColor : textColor,
                                            borderLeft: isSelected 
                                                ? `3px solid ${primaryColor}` 
                                                : "3px solid transparent",
                                            transition: "all 0.15s ease",
                                            touchAction: "manipulation",
                                        }}
                                    >
                                        {/* Checkbox for multiple */}
                                        {multiple && (
                                            <div style={{
                                                width: "16px",
                                                height: "16px",
                                                border: `2px solid ${isSelected ? primaryColor : mutedColor}`,
                                                borderRadius: "3px",
                                                background: isSelected ? primaryColor : "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                {isSelected && (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Icon */}
                                        {showIcon && opt.icon && (
                                            <span style={{ flexShrink: 0 }}>{opt.icon}</span>
                                        )}
                                        
                                        {/* Label */}
                                        <span style={{
                                            flex: 1,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {opt.label}
                                        </span>
                                        
                                        {/* Checkmark for single */}
                                        {!multiple && isSelected && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
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
        maxWidth: "300px",
    }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloSelect Component Demo
        </div>
        
        {/* Basic select */}
        <GloSelect 
            label="Category"
            options={[
                { value: "breakfast", label: "Breakfast", icon: "🍳" },
                { value: "lunch", label: "Lunch", icon: "🥗" },
                { value: "dinner", label: "Dinner", icon: "🍝" },
                { value: "snack", label: "Snack", icon: "🍿" },
            ]}
            placeholder="Choose a meal..."
            onChange={(v) => console.log("Selected:", v)}
        />
        
        {/* Searchable */}
        <GloSelect 
            label="Search Example"
            options={["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"]}
            searchable={true}
            placeholder="Search fruits..."
        />
        
        {/* Multiple selection */}
        <GloSelect 
            label="Multiple Selection"
            options={[
                { value: "strength", label: "Strength", icon: "💪" },
                { value: "cardio", label: "Cardio", icon: "🏃" },
                { value: "flexibility", label: "Flexibility", icon: "🧘" },
                { value: "balance", label: "Balance", icon: "⚖️" },
            ]}
            multiple={true}
            placeholder="Select workout types..."
        />
        
        {/* Different sizes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <GloSelect options={["Small"]} size="small" placeholder="Small" />
            <GloSelect options={["Medium"]} size="medium" placeholder="Medium" />
            <GloSelect options={["Large"]} size="large" placeholder="Large" />
        </div>
    </div>
);

return { 
    renderedView, 
    GloSelect,
};
