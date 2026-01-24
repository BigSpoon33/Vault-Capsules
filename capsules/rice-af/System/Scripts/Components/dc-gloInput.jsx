// ═══════════════════════════════════════════════════════════════════════════════
// DC-GLO-INPUT - Global Themed Input Component
// A versatile, theme-aware input with validation, icons, and frontmatter binding
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, useFlashyMode, hexToRgba, resolveBackground } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GloInput
// ═══════════════════════════════════════════════════════════════════════════════
function GloInput({
    // Value (controlled or frontmatter-bound)
    value = "",                   // Controlled value
    defaultValue = "",            // Initial value if uncontrolled
    targetKey = null,             // Frontmatter key to read/write
    targetFile = null,            // File path (null = current file)
    
    // Input type
    type = "text",                // "text" | "number" | "email" | "password" | "search" | "url" | "textarea"
    
    // Display
    label = null,                 // Label above input
    placeholder = "",             // Placeholder text
    helperText = null,            // Helper text below input
    
    // Icons
    iconLeft = null,              // Left icon (emoji or SVG)
    iconRight = null,             // Right icon
    
    // Validation
    required = false,             // Required field
    minLength = null,             // Minimum length
    maxLength = null,             // Maximum length
    min = null,                   // Minimum value (for number)
    max = null,                   // Maximum value (for number)
    pattern = null,               // Regex pattern
    validate = null,              // Custom validation function: (value) => string | null
    showError = true,             // Show error message
    
    // Appearance
    size = "medium",              // "small" | "medium" | "large"
    variant = "default",          // "default" | "filled" | "ghost"
    width = "100%",               // Input width
    
    // Textarea specific
    rows = 3,                     // Number of rows for textarea
    autoResize = false,           // Auto-resize textarea
    
    // Behavior
    disabled = false,             // Disable input
    readOnly = false,             // Read-only
    autoFocus = false,            // Auto focus on mount
    clearable = false,            // Show clear button
    debounce = 0,                 // Debounce delay in ms for onChange
    
    // Effects
    glow = true,                  // Glow on focus
    
    // Callbacks
    onChange = null,              // Called with new value
    onFocus = null,               // Called on focus
    onBlur = null,                // Called on blur
    onEnter = null,               // Called when Enter is pressed
    onClear = null,               // Called when cleared
    
    // Overrides
    style = {},                   // Additional container styles
    inputStyle = {},              // Additional input styles
    className = "",               // Additional CSS classes
    flashy = null,                // Override flashy mode

    // Theme overrides (for preview purposes)
    bgOverride = null,            // Override input background
    borderOverride = null,        // Override border
    borderFocusOverride = null,   // Override focus border
    accentColorOverride = null,   // Override accent/primary color

    // Background Sizing (Idle)
    bgSize = null,                // "auto" | "cover" | "contain" | "50%" | etc.
    bgRepeat = null,              // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    bgPosition = null,            // "center" | "top left" | "50% 50%" | etc.

    // Background Sizing (Focus)
    focusBgSize = null,           // "auto" | "cover" | "contain" | "50%" | etc.
    focusBgRepeat = null,         // "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
    focusBgPosition = null,       // "center" | "top left" | "50% 50%" | etc.

    // Transition Direction (for focus animations)
    transitionDirection = null,   // "none" | "left" | "right" | "top" | "bottom"

    // Theme Override (for preview purposes in theme editor)
    themeOverride = null,
}) {
    const { theme: loadedTheme, isLoading } = useTheme();
    const theme = themeOverride || loadedTheme;
    const globalFlashyMode = useFlashyMode();
    const current = dc.useCurrentFile();
    
    // State
    const [localValue, setLocalValue] = dc.useState(defaultValue);
    const [isFocused, setIsFocused] = dc.useState(false);
    const [error, setError] = dc.useState(null);
    const [touched, setTouched] = dc.useState(false);
    
    // Refs
    const inputRef = dc.useRef(null);
    const debounceRef = dc.useRef(null);
    
    // Load shared CSS
    useComponentCSS();
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET CURRENT VALUE
    // ─────────────────────────────────────────────────────────────────────────
    const getValueFromFrontmatter = () => {
        if (!targetKey) return "";
        
        if (targetFile) {
            const file = app.vault.getAbstractFileByPath(targetFile);
            if (file) {
                const cache = app.metadataCache.getFileCache(file);
                return cache?.frontmatter?.[targetKey] || "";
            }
            return "";
        }
        
        return current?.value(targetKey) || "";
    };
    
    const getCurrentValue = () => {
        if (value !== "") return value;
        if (targetKey) return getValueFromFrontmatter();
        return localValue;
    };
    
    const currentValue = getCurrentValue();
    
    // Sync local value
    dc.useEffect(() => {
        if (value !== "") {
            setLocalValue(value);
        } else if (targetKey) {
            setLocalValue(getValueFromFrontmatter());
        }
    }, [value, targetKey, targetFile]);
    
    // Auto focus
    dc.useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, []);
    
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
    const inputBgRaw = bgOverride || theme["input-bg"] || "rgba(255,255,255,0.05)";
    const inputBg = resolveBackground(inputBgRaw);
    const inputBorder = borderOverride || theme["input-border"] || "1px solid rgba(255,105,180,0.3)";
    const inputBorderFocus = borderFocusOverride || theme["input-border-focus"] || "1px solid #ff69b4";
    const inputRadius = theme["input-border-radius"] || "6px";
    const textColor = theme["input-text-color"] || theme["color-text"] || "#ffffff";
    const mutedColor = theme["color-text-muted"] || "#888";
    const primaryColor = accentColorOverride || theme["color-primary"] || "#ff69b4";
    const errorColor = theme["color-error"] || "#ff0000";
    const surfaceColorRaw = theme["color-surface"] || "#2a2a4e";
    const surfaceColor = resolveBackground(surfaceColorRaw);
    
    // Sizing
    const sizeConfig = {
        small: { padding: "6px 10px", fontSize: "12px", height: "32px", labelSize: "11px" },
        medium: { padding: "10px 14px", fontSize: "14px", height: "40px", labelSize: "12px" },
        large: { padding: "14px 18px", fontSize: "16px", height: "48px", labelSize: "14px" },
    };
    const sizing = sizeConfig[size] || sizeConfig.medium;
    
    // Glow
    const glowColor = hexToRgba ? hexToRgba(primaryColor, 0.4) : "rgba(255, 105, 180, 0.4)";
    const errorGlowColor = hexToRgba ? hexToRgba(errorColor, 0.4) : "rgba(255, 0, 0, 0.4)";

    // Background Sizing - Hybrid approach: props override theme defaults
    const bgSizeResolved = bgSize || theme["input-bg-size"] || "auto";
    const bgRepeatResolved = bgRepeat || theme["input-bg-repeat"] || "repeat";
    const bgPositionResolved = bgPosition || theme["input-bg-position"] || "center";

    const focusBgSizeResolved = focusBgSize || theme["input-focus-bg-size"] || "auto";
    const focusBgRepeatResolved = focusBgRepeat || theme["input-focus-bg-repeat"] || "repeat";
    const focusBgPositionResolved = focusBgPosition || theme["input-focus-bg-position"] || "center";

    // Transition Direction
    const transitionDir = transitionDirection || theme["input-transition-direction"] || "none";

    // Determine current background sizing based on state
    const currentBgSize = isFocused ? focusBgSizeResolved : bgSizeResolved;
    const currentBgRepeat = isFocused ? focusBgRepeatResolved : bgRepeatResolved;
    const currentBgPosition = isFocused ? focusBgPositionResolved : bgPositionResolved;

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    const validateValue = (val) => {
        if (required && !val) {
            return "This field is required";
        }
        
        if (minLength && val.length < minLength) {
            return `Minimum ${minLength} characters required`;
        }
        
        if (maxLength && val.length > maxLength) {
            return `Maximum ${maxLength} characters allowed`;
        }
        
        if (type === "number") {
            const num = parseFloat(val);
            if (min !== null && num < min) return `Minimum value is ${min}`;
            if (max !== null && num > max) return `Maximum value is ${max}`;
        }
        
        if (pattern) {
            const regex = new RegExp(pattern);
            if (!regex.test(val)) return "Invalid format";
        }
        
        if (validate) {
            return validate(val);
        }
        
        return null;
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALUE UPDATE HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    const updateValue = async (newValue, saveToFrontmatter = true) => {
        setLocalValue(newValue);
        
        // Validate if touched
        if (touched) {
            setError(validateValue(newValue));
        }
        
        // Handle debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        const processUpdate = async () => {
            // Update frontmatter if bound
            if (saveToFrontmatter && targetKey) {
                const file = targetFile 
                    ? app.vault.getAbstractFileByPath(targetFile) 
                    : app.workspace.getActiveFile();
                    
                if (file) {
                    await app.fileManager.processFrontMatter(file, (fm) => {
                        fm[targetKey] = type === "number" ? parseFloat(newValue) || 0 : newValue;
                    });
                }
            }
            
            // Callback
            if (onChange) {
                onChange(type === "number" ? parseFloat(newValue) || 0 : newValue);
            }
        };
        
        if (debounce > 0) {
            debounceRef.current = setTimeout(processUpdate, debounce);
        } else {
            await processUpdate();
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        updateValue(e.target.value);
    };
    
    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };
    
    const handleBlur = (e) => {
        setIsFocused(false);
        setTouched(true);
        setError(validateValue(currentValue));
        if (onBlur) onBlur(e);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && type !== "textarea") {
            if (onEnter) onEnter(currentValue);
        }
    };
    
    const handleClear = () => {
        updateValue("");
        if (onClear) onClear();
        inputRef.current?.focus();
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // VARIANT STYLES
    // ─────────────────────────────────────────────────────────────────────────
    const getVariantStyles = () => {
        const hasError = touched && error;
        const isImageBg = inputBg.startsWith("url(") || inputBg.includes("gradient(");

        switch (variant) {
            case "filled":
                return {
                    backgroundImage: surfaceColor.startsWith("url(") || surfaceColor.includes("gradient(") ? surfaceColor : "none",
                    backgroundColor: surfaceColor.startsWith("url(") || surfaceColor.includes("gradient(") ? "transparent" : surfaceColor,
                    backgroundSize: currentBgSize,
                    backgroundRepeat: currentBgRepeat,
                    backgroundPosition: currentBgPosition,
                    border: hasError ? `1px solid ${errorColor}` : (isFocused ? inputBorderFocus : "1px solid transparent"),
                };
            case "ghost":
                return {
                    backgroundImage: "none",
                    backgroundColor: "transparent",
                    backgroundSize: currentBgSize,
                    backgroundRepeat: currentBgRepeat,
                    backgroundPosition: currentBgPosition,
                    border: hasError ? `1px solid ${errorColor}` : (isFocused ? inputBorderFocus : "1px solid transparent"),
                };
            default:
                return {
                    backgroundImage: isImageBg ? inputBg : "none",
                    backgroundColor: isImageBg ? "transparent" : inputBg,
                    backgroundSize: currentBgSize,
                    backgroundRepeat: currentBgRepeat,
                    backgroundPosition: currentBgPosition,
                    border: hasError ? `1px solid ${errorColor}` : (isFocused ? inputBorderFocus : inputBorder),
                };
        }
    };

    const variantStyles = getVariantStyles();
    const hasError = touched && error;
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER INPUT ELEMENT
    // ─────────────────────────────────────────────────────────────────────────
    const inputProps = {
        ref: inputRef,
        type: type === "textarea" ? undefined : type,
        value: currentValue,
        placeholder,
        disabled,
        readOnly,
        maxLength,
        min,
        max,
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        style: {
            flex: 1,
            width: "100%",
            padding: sizing.padding,
            paddingLeft: iconLeft ? "36px" : sizing.padding.split(" ")[1],
            paddingRight: (iconRight || clearable) ? "36px" : sizing.padding.split(" ")[1],
            fontSize: sizing.fontSize,
            color: textColor,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
            resize: type === "textarea" ? (autoResize ? "none" : "vertical") : undefined,
            ...inputStyle,
        },
    };
    
    const InputElement = type === "textarea" ? "textarea" : "input";
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            className={`dc-glo-input ${className}`.trim()}
            style={{
                width,
                ...style,
            }}
        >
            {/* Label */}
            {label && (
                <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: sizing.labelSize,
                    fontWeight: "bold",
                    color: textColor,
                }}>
                    {label}
                    {required && <span style={{ color: errorColor, marginLeft: "4px" }}>*</span>}
                </label>
            )}
            
            {/* Input Container */}
            <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                minHeight: type === "textarea" ? "auto" : sizing.height,
                borderRadius: inputRadius,
                transition: "all 0.2s ease, background-position 0.3s ease-out",
                ...variantStyles,
                boxShadow: effectsEnabled && glow && isFocused
                    ? `0 0 15px ${hasError ? errorGlowColor : glowColor}`
                    : "none",
                touchAction: "manipulation", // Prevent double-tap zoom
            }}>
                {/* Left Icon */}
                {iconLeft && (
                    <span style={{
                        position: "absolute",
                        left: "12px",
                        top: type === "textarea" ? "12px" : "50%",
                        transform: type === "textarea" ? "none" : "translateY(-50%)",
                        color: mutedColor,
                        fontSize: sizing.fontSize,
                        pointerEvents: "none",
                    }}>
                        {iconLeft}
                    </span>
                )}
                
                {/* Input */}
                <InputElement 
                    {...inputProps}
                    rows={type === "textarea" ? rows : undefined}
                />
                
                {/* Right Icon or Clear Button */}
                {(iconRight || (clearable && currentValue)) && (
                    <span 
                        style={{
                            position: "absolute",
                            right: "4px",
                            top: type === "textarea" ? "4px" : "50%",
                            transform: type === "textarea" ? "none" : "translateY(-50%)",
                            color: mutedColor,
                            fontSize: sizing.fontSize,
                            cursor: clearable && currentValue ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            // Minimum 44x44px touch target for clear button
                            minWidth: clearable && currentValue ? "44px" : "auto",
                            minHeight: clearable && currentValue ? "44px" : "auto",
                            touchAction: "manipulation",
                        }}
                        onClick={clearable && currentValue ? handleClear : undefined}
                    >
                        {clearable && currentValue ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : iconRight}
                    </span>
                )}
            </div>
            
            {/* Helper Text / Error */}
            {(helperText || (showError && hasError)) && (
                <div style={{
                    marginTop: "4px",
                    fontSize: "11px",
                    color: hasError ? errorColor : mutedColor,
                }}>
                    {hasError ? error : helperText}
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
        gap: "1.5rem",
        padding: "1rem",
        maxWidth: "350px",
    }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "0.5rem" }}>
            dc-gloInput Component Demo
        </div>
        
        {/* Basic input */}
        <GloInput 
            label="Name"
            placeholder="Enter your name..."
            helperText="Your display name"
        />
        
        {/* With icons */}
        <GloInput 
            label="Search"
            placeholder="Search notes..."
            iconLeft="🔍"
            clearable={true}
        />
        
        {/* Required with validation */}
        <GloInput 
            label="Email"
            type="email"
            placeholder="you@example.com"
            required={true}
            iconLeft="✉️"
        />
        
        {/* Number input */}
        <GloInput 
            label="Quantity"
            type="number"
            placeholder="0"
            min={0}
            max={100}
            iconRight="📊"
        />
        
        {/* Textarea */}
        <GloInput 
            label="Notes"
            type="textarea"
            placeholder="Write your notes here..."
            rows={4}
        />
        
        {/* Sizes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <GloInput size="small" placeholder="Small input" />
            <GloInput size="medium" placeholder="Medium input" />
            <GloInput size="large" placeholder="Large input" />
        </div>
        
        {/* Variants */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <GloInput variant="default" placeholder="Default variant" />
            <GloInput variant="filled" placeholder="Filled variant" />
            <GloInput variant="ghost" placeholder="Ghost variant" />
        </div>
    </div>
);

return { 
    renderedView, 
    GloInput,
};
