// ═══════════════════════════════════════════════════════════════════════════════
// DC-EXERCISE-PICKER - Dropdown for Exercise category notes
// Uses GloSelect styled dropdown, populated with Exercise notes from vault
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { GloSelect } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx"));

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT ICONS BY TYPE
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_ICONS = {
    // By exercise type
    strength: "💪",
    cardio: "🏃",
    flexibility: "🧘",
    warmup: "🔥",
    cooldown: "🧊",
    compound: "🏋️",
    isolation: "🎯",
    // By target muscle
    chest: "🫁",
    back: "🔙",
    legs: "🦵",
    shoulders: "🤷",
    arms: "💪",
    core: "🎯",
    glutes: "🍑",
    hamstrings: "🦵",
    quads: "🦵",
    lats: "🦾",
    biceps: "💪",
    triceps: "💪",
    // Fallback
    default: "⚡",
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ICON FOR EXERCISE
// ─────────────────────────────────────────────────────────────────────────────
const getExerciseIcon = (frontmatter) => {
    // 1. Use explicit icon if set
    if (frontmatter?.icon && String(frontmatter.icon).trim()) {
        return frontmatter.icon;
    }

    // 2. Try to infer from type
    const types = frontmatter?.type || [];
    const typeArray = Array.isArray(types) ? types : [types];
    for (const t of typeArray) {
        const key = String(t).toLowerCase();
        if (DEFAULT_ICONS[key]) return DEFAULT_ICONS[key];
    }

    // 3. Try to infer from target
    const targets = frontmatter?.target || [];
    const targetArray = Array.isArray(targets) ? targets : [targets];
    for (const t of targetArray) {
        const key = String(t).toLowerCase();
        if (DEFAULT_ICONS[key]) return DEFAULT_ICONS[key];
    }

    // 4. Default
    return DEFAULT_ICONS.default;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: ExercisePicker
// ═══════════════════════════════════════════════════════════════════════════════
function ExercisePicker({
    value = "",
    onChange = null,
    onSelect = null,
    placeholder = "Select exercise...",
    width = "100%",
    size = "medium",
    disabled = false,
    style = {},
}) {
    // ─────────────────────────────────────────────────────────────────────────
    // QUERY EXERCISE NOTES (using hook at top level)
    // ─────────────────────────────────────────────────────────────────────────
    const allPages = dc.useQuery(`@page`);

    // Process the query results into GloSelect options format
    const exerciseOptions = dc.useMemo(() => {
        const options = [];

        if (!allPages) return options;

        for (const page of allPages) {
            // Use datacore's API: page.value("field") for frontmatter
            const rawCategories = page.value("categories");

            // Normalize categories to array (could be string, array, or undefined)
            let categories = [];
            if (Array.isArray(rawCategories)) {
                categories = rawCategories;
            } else if (rawCategories) {
                categories = [rawCategories];
            }

            // Check if this note has Exercise category
            const hasExerciseCategory = categories.some(cat => {
                const catStr = String(cat);
                return catStr.includes("Exercise");
            });

            if (hasExerciseCategory) {
                const fileName = page.$name || "Unknown";
                const filePath = page.$path || "";

                // Skip template files
                if (fileName.toLowerCase().includes("template")) continue;
                // Skip planner files
                if (fileName.toLowerCase().includes("planner")) continue;
                // Skip category files
                if (fileName.toLowerCase() === "exercise") continue;

                // Get frontmatter values using page.value()
                const icon = page.value("icon");
                const targets = page.value("target") || [];
                const types = page.value("type") || [];

                const targetArray = Array.isArray(targets) ? targets : [];
                const typeArray = Array.isArray(types) ? types : [];

                // Build frontmatter object for icon resolution
                const fm = { icon, target: targetArray, type: typeArray };
                const resolvedIcon = getExerciseIcon(fm);

                options.push({
                    value: fileName,
                    label: fileName,
                    icon: resolvedIcon,
                    // Store extra data for onSelect callback
                    _meta: {
                        path: filePath,
                        target: targetArray,
                        type: typeArray,
                    }
                });
            }
        }

        // Sort alphabetically
        options.sort((a, b) => a.label.localeCompare(b.label));
        return options;
    }, [allPages]);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLE SELECTION
    // ─────────────────────────────────────────────────────────────────────────
    const handleChange = (selectedValue) => {
        if (onChange) {
            onChange(selectedValue);
        }

        if (onSelect) {
            const option = exerciseOptions.find(o => o.value === selectedValue);
            if (option) {
                onSelect({
                    name: option.value,
                    icon: option.icon,
                    path: option._meta?.path,
                    target: option._meta?.target,
                    type: option._meta?.type,
                });
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <GloSelect
            options={exerciseOptions}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            searchable={true}
            searchPlaceholder="Search exercises..."
            showIcon={true}
            size={size}
            width={width}
            position="auto"
            maxHeight="300px"
            disabled={disabled}
            style={style}
            glow={true}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
return { ExercisePicker, getExerciseIcon, DEFAULT_ICONS };
