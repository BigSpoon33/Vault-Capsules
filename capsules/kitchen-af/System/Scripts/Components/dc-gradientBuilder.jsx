// ═══════════════════════════════════════════════════════════════════════════════
// DC-GRADIENT-BUILDER - Visual Gradient Editor Component
// Build linear, radial, and conic gradients with a visual interface
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);
const { ColorPicker, normalizeHex } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-colorPicker.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

const GRADIENT_PRESETS = [
    { name: "Nyan Rainbow", value: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0099ff, #6633ff)" },
    { name: "Sunset", value: "linear-gradient(90deg, #ff512f, #f09819)" },
    { name: "Ocean", value: "linear-gradient(90deg, #2193b0, #6dd5ed)" },
    { name: "Purple Dream", value: "linear-gradient(90deg, #7c3aed, #a78bfa)" },
    { name: "Pink Glow", value: "linear-gradient(90deg, #ff69b4, #ff1493)" },
    { name: "Cyberpunk", value: "linear-gradient(90deg, #00ffff, #ff00ff)" },
    { name: "Fire", value: "linear-gradient(90deg, #f12711, #f5af19)" },
    { name: "Forest", value: "linear-gradient(90deg, #134e5e, #71b280)" },
    { name: "Gold", value: "linear-gradient(90deg, #f7971e, #ffd200)" },
    { name: "Midnight", value: "linear-gradient(90deg, #232526, #414345)" },
];

const DIRECTIONS = [
    { label: "→", value: "90deg", title: "Left to Right" },
    { label: "←", value: "270deg", title: "Right to Left" },
    { label: "↓", value: "180deg", title: "Top to Bottom" },
    { label: "↑", value: "0deg", title: "Bottom to Top" },
    { label: "↘", value: "135deg", title: "Diagonal Down" },
    { label: "↗", value: "45deg", title: "Diagonal Up" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Parse gradient string to components
// ═══════════════════════════════════════════════════════════════════════════════

function parseGradient(gradientStr) {
    if (!gradientStr || typeof gradientStr !== "string") {
        return {
            type: "linear",
            direction: "90deg",
            colors: [{ color: "#7c3aed", stop: 0 }, { color: "#a78bfa", stop: 100 }]
        };
    }
    
    // Detect gradient type
    let type = "linear";
    if (gradientStr.startsWith("radial-gradient")) type = "radial";
    else if (gradientStr.startsWith("conic-gradient")) type = "conic";
    
    // Extract content inside parentheses
    const match = gradientStr.match(/\(([^)]+)\)/);
    if (!match) {
        return {
            type,
            direction: "90deg",
            colors: [{ color: "#7c3aed", stop: 0 }, { color: "#a78bfa", stop: 100 }]
        };
    }
    
    const content = match[1];
    const parts = content.split(/,(?![^(]*\))/); // Split by comma not inside parentheses
    
    // First part might be direction/position
    let direction = "90deg";
    let colorStartIndex = 0;
    
    if (parts[0] && (parts[0].includes("deg") || parts[0].includes("to ") || parts[0].includes("circle") || parts[0].includes("ellipse"))) {
        direction = parts[0].trim();
        colorStartIndex = 1;
    }
    
    // Parse color stops
    const colors = [];
    for (let i = colorStartIndex; i < parts.length; i++) {
        const part = parts[i].trim();
        // Match color and optional percentage
        const colorMatch = part.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-z]+)\s*(\d+%)?/i);
        if (colorMatch) {
            const color = colorMatch[1];
            const stop = colorMatch[2] ? parseInt(colorMatch[2]) : Math.round((i - colorStartIndex) / (parts.length - colorStartIndex - 1) * 100);
            colors.push({ color: normalizeHex(color) || color, stop });
        }
    }
    
    // Ensure at least 2 colors
    if (colors.length < 2) {
        colors.push({ color: "#7c3aed", stop: 0 });
        colors.push({ color: "#a78bfa", stop: 100 });
    }
    
    return { type, direction, colors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Build gradient string from components
// ═══════════════════════════════════════════════════════════════════════════════

function buildGradient(type, direction, colors) {
    const colorStops = colors
        .sort((a, b) => a.stop - b.stop)
        .map(c => `${c.color} ${c.stop}%`)
        .join(", ");
    
    switch (type) {
        case "radial":
            return `radial-gradient(${direction}, ${colorStops})`;
        case "conic":
            return `conic-gradient(from ${direction}, ${colorStops})`;
        default:
            return `linear-gradient(${direction}, ${colorStops})`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GradientBuilder
// ═══════════════════════════════════════════════════════════════════════════════

function GradientBuilder({
    // Value
    value = "linear-gradient(90deg, #7c3aed, #a78bfa)",
    onChange = null,
    
    // Display
    label = null,
    showPresets = true,
    showTypeSelector = true,
    
    // Size
    previewHeight = 60,
    
    // Overrides
    style = {},
    className = "",
}) {
    const { theme, isLoading } = useTheme();
    
    // Parse initial gradient
    const parsed = parseGradient(value);
    
    // State
    const [gradientType, setGradientType] = dc.useState(parsed.type);
    const [direction, setDirection] = dc.useState(parsed.direction);
    const [colorStops, setColorStops] = dc.useState(parsed.colors);
    const [selectedStop, setSelectedStop] = dc.useState(0);
    const [isExpanded, setIsExpanded] = dc.useState(false);
    
    // Load CSS
    useComponentCSS();
    
    // Theme colors
    const primaryColor = theme["color-primary"] || "#7c3aed";
    const surfaceColor = theme["color-surface"] || "#2a2a3e";
    const textColor = theme["color-text"] || "#ffffff";
    const textMuted = theme["color-text-muted"] || "#888";
    
    // Build current gradient
    const currentGradient = buildGradient(gradientType, direction, colorStops);
    
    // Emit change
    const emitChange = (type, dir, colors) => {
        const gradient = buildGradient(type, dir, colors);
        onChange?.(gradient);
    };
    
    // Handle type change
    const handleTypeChange = (newType) => {
        setGradientType(newType);
        // Adjust direction for radial
        let newDirection = direction;
        if (newType === "radial" && direction.includes("deg")) {
            newDirection = "circle";
        } else if (newType === "linear" && !direction.includes("deg")) {
            newDirection = "90deg";
        }
        setDirection(newDirection);
        emitChange(newType, newDirection, colorStops);
    };
    
    // Handle direction change
    const handleDirectionChange = (newDir) => {
        setDirection(newDir);
        emitChange(gradientType, newDir, colorStops);
    };
    
    // Handle color stop color change
    const handleColorChange = (index, newColor) => {
        const newStops = [...colorStops];
        newStops[index] = { ...newStops[index], color: newColor };
        setColorStops(newStops);
        emitChange(gradientType, direction, newStops);
    };
    
    // Handle color stop position change
    const handleStopChange = (index, newStop) => {
        const newStops = [...colorStops];
        newStops[index] = { ...newStops[index], stop: Math.max(0, Math.min(100, newStop)) };
        setColorStops(newStops);
        emitChange(gradientType, direction, newStops);
    };
    
    // Add color stop
    const addColorStop = () => {
        const newStop = {
            color: "#ffffff",
            stop: 50
        };
        const newStops = [...colorStops, newStop].sort((a, b) => a.stop - b.stop);
        setColorStops(newStops);
        setSelectedStop(newStops.findIndex(s => s === newStop));
        emitChange(gradientType, direction, newStops);
    };
    
    // Remove color stop
    const removeColorStop = (index) => {
        if (colorStops.length <= 2) return; // Need at least 2 stops
        const newStops = colorStops.filter((_, i) => i !== index);
        setColorStops(newStops);
        setSelectedStop(Math.min(selectedStop, newStops.length - 1));
        emitChange(gradientType, direction, newStops);
    };
    
    // Apply preset
    const applyPreset = (presetValue) => {
        const parsed = parseGradient(presetValue);
        setGradientType(parsed.type);
        setDirection(parsed.direction);
        setColorStops(parsed.colors);
        setSelectedStop(0);
        onChange?.(presetValue);
    };
    
    if (isLoading) {
        return <div style={{ height: previewHeight, background: "#333", borderRadius: 8 }} />;
    }
    
    return (
        <div style={{ ...style }} className={className}>
            {/* Label */}
            {label && (
                <label style={{ 
                    display: "block",
                    fontSize: 12, 
                    color: textMuted,
                    fontWeight: 500,
                    marginBottom: 6,
                }}>
                    {label}
                </label>
            )}
            
            {/* Preview Bar (clickable to expand) */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    height: previewHeight,
                    borderRadius: 8,
                    background: currentGradient,
                    cursor: "pointer",
                    border: `2px solid ${isExpanded ? primaryColor : "rgba(255,255,255,0.1)"}`,
                    transition: "all 0.2s ease",
                    position: "relative",
                }}
            >
                {/* Expand indicator */}
                <div style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(0,0,0,0.5)",
                    padding: "2px 6px",
                    borderRadius: 4,
                }}>
                    {isExpanded ? "Click to collapse" : "Click to edit"}
                </div>
            </div>
            
            {/* Expanded Editor */}
            {isExpanded && (
                <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: surfaceColor,
                    borderRadius: 10,
                    border: `1px solid ${primaryColor}33`,
                }}>
                    {/* Type Selector */}
                    {showTypeSelector && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                                Type
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {["linear", "radial", "conic"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeChange(type)}
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: 11,
                                            background: gradientType === type ? primaryColor : "rgba(255,255,255,0.1)",
                                            border: "none",
                                            borderRadius: 6,
                                            color: textColor,
                                            cursor: "pointer",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Direction Selector (for linear) */}
                    {gradientType === "linear" && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                                Direction
                            </div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {DIRECTIONS.map(dir => (
                                    <button
                                        key={dir.value}
                                        onClick={() => handleDirectionChange(dir.value)}
                                        title={dir.title}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            fontSize: 16,
                                            background: direction === dir.value ? primaryColor : "rgba(255,255,255,0.1)",
                                            border: "none",
                                            borderRadius: 6,
                                            color: textColor,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {dir.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Color Stops */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            marginBottom: 8 
                        }}>
                            <span style={{ fontSize: 10, color: textMuted, textTransform: "uppercase" }}>
                                Color Stops ({colorStops.length})
                            </span>
                            <button
                                onClick={addColorStop}
                                style={{
                                    padding: "4px 8px",
                                    fontSize: 10,
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    borderRadius: 4,
                                    color: textColor,
                                    cursor: "pointer",
                                }}
                            >
                                + Add
                            </button>
                        </div>
                        
                        {/* Stop List */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {colorStops.map((stop, index) => (
                                <div 
                                    key={index}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: 8,
                                        background: selectedStop === index ? "rgba(255,255,255,0.05)" : "transparent",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setSelectedStop(index)}
                                >
                                    {/* Color Picker */}
                                    <ColorPicker
                                        value={stop.color}
                                        onChange={(color) => handleColorChange(index, color)}
                                        showInput={false}
                                        showPresets={false}
                                        size="small"
                                    />
                                    
                                    {/* Position Slider */}
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={stop.stop}
                                        onChange={(e) => handleStopChange(index, parseInt(e.target.value))}
                                        style={{ flex: 1, cursor: "pointer" }}
                                    />
                                    
                                    {/* Position Value */}
                                    <span style={{ 
                                        fontSize: 11, 
                                        color: textMuted,
                                        width: 35,
                                        textAlign: "right",
                                    }}>
                                        {stop.stop}%
                                    </span>
                                    
                                    {/* Remove Button */}
                                    {colorStops.length > 2 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeColorStop(index);
                                            }}
                                            style={{
                                                width: 20,
                                                height: 20,
                                                fontSize: 12,
                                                background: "rgba(255,0,0,0.2)",
                                                border: "none",
                                                borderRadius: 4,
                                                color: "#ff6666",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Presets */}
                    {showPresets && (
                        <div>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                                Presets
                            </div>
                            <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(5, 1fr)", 
                                gap: 6 
                            }}>
                                {GRADIENT_PRESETS.map((preset, i) => (
                                    <div
                                        key={i}
                                        onClick={() => applyPreset(preset.value)}
                                        title={preset.name}
                                        style={{
                                            height: 24,
                                            borderRadius: 4,
                                            background: preset.value,
                                            cursor: "pointer",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            transition: "transform 0.1s ease",
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* CSS Output */}
                    <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 4, textTransform: "uppercase" }}>
                            CSS Value
                        </div>
                        <div style={{
                            padding: 8,
                            background: "rgba(0,0,0,0.3)",
                            borderRadius: 6,
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: textMuted,
                            wordBreak: "break-all",
                        }}>
                            {currentGradient}
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

return { GradientBuilder, GRADIENT_PRESETS, parseGradient, buildGradient };
