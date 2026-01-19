// ═══════════════════════════════════════════════════════════════════════════════
// DC-BACKGROUND-PICKER - Universal Background Picker Component
// Supports solid color, gradient, or image (base64/URL) for any background property
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);
const { ColorPicker } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-colorPicker.jsx")
);
const { GradientBuilder } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gradientBuilder.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Detect background type from value
// ═══════════════════════════════════════════════════════════════════════════════

function detectBackgroundType(value) {
    if (!value || value === "") return "color";
    
    // Check for image (base64 or URL)
    if (value.startsWith("data:image") || 
        value.startsWith("url(") ||
        /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(value)) {
        return "image";
    }
    
    // Check for gradient
    if (value.includes("gradient(")) {
        return "gradient";
    }
    
    // Check for rgba/rgb
    if (value.startsWith("rgba(") || value.startsWith("rgb(")) {
        return "color";
    }
    
    // Check for hex color
    if (value.startsWith("#")) {
        return "color";
    }
    
    // Default to color for named colors or unknown
    return "color";
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Extract color from value if it's a simple color
// ═══════════════════════════════════════════════════════════════════════════════

function extractColor(value) {
    if (!value) return "#7c3aed";
    if (value.startsWith("#")) return value;
    if (value.startsWith("rgb")) {
        // Try to convert rgba to hex (approximate)
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`.toUpperCase();
        }
    }
    return "#7c3aed";
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: BackgroundPicker
// ═══════════════════════════════════════════════════════════════════════════════

function BackgroundPicker({
    // Value
    value = "",
    onChange = null,
    
    // Display
    label = null,
    previewHeight = 50,
    
    // Options
    allowColor = true,
    allowGradient = true,
    allowImage = true,
    
    // Overrides
    style = {},
    className = "",
}) {
    const { theme, isLoading } = useTheme();
    
    // Detect initial type
    const initialType = detectBackgroundType(value);
    
    // State
    const [bgType, setBgType] = dc.useState(initialType);
    const [colorValue, setColorValue] = dc.useState(
        initialType === "color" ? extractColor(value) : "#7c3aed"
    );
    const [gradientValue, setGradientValue] = dc.useState(
        initialType === "gradient" ? value : "linear-gradient(90deg, #7c3aed, #a78bfa)"
    );
    const [imageValue, setImageValue] = dc.useState(
        initialType === "image" ? value : ""
    );
    const [isExpanded, setIsExpanded] = dc.useState(false);
    
    // Load CSS
    useComponentCSS();
    
    // Theme colors
    const primaryColor = theme["color-primary"] || "#7c3aed";
    const surfaceColor = theme["color-surface"] || "#2a2a3e";
    const textColor = theme["color-text"] || "#ffffff";
    const textMuted = theme["color-text-muted"] || "#888";
    
    // Track if user is manually changing type (to prevent auto-detection override)
    const userChangedTypeRef = dc.useRef(false);
    
    // Sync state when value prop changes (but not if user just changed type)
    dc.useEffect(() => {
        // Skip if user just manually changed the type
        if (userChangedTypeRef.current) {
            userChangedTypeRef.current = false;
            return;
        }
        
        const type = detectBackgroundType(value);
        setBgType(type);
        
        if (type === "color") {
            setColorValue(extractColor(value));
        } else if (type === "gradient") {
            setGradientValue(value);
        } else if (type === "image") {
            setImageValue(value);
        }
    }, [value]);
    
    // Get current display value based on type
    const getDisplayValue = () => {
        switch (bgType) {
            case "color": return colorValue;
            case "gradient": return gradientValue;
            case "image": 
                if (!imageValue) return "";
                if (imageValue.startsWith("data:image")) {
                    return `url("${imageValue}")`;
                }
                return imageValue.startsWith("url(") ? imageValue : (imageValue ? `url("${imageValue}")` : "");
            default: return colorValue;
        }
    };
    
    // Handle type change
    const handleTypeChange = (newType) => {
        // Mark that user is manually changing type
        userChangedTypeRef.current = true;
        setBgType(newType);
        
        // Only emit onChange if the value for that type is non-empty
        // This prevents empty values from triggering type re-detection
        switch (newType) {
            case "color":
                if (colorValue) onChange?.(colorValue);
                break;
            case "gradient":
                if (gradientValue) onChange?.(gradientValue);
                break;
            case "image":
                // Don't emit empty image value - let user upload/paste first
                if (imageValue) onChange?.(imageValue);
                break;
        }
    };
    
    // Handle color change
    const handleColorChange = (newColor) => {
        setColorValue(newColor);
        if (bgType === "color") {
            onChange?.(newColor);
        }
    };
    
    // Handle gradient change
    const handleGradientChange = (newGradient) => {
        setGradientValue(newGradient);
        if (bgType === "gradient") {
            onChange?.(newGradient);
        }
    };
    
    // Handle image upload
    const handleImageUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setImageValue(base64);
                if (bgType === "image") {
                    onChange?.(base64);
                }
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    };
    
    // Handle image URL input
    const handleImageUrlChange = (url) => {
        setImageValue(url);
        if (bgType === "image") {
            onChange?.(url);
        }
    };
    
    // Handle clear image
    const handleClearImage = () => {
        setImageValue("");
        if (bgType === "image") {
            onChange?.("");
        }
    };
    
    // Build available types
    const availableTypes = [];
    if (allowColor) availableTypes.push({ id: "color", label: "Color", icon: "🎨" });
    if (allowGradient) availableTypes.push({ id: "gradient", label: "Gradient", icon: "🌈" });
    if (allowImage) availableTypes.push({ id: "image", label: "Image", icon: "🖼️" });
    
    if (isLoading) {
        return <div style={{ height: previewHeight, background: "#333", borderRadius: 8 }} />;
    }
    
    // Get background for preview
    const previewBg = getDisplayValue();
    const isValidPreview = previewBg && previewBg !== "";
    
    return (
        <div style={{ ...style }} className={className}>
            {/* Label */}
            {label && (
                <label style={{ 
                    display: "block",
                    fontSize: 11, 
                    color: textMuted,
                    fontWeight: 500,
                    marginBottom: 6,
                }}>
                    {label}
                </label>
            )}
            
            {/* Preview Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    height: previewHeight,
                    borderRadius: 8,
                    background: isValidPreview ? previewBg : "repeating-linear-gradient(45deg, #333, #333 10px, #444 10px, #444 20px)",
                    backgroundSize: bgType === "image" ? "contain" : undefined,
                    backgroundRepeat: bgType === "image" ? "repeat" : undefined,
                    backgroundPosition: bgType === "image" ? "center" : undefined,
                    cursor: "pointer",
                    border: `2px solid ${isExpanded ? primaryColor : "rgba(255,255,255,0.1)"}`,
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Type Badge */}
                <div style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    fontSize: 9,
                    padding: "2px 6px",
                    background: "rgba(0,0,0,0.6)",
                    borderRadius: 4,
                    color: "rgba(255,255,255,0.8)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                }}>
                    {bgType}
                </div>
                
                {/* Expand Hint */}
                <div style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    fontSize: 9,
                    color: "rgba(255,255,255,0.6)",
                    background: "rgba(0,0,0,0.5)",
                    padding: "2px 6px",
                    borderRadius: 4,
                }}>
                    {isExpanded ? "Collapse" : "Edit"}
                </div>
            </div>
            
            {/* Expanded Editor */}
            {isExpanded && (
                <div style={{
                    marginTop: 10,
                    padding: 12,
                    background: surfaceColor,
                    borderRadius: 10,
                    border: `1px solid ${primaryColor}33`,
                }}>
                    {/* Type Selector */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                            Background Type
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            {availableTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id)}
                                    style={{
                                        padding: "8px 14px",
                                        fontSize: 11,
                                        background: bgType === type.id ? primaryColor : "rgba(255,255,255,0.1)",
                                        border: "none",
                                        borderRadius: 6,
                                        color: textColor,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <span>{type.icon}</span>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Color Editor */}
                    {bgType === "color" && (
                        <div>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                                Select Color
                            </div>
                            <ColorPicker
                                value={colorValue}
                                onChange={handleColorChange}
                                size="medium"
                                presetPalette="primary"
                            />
                        </div>
                    )}
                    
                    {/* Gradient Editor */}
                    {bgType === "gradient" && (
                        <div>
                            <GradientBuilder
                                value={gradientValue}
                                onChange={handleGradientChange}
                                previewHeight={50}
                                showPresets={true}
                            />
                        </div>
                    )}
                    
                    {/* Image Editor */}
                    {bgType === "image" && (
                        <div>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 8, textTransform: "uppercase" }}>
                                Image Source
                            </div>
                            
                            {/* Current Image Preview */}
                            {imageValue && (
                                <div style={{
                                    width: "100%",
                                    height: 80,
                                    borderRadius: 8,
                                    background: `url("${imageValue}") center/contain no-repeat`,
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    marginBottom: 10,
                                }} />
                            )}
                            
                            {/* Upload Button */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <button
                                    onClick={handleImageUpload}
                                    style={{
                                        padding: "8px 14px",
                                        fontSize: 11,
                                        background: "rgba(255,255,255,0.1)",
                                        border: "none",
                                        borderRadius: 6,
                                        color: textColor,
                                        cursor: "pointer",
                                        flex: 1,
                                    }}
                                >
                                    📁 Upload Image
                                </button>
                                {imageValue && (
                                    <button
                                        onClick={handleClearImage}
                                        style={{
                                            padding: "8px 14px",
                                            fontSize: 11,
                                            background: "rgba(255,0,0,0.15)",
                                            border: "none",
                                            borderRadius: 6,
                                            color: "#ff6666",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            
                            {/* URL Input */}
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 4 }}>
                                Or paste URL / Base64:
                            </div>
                            <input
                                type="text"
                                value={imageValue}
                                onChange={(e) => handleImageUrlChange(e.target.value)}
                                placeholder="https://... or data:image/..."
                                style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    fontSize: 11,
                                    fontFamily: "monospace",
                                    background: "rgba(0,0,0,0.2)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 6,
                                    color: textColor,
                                }}
                            />
                        </div>
                    )}
                    
                    {/* CSS Output */}
                    <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 4, textTransform: "uppercase" }}>
                            Value
                        </div>
                        <div style={{
                            padding: 8,
                            background: "rgba(0,0,0,0.3)",
                            borderRadius: 6,
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: textMuted,
                            wordBreak: "break-all",
                            maxHeight: 60,
                            overflow: "auto",
                        }}>
                            {getDisplayValue() || "(empty)"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

return { BackgroundPicker, detectBackgroundType, extractColor };
