// ═══════════════════════════════════════════════════════════════════════════════
// DC-COLOR-PICKER - Theme-aware Color Picker Component
// A compact color picker with swatch, hex input, and popup picker
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { useComponentCSS, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET COLOR PALETTES
// ═══════════════════════════════════════════════════════════════════════════════

const COLOR_PRESETS = {
    primary: [
        "#ff69b4", "#ff1493", "#ff69b4", "#da70d6", "#ba55d3",
        "#9370db", "#8a2be2", "#7c3aed", "#6d28d9", "#5b21b6",
    ],
    rainbow: [
        "#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#00ffff",
        "#0000ff", "#8b00ff", "#ff00ff", "#ff1493", "#ffffff",
    ],
    neon: [
        "#ff00ff", "#00ffff", "#ff69b4", "#39ff14", "#ff6600",
        "#ffff00", "#ff0099", "#00ff99", "#9d00ff", "#ff3131",
    ],
    pastel: [
        "#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff",
        "#e0b0ff", "#ffc0cb", "#dda0dd", "#f0e68c", "#e6e6fa",
    ],
    dark: [
        "#1a1a2e", "#16213e", "#0f3460", "#1e1e2e", "#2d2d44",
        "#1a1a1a", "#2b2b2b", "#3d3d3d", "#0d1117", "#161b22",
    ],
    grayscale: [
        "#ffffff", "#e0e0e0", "#c0c0c0", "#a0a0a0", "#808080",
        "#606060", "#404040", "#303030", "#202020", "#000000",
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Validate hex color
// ═══════════════════════════════════════════════════════════════════════════════

function isValidHex(hex) {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
}

function normalizeHex(hex) {
    if (!hex) return "#000000";
    let h = hex.startsWith("#") ? hex : `#${hex}`;
    // Expand 3-char hex to 6-char
    if (h.length === 4) {
        h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    }
    return h.toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: HSV to RGB conversion for color picker
// ═══════════════════════════════════════════════════════════════════════════════

function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

function hexToHsv(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, v: 0 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h, s, v };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: ColorPicker
// ═══════════════════════════════════════════════════════════════════════════════

function ColorPicker({
    // Value
    value = "#7c3aed",            // Current color (hex)
    onChange = null,              // Called with new hex color
    
    // Display
    label = null,                 // Optional label
    showInput = true,             // Show hex input field
    showPresets = true,           // Show preset colors
    presetPalette = "primary",    // Which preset palette to show
    
    // Size
    size = "medium",              // "small" | "medium" | "large"
    swatchSize = null,            // Override swatch size
    
    // Behavior
    disabled = false,             // Disable picker
    
    // Overrides
    style = {},                   // Additional styles
    className = "",               // Additional classes
}) {
    const { theme, isLoading } = useTheme();
    const [isOpen, setIsOpen] = dc.useState(false);
    const [inputValue, setInputValue] = dc.useState(value);
    const [hue, setHue] = dc.useState(0);
    const [saturation, setSaturation] = dc.useState(1);
    const [brightness, setBrightness] = dc.useState(1);
    
    const containerRef = dc.useRef(null);
    const satBrightRef = dc.useRef(null);
    
    // Load CSS
    useComponentCSS();
    
    // Sync input value with prop
    dc.useEffect(() => {
        setInputValue(value);
        const hsv = hexToHsv(value);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setBrightness(hsv.v);
    }, [value]);
    
    // Close on outside click
    dc.useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);
    
    // Theme colors
    const primaryColor = theme["color-primary"] || "#7c3aed";
    const surfaceColor = theme["color-surface"] || "#2a2a3e";
    const textColor = theme["color-text"] || "#ffffff";
    const textMuted = theme["color-text-muted"] || "#888";
    
    // Sizing
    const sizeConfig = {
        small: { swatch: 24, font: 11, padding: 4 },
        medium: { swatch: 32, font: 13, padding: 6 },
        large: { swatch: 40, font: 14, padding: 8 },
    };
    const sizing = sizeConfig[size] || sizeConfig.medium;
    const actualSwatchSize = swatchSize || sizing.swatch;
    
    // Handle hex input change
    const handleInputChange = (e) => {
        let val = e.target.value;
        setInputValue(val);
        
        // Auto-add # if missing
        if (val && !val.startsWith("#")) {
            val = "#" + val;
        }
        
        if (isValidHex(val)) {
            const normalized = normalizeHex(val);
            const hsv = hexToHsv(normalized);
            setHue(hsv.h);
            setSaturation(hsv.s);
            setBrightness(hsv.v);
            onChange?.(normalized);
        }
    };
    
    // Handle preset click
    const handlePresetClick = (color) => {
        const normalized = normalizeHex(color);
        setInputValue(normalized);
        const hsv = hexToHsv(normalized);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setBrightness(hsv.v);
        onChange?.(normalized);
    };
    
    // Handle hue slider change
    const handleHueChange = (e) => {
        const newHue = parseFloat(e.target.value);
        setHue(newHue);
        const rgb = hsvToRgb(newHue, saturation, brightness);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setInputValue(hex);
        onChange?.(hex);
    };
    
    // Handle saturation/brightness picker
    const handleSatBrightChange = (e) => {
        if (!satBrightRef.current) return;
        
        const rect = satBrightRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        const newSat = x;
        const newBright = 1 - y;
        
        setSaturation(newSat);
        setBrightness(newBright);
        
        const rgb = hsvToRgb(hue, newSat, newBright);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setInputValue(hex);
        onChange?.(hex);
    };
    
    // Mouse drag for sat/bright picker
    const handleSatBrightMouseDown = (e) => {
        handleSatBrightChange(e);
        
        const handleMouseMove = (e) => handleSatBrightChange(e);
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };
    
    // Get current color for display
    const displayColor = isValidHex(inputValue) ? normalizeHex(inputValue) : value;
    const hueColor = rgbToHex(...Object.values(hsvToRgb(hue, 1, 1)));
    
    // Get presets
    const presets = COLOR_PRESETS[presetPalette] || COLOR_PRESETS.primary;
    
    if (isLoading) {
        return <div style={{ width: actualSwatchSize, height: actualSwatchSize, background: "#333", borderRadius: 4 }} />;
    }
    
    return (
        <div 
            ref={containerRef}
            style={{ 
                display: "inline-flex", 
                flexDirection: "column",
                gap: 4,
                position: "relative",
                ...style 
            }}
            className={className}
        >
            {/* Label */}
            {label && (
                <label style={{ 
                    fontSize: sizing.font - 1, 
                    color: textMuted,
                    fontWeight: 500,
                }}>
                    {label}
                </label>
            )}
            
            {/* Swatch + Input Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Color Swatch (clickable) */}
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    style={{
                        width: actualSwatchSize,
                        height: actualSwatchSize,
                        borderRadius: 6,
                        background: displayColor,
                        border: "2px solid rgba(255,255,255,0.2)",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1,
                        transition: "all 0.2s ease",
                        boxShadow: isOpen ? `0 0 0 2px ${primaryColor}` : "none",
                    }}
                    title={displayColor}
                />
                
                {/* Hex Input */}
                {showInput && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={disabled}
                        placeholder="#000000"
                        style={{
                            width: 80,
                            padding: `${sizing.padding}px 8px`,
                            fontSize: sizing.font,
                            fontFamily: "monospace",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 4,
                            color: textColor,
                            outline: "none",
                        }}
                    />
                )}
            </div>
            
            {/* Popup Picker */}
            {isOpen && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 8,
                    padding: 12,
                    background: surfaceColor,
                    border: `1px solid ${primaryColor}44`,
                    borderRadius: 10,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    zIndex: 1000,
                    minWidth: 220,
                }}>
                    {/* Saturation/Brightness Picker */}
                    <div
                        ref={satBrightRef}
                        onMouseDown={handleSatBrightMouseDown}
                        style={{
                            width: "100%",
                            height: 150,
                            borderRadius: 6,
                            background: `linear-gradient(to bottom, transparent, black), 
                                         linear-gradient(to right, white, ${hueColor})`,
                            position: "relative",
                            cursor: "crosshair",
                            marginBottom: 10,
                        }}
                    >
                        {/* Picker cursor */}
                        <div style={{
                            position: "absolute",
                            left: `${saturation * 100}%`,
                            top: `${(1 - brightness) * 100}%`,
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            border: "2px solid white",
                            boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                        }} />
                    </div>
                    
                    {/* Hue Slider */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={hue}
                        onChange={handleHueChange}
                        style={{
                            width: "100%",
                            height: 14,
                            borderRadius: 7,
                            appearance: "none",
                            background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                            cursor: "pointer",
                            marginBottom: 10,
                        }}
                    />
                    
                    {/* Presets */}
                    {showPresets && (
                        <div>
                            <div style={{ 
                                fontSize: 10, 
                                color: textMuted, 
                                marginBottom: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}>
                                Presets
                            </div>
                            <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(5, 1fr)", 
                                gap: 4 
                            }}>
                                {presets.map((color, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handlePresetClick(color)}
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1",
                                            borderRadius: 4,
                                            background: color,
                                            cursor: "pointer",
                                            border: displayColor.toUpperCase() === color.toUpperCase() 
                                                ? "2px solid white" 
                                                : "1px solid rgba(255,255,255,0.1)",
                                            transition: "transform 0.1s ease",
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Current Color Display */}
                    <div style={{
                        marginTop: 10,
                        padding: 8,
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}>
                        <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            background: displayColor,
                            border: "1px solid rgba(255,255,255,0.2)",
                        }} />
                        <span style={{ 
                            fontFamily: "monospace", 
                            fontSize: 12,
                            color: textColor,
                        }}>
                            {displayColor}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

return { ColorPicker, COLOR_PRESETS, isValidHex, normalizeHex, hexToHsv, hsvToRgb, rgbToHex };
