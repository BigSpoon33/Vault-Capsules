// ═══════════════════════════════════════════════════════════════════════════════
// DC-GRADIENT-UTILS - Gradient Creation Helpers
// Utilities for creating CSS gradients with easy-to-use functions
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT PRESETS
// Pre-defined gradients ready to use
// ═══════════════════════════════════════════════════════════════════════════════

const GRADIENT_PRESETS = {
    // ─────────────────────────────────────────────────────────────────────────
    // RAINBOW GRADIENTS
    // ─────────────────────────────────────────────────────────────────────────
    rainbow: "linear-gradient(to right, #ff0000, #ff9900, #ffff00, #33ff00, #0099ff, #6633ff, #ff0000)",
    rainbowVertical: "linear-gradient(to bottom, #ff0000, #ff9900, #ffff00, #33ff00, #0099ff, #6633ff)",
    rainbowHard: "linear-gradient(to right, #ff0000 0%, #ff0000 14.28%, #ff9900 14.28%, #ff9900 28.57%, #ffff00 28.57%, #ffff00 42.85%, #33ff00 42.85%, #33ff00 57.14%, #0099ff 57.14%, #0099ff 71.42%, #6633ff 71.42%, #6633ff 85.71%, #ff00ff 85.71%, #ff00ff 100%)",
    rainbowHardVertical: "linear-gradient(to bottom, #ff0000 0%, #ff0000 16.5%, #ff9900 16.5%, #ff9900 33%, #ffff00 33%, #ffff00 50%, #33ff00 50%, #33ff00 66%, #0099ff 66%, #0099ff 83.5%, #6633ff 83.5%, #6633ff 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // NEON / CYBERPUNK
    // ─────────────────────────────────────────────────────────────────────────
    neonPink: "linear-gradient(135deg, #ff00ff 0%, #ff69b4 50%, #ff1493 100%)",
    neonBlue: "linear-gradient(135deg, #00ffff 0%, #0099ff 50%, #6633ff 100%)",
    neonGreen: "linear-gradient(135deg, #00ff00 0%, #33ff00 50%, #00cc00 100%)",
    cyberpunk: "linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)",
    synthwave: "linear-gradient(180deg, #2b1055 0%, #7597de 50%, #ff00ff 100%)",
    vaporwave: "linear-gradient(180deg, #ff71ce 0%, #01cdfe 50%, #05ffa1 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // SUNSET / SUNRISE
    // ─────────────────────────────────────────────────────────────────────────
    sunset: "linear-gradient(to bottom, #ff512f 0%, #f09819 100%)",
    sunrise: "linear-gradient(to bottom, #ff9966 0%, #ff5e62 100%)",
    goldenHour: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    twilight: "linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // OCEAN / SKY
    // ─────────────────────────────────────────────────────────────────────────
    ocean: "linear-gradient(to bottom, #2193b0 0%, #6dd5ed 100%)",
    deepSea: "linear-gradient(to bottom, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    sky: "linear-gradient(to bottom, #56ccf2 0%, #2f80ed 100%)",
    nightSky: "linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    aurora: "linear-gradient(135deg, #00c6ff 0%, #0072ff 25%, #7209b7 50%, #3a0ca3 75%, #4361ee 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // FIRE / WARM
    // ─────────────────────────────────────────────────────────────────────────
    fire: "linear-gradient(to top, #f12711 0%, #f5af19 100%)",
    lava: "linear-gradient(to top, #ff0000 0%, #ff5500 30%, #ff9900 60%, #ffcc00 100%)",
    warmFlame: "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
    hotPink: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // NATURE
    // ─────────────────────────────────────────────────────────────────────────
    forest: "linear-gradient(to bottom, #134e5e 0%, #71b280 100%)",
    grass: "linear-gradient(to bottom, #56ab2f 0%, #a8e063 100%)",
    mint: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    lavender: "linear-gradient(to bottom, #e6dee9 0%, #c8b6d4 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // DARK / MOODY
    // ─────────────────────────────────────────────────────────────────────────
    darkPurple: "linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    midnight: "linear-gradient(to bottom, #232526 0%, #414345 100%)",
    charcoal: "linear-gradient(to bottom, #3a3a3a 0%, #1a1a1a 100%)",
    obsidian: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #2a2a4e 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // METALLIC
    // ─────────────────────────────────────────────────────────────────────────
    silver: "linear-gradient(180deg, #e8e8e8 0%, #b8b8b8 50%, #e8e8e8 100%)",
    gold: "linear-gradient(180deg, #f7ef8a 0%, #d4af37 50%, #f7ef8a 100%)",
    copper: "linear-gradient(180deg, #b87333 0%, #da8a67 50%, #b87333 100%)",
    bronze: "linear-gradient(180deg, #cd7f32 0%, #e5a84b 50%, #cd7f32 100%)",
    
    // ─────────────────────────────────────────────────────────────────────────
    // PASTEL
    // ─────────────────────────────────────────────────────────────────────────
    pastelRainbow: "linear-gradient(to right, #ffecd2, #fcb69f, #ffeaa7, #dfe6e9, #a29bfe, #fd79a8)",
    pastelPink: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    pastelBlue: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    pastelGreen: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    cotton: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR PALETTES FOR STRIPE GRADIENTS
// ═══════════════════════════════════════════════════════════════════════════════

const COLOR_PALETTES = {
    rainbow: ["#ff0000", "#ff9900", "#ffff00", "#33ff00", "#0099ff", "#6633ff"],
    nyanCat: ["#ff0000", "#ff9900", "#ffff00", "#33ff00", "#0099ff", "#6633ff"],
    pastel: ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff"],
    sunset: ["#f72585", "#b5179e", "#7209b7", "#560bad", "#480ca8", "#3a0ca3", "#3f37c9", "#4361ee"],
    ocean: ["#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4"],
    forest: ["#004b23", "#006400", "#007200", "#008000", "#38b000", "#70e000", "#9ef01a", "#ccff33"],
    fire: ["#ff0000", "#ff3300", "#ff6600", "#ff9900", "#ffcc00", "#ffff00"],
    pink: ["#ff0a54", "#ff477e", "#ff5c8a", "#ff7096", "#ff85a1", "#ff99ac", "#fbb1bd", "#f9bec7"],
    mono: ["#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff"],
    neon: ["#ff00ff", "#ff00cc", "#ff0099", "#ff0066", "#ff0033", "#ff0000"],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a preset gradient by name
 * @param {string} name - Preset name (e.g., "rainbow", "sunset", "neonPink")
 * @returns {string} CSS gradient string
 */
function getPreset(name) {
    return GRADIENT_PRESETS[name] || GRADIENT_PRESETS.rainbow;
}

/**
 * Get all available preset names
 * @returns {string[]} Array of preset names
 */
function getPresetNames() {
    return Object.keys(GRADIENT_PRESETS);
}

/**
 * Parse direction string to CSS direction
 * @param {string} direction - "horizontal", "vertical", "diagonal", or CSS direction
 * @returns {string} CSS direction value
 */
function parseDirection(direction) {
    const dirMap = {
        horizontal: "to right",
        vertical: "to bottom",
        diagonal: "135deg",
        "diagonal-up": "45deg",
        "diagonal-down": "135deg",
        left: "to left",
        right: "to right",
        top: "to top",
        bottom: "to bottom",
    };
    return dirMap[direction] || direction || "to right";
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT CREATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a linear gradient from an array of colors
 * @param {string[]} colors - Array of color values
 * @param {object} options - Options
 * @param {string} options.direction - "horizontal", "vertical", "diagonal", or CSS direction
 * @param {boolean} options.hard - If true, creates hard color stops (no blending)
 * @returns {string} CSS linear-gradient string
 * 
 * @example
 * createLinear(["#ff0000", "#00ff00", "#0000ff"])
 * // → "linear-gradient(to right, #ff0000, #00ff00, #0000ff)"
 * 
 * createLinear(["#ff0000", "#00ff00"], { direction: "vertical", hard: true })
 * // → "linear-gradient(to bottom, #ff0000 0%, #ff0000 50%, #00ff00 50%, #00ff00 100%)"
 */
function createLinear(colors, options = {}) {
    const { direction = "horizontal", hard = false } = options;
    const dir = parseDirection(direction);
    
    if (!Array.isArray(colors) || colors.length === 0) {
        return "linear-gradient(to right, #ff69b4, #ff1493)";
    }
    
    if (hard) {
        // Hard stops - no blending between colors
        const stops = [];
        const step = 100 / colors.length;
        
        colors.forEach((color, i) => {
            const start = i * step;
            const end = (i + 1) * step;
            stops.push(`${color} ${start}%`);
            stops.push(`${color} ${end}%`);
        });
        
        return `linear-gradient(${dir}, ${stops.join(", ")})`;
    } else {
        // Smooth blending
        return `linear-gradient(${dir}, ${colors.join(", ")})`;
    }
}

/**
 * Create a radial gradient from an array of colors
 * @param {string[]} colors - Array of color values (center to edge)
 * @param {object} options - Options
 * @param {string} options.shape - "circle" or "ellipse"
 * @param {string} options.position - "center", "top", "bottom", "left", "right", or CSS position
 * @returns {string} CSS radial-gradient string
 * 
 * @example
 * createRadial(["#ff0000", "#0000ff"])
 * // → "radial-gradient(circle at center, #ff0000, #0000ff)"
 */
function createRadial(colors, options = {}) {
    const { shape = "circle", position = "center" } = options;
    
    if (!Array.isArray(colors) || colors.length === 0) {
        return "radial-gradient(circle at center, #ff69b4, #1a1a2e)";
    }
    
    return `radial-gradient(${shape} at ${position}, ${colors.join(", ")})`;
}

/**
 * Create a conic gradient (pie-chart style)
 * @param {string[]} colors - Array of color values (around the circle)
 * @param {object} options - Options
 * @param {string} options.from - Starting angle (e.g., "0deg", "90deg")
 * @param {string} options.at - Center position (e.g., "center", "50% 50%")
 * @returns {string} CSS conic-gradient string
 * 
 * @example
 * createConic(["#ff0000", "#00ff00", "#0000ff"])
 * // → "conic-gradient(from 0deg at center, #ff0000, #00ff00, #0000ff, #ff0000)"
 */
function createConic(colors, options = {}) {
    const { from = "0deg", at = "center" } = options;
    
    if (!Array.isArray(colors) || colors.length === 0) {
        return "conic-gradient(from 0deg at center, #ff69b4, #ff1493, #ff69b4)";
    }
    
    // Add first color at end to complete the circle
    const fullColors = [...colors, colors[0]];
    
    return `conic-gradient(from ${from} at ${at}, ${fullColors.join(", ")})`;
}

/**
 * Create a repeating stripe pattern
 * @param {string[]} colors - Array of color values
 * @param {object} options - Options
 * @param {string} options.direction - Direction of stripes
 * @param {number} options.stripeWidth - Width of each stripe in pixels
 * @returns {string} CSS repeating-linear-gradient string
 * 
 * @example
 * createStripes(["#ff0000", "#0000ff"], { stripeWidth: 10 })
 * // → "repeating-linear-gradient(to right, #ff0000 0px, #ff0000 10px, #0000ff 10px, #0000ff 20px)"
 */
function createStripes(colors, options = {}) {
    const { direction = "diagonal", stripeWidth = 10 } = options;
    const dir = parseDirection(direction);
    
    if (!Array.isArray(colors) || colors.length === 0) {
        return "repeating-linear-gradient(45deg, #ff69b4 0px, #ff69b4 10px, #1a1a2e 10px, #1a1a2e 20px)";
    }
    
    const stops = [];
    let position = 0;
    
    colors.forEach((color, i) => {
        stops.push(`${color} ${position}px`);
        position += stripeWidth;
        stops.push(`${color} ${position}px`);
    });
    
    return `repeating-linear-gradient(${dir}, ${stops.join(", ")})`;
}

/**
 * Create a gradient using a named color palette
 * @param {string} paletteName - Name of the palette (e.g., "rainbow", "sunset", "ocean")
 * @param {object} options - Options passed to createLinear
 * @returns {string} CSS gradient string
 * 
 * @example
 * createFromPalette("rainbow", { direction: "vertical" })
 * createFromPalette("sunset", { hard: true })
 */
function createFromPalette(paletteName, options = {}) {
    const colors = COLOR_PALETTES[paletteName] || COLOR_PALETTES.rainbow;
    return createLinear(colors, options);
}

/**
 * Create a two-color gradient (most common use case)
 * @param {string} color1 - Start color
 * @param {string} color2 - End color
 * @param {string} direction - Direction (default: "horizontal")
 * @returns {string} CSS linear-gradient string
 * 
 * @example
 * createSimple("#ff69b4", "#ff1493")
 * createSimple("#ff0000", "#0000ff", "diagonal")
 */
function createSimple(color1, color2, direction = "horizontal") {
    return createLinear([color1, color2], { direction });
}

/**
 * Create a three-color gradient with optional center position
 * @param {string} color1 - Start color
 * @param {string} color2 - Middle color
 * @param {string} color3 - End color
 * @param {object} options - Options
 * @param {string} options.direction - Direction
 * @param {number} options.centerPosition - Middle color position (0-100, default: 50)
 * @returns {string} CSS linear-gradient string
 */
function createThreeColor(color1, color2, color3, options = {}) {
    const { direction = "horizontal", centerPosition = 50 } = options;
    const dir = parseDirection(direction);
    return `linear-gradient(${dir}, ${color1} 0%, ${color2} ${centerPosition}%, ${color3} 100%)`;
}

/**
 * Modify an existing gradient's direction
 * @param {string} gradient - Existing CSS gradient string
 * @param {string} newDirection - New direction
 * @returns {string} Modified CSS gradient string
 */
function changeDirection(gradient, newDirection) {
    const dir = parseDirection(newDirection);
    
    // Handle linear-gradient
    if (gradient.startsWith("linear-gradient")) {
        return gradient.replace(/linear-gradient\([^,]+,/, `linear-gradient(${dir},`);
    }
    
    // Handle radial-gradient position
    if (gradient.startsWith("radial-gradient")) {
        return gradient.replace(/at [^,]+,/, `at ${newDirection},`);
    }
    
    return gradient;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Demo view showing all presets and examples
const renderedView = (
    <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: "1.5rem",
        padding: "1rem",
        maxWidth: "500px",
    }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>
            Gradient Utilities Demo
        </div>
        
        {/* Preset examples */}
        <div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                Preset Gradients
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["rainbow", "sunset", "ocean", "neonPink", "cyberpunk", "fire"].map(name => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "120px",
                            height: "24px",
                            background: getPreset(name),
                            borderRadius: "4px",
                        }} />
                        <span style={{ fontSize: "12px", color: "#aaa" }}>{name}</span>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Created examples */}
        <div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                Created with Helper Functions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "120px",
                        height: "24px",
                        background: createSimple("#ff69b4", "#6633ff"),
                        borderRadius: "4px",
                    }} />
                    <span style={{ fontSize: "11px", color: "#666" }}>createSimple("#ff69b4", "#6633ff")</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "120px",
                        height: "24px",
                        background: createLinear(["#ff0000", "#00ff00", "#0000ff"], { hard: true }),
                        borderRadius: "4px",
                    }} />
                    <span style={{ fontSize: "11px", color: "#666" }}>createLinear([...], {`{hard: true}`})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "120px",
                        height: "24px",
                        background: createStripes(["#ff69b4", "#1a1a2e"], { stripeWidth: 8 }),
                        borderRadius: "4px",
                    }} />
                    <span style={{ fontSize: "11px", color: "#666" }}>createStripes([...], {`{stripeWidth: 8}`})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "120px",
                        height: "24px",
                        background: createFromPalette("sunset"),
                        borderRadius: "4px",
                    }} />
                    <span style={{ fontSize: "11px", color: "#666" }}>createFromPalette("sunset")</span>
                </div>
            </div>
        </div>
    </div>
);

return {
    renderedView,
    
    // Presets
    GRADIENT_PRESETS,
    COLOR_PALETTES,
    getPreset,
    getPresetNames,
    
    // Creation functions
    createLinear,
    createRadial,
    createConic,
    createStripes,
    createFromPalette,
    createSimple,
    createThreeColor,
    
    // Utility functions
    changeDirection,
    parseDirection,
};
