// ═══════════════════════════════════════════════════════════════════════════════
// DC-SETTINGS - Feature-rich Settings UI for Daily AF
// Tabs: Theme (dashboard), Order (reorder), Capsules (add/remove), Goals
// Auto-manages activities based on installed capsules
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const { GloToggle } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx")
);

const { GloCard } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloCard.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

const SETTINGS_PATH = "System/Settings.md";

// ─────────────────────────────────────────────────────────────────────────────
// CAPSULE CATALOG - Available capsules with their associated activities
// ─────────────────────────────────────────────────────────────────────────────
const CAPSULE_CATALOG = [
    // Core (Built-in)
    {
        id: "journal",
        label: "Journal",
        icon: "📝",
        widget: null,
        source: "Built-in",
        description: "Daily journaling with auto-save",
        activities: [
            { id: "journal", name: "Journal", type: "count", field: "journal", icon: "📖", color: "#2089FF" }
        ]
    },

    // From Active AF
    {
        id: "morning",
        label: "Morning",
        icon: "🌅",
        widget: "dc-sleepTracker",
        source: "Active AF",
        description: "Sleep tracking & daily plan viewer",
        activities: [
            { id: "sleep", name: "Sleep", type: "value", field: "sleep-hours", goal: 8, unit: "hrs", icon: "🌙", color: "#00B894" }
        ]
    },
    {
        id: "activities",
        label: "Activities",
        icon: "📊",
        widget: "dc-activityLogger",
        source: "Active AF",
        description: "Log and track daily activities",
        activities: [
            { id: "mood", name: "Mood", type: "value", field: "mood", goal: 5, icon: "😊", color: "#A29BFE" },
            { id: "energy", name: "Energy", type: "value", field: "energy", goal: 5, icon: "⚡", color: "#FDCB6E" },
            { id: "water", name: "Water", type: "value", field: "water-ml", goal: 3000, unit: "ml", icon: "💧", color: "#0984E3" }
        ]
    },
    {
        id: "meditation",
        label: "Meditation",
        icon: "🧘",
        widget: "dc-meditationTimer",
        source: "Active AF",
        description: "Guided meditation timer",
        activities: [
            { id: "meditation", name: "Meditation", type: "value", field: "meditation-minutes", goal: 15, unit: "min", icon: "🧘", color: "#81ECEC" }
        ]
    },
    {
        id: "evening",
        label: "Evening",
        icon: "🌙",
        widget: "dc-eveningReflection",
        source: "Active AF",
        description: "Evening reflection & gratitude",
        activities: [
            { id: "gratitude", name: "Gratitude", type: "count", field: "gratitude", icon: "❤️", color: "#FD79A8" }
        ]
    },
    {
        id: "tracker",
        label: "Trends",
        icon: "📉",
        widget: "dc-activityTracker",
        source: "Active AF",
        description: "Heatmaps & trend graphs",
        activities: [] // No activities, just visualization
    },

    // From Kitchen AF
    {
        id: "meals",
        label: "Meals",
        icon: "🍽️",
        widget: "dc-todayMenu",
        source: "Kitchen AF",
        description: "Meal planning & nutrition tracking",
        activities: [
            { id: "calories", name: "Calories", type: "value", field: "consumed-calories", goal: 2000, unit: "kcal", icon: "🔥", color: "#FF7675" },
            { id: "protein", name: "Protein", type: "value", field: "consumed-protein", goal: 150, unit: "g", icon: "🥩", color: "#E17055" },
            { id: "carbs", name: "Carbs", type: "value", field: "consumed-carbs", goal: 200, unit: "g", icon: "🌾", color: "#FDCB6E" },
            { id: "fat", name: "Fat", type: "value", field: "consumed-fat", goal: 65, unit: "g", icon: "🫒", color: "#74B9FF" }
        ]
    },

    // From Workout AF
    {
        id: "movement",
        label: "Movement",
        icon: "💪",
        widget: "dc-workoutToday",
        source: "Workout AF",
        description: "Daily workout tracking",
        activities: [
            { id: "exercise", name: "Exercise", type: "value", field: "exercise-minutes", goal: 30, unit: "min", icon: "🏋️", color: "#E17055" },
            { id: "workout-days", name: "Workout Days", type: "value", field: "workout-days", goal: 4, unit: "days/wk", icon: "📅", color: "#00CEC9" }
        ]
    },

    // From Academic AF (dashboard accessed via bottom bar, not top bar)
    {
        id: "academic",
        label: "Academic",
        icon: "🎓",
        widget: null,
        source: "Academic AF",
        description: "Study tracking (dashboard via bottom bar)",
        dashboardOnly: true,
        dashboardPath: "System/Dashboards/Academic Dashboard.md",
        activities: [
            { id: "study", name: "Study", type: "value", field: "study-hours", goal: 4, unit: "hrs", icon: "📚", color: "#9B59B6" },
            { id: "learning", name: "Learning", type: "boolean", field: "learning", icon: "🎓", color: "#3498DB" }
        ]
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Load/Save Settings
// ─────────────────────────────────────────────────────────────────────────────
async function loadSettings() {
    const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
    if (!file) return null;
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter || {};
}

async function saveSettings(updates) {
    const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
    if (!file) {
        new Notice("Settings.md not found!");
        return false;
    }

    try {
        await app.fileManager.processFrontMatter(file, (fm) => {
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === undefined) {
                    delete fm[key];
                } else {
                    fm[key] = value;
                }
            });
        });
        return true;
    } catch (e) {
        console.error("Failed to save settings:", e);
        new Notice("Failed to save settings");
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Sync activities based on installed capsules
// ─────────────────────────────────────────────────────────────────────────────
function computeActivitiesForCapsules(installedCapsuleIds) {
    const activities = [];
    const seenIds = new Set();

    for (const capsuleId of installedCapsuleIds) {
        const capsule = CAPSULE_CATALOG.find(c => c.id === capsuleId);
        if (capsule && capsule.activities) {
            for (const activity of capsule.activities) {
                if (!seenIds.has(activity.id)) {
                    seenIds.add(activity.id);
                    activities.push({ ...activity });
                }
            }
        }
    }

    return activities;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Theme (uses ThemeDashboard)
// ─────────────────────────────────────────────────────────────────────────────
function ThemeSection({ theme }) {
    const [Widget, setWidget] = dc.useState(null);
    const [error, setError] = dc.useState(null);
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";

    dc.useEffect(() => {
        const loadWidget = async () => {
            try {
                const result = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-themeDashboard.jsx"));
                setWidget(() => result.ThemeDashboard || result.Func || result.default || result);
            } catch (e) {
                console.error("Failed to load ThemeDashboard:", e);
                setError("Theme Dashboard not available");
            }
        };
        loadWidget();
    }, []);

    if (error) {
        return <div style={{ padding: 20, textAlign: "center", color: textMuted }}>{error}</div>;
    }

    if (!Widget) {
        return <div style={{ padding: 20, textAlign: "center", color: textMuted }}>Loading Theme Dashboard...</div>;
    }

    return <Widget />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Order (reorder installed capsules)
// ─────────────────────────────────────────────────────────────────────────────
function OrderSection({ settings, onUpdate, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const error = theme?.["color-red"] || "#ef4444";

    const [modules, setModules] = dc.useState(settings?.["installed-modules"] || []);
    const [hasChanges, setHasChanges] = dc.useState(false);

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newModules = [...modules];
        [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
        setModules(newModules);
        setHasChanges(true);
    };

    const handleMoveDown = (index) => {
        if (index === modules.length - 1) return;
        const newModules = [...modules];
        [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
        setModules(newModules);
        setHasChanges(true);
    };

    const handleSave = async () => {
        await onUpdate({ "installed-modules": modules });
        setHasChanges(false);
        new Notice("Tab order saved!");
    };

    const getCapsuleInfo = (moduleId) => {
        return CAPSULE_CATALOG.find(c => c.id === moduleId) || { description: "Custom capsule" };
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: textMuted }}>
                Drag or use arrows to reorder tabs in the Daily Wrapper.
            </div>

            {modules.length === 0 ? (
                <GloCard padding="24px">
                    <div style={{ textAlign: "center", color: textMuted }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                        <div>No capsules installed. Go to the Capsules tab to add some.</div>
                    </div>
                </GloCard>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {modules.map((module, index) => {
                        const info = getCapsuleInfo(module.id);
                        return (
                            <div
                                key={module.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "12px 16px",
                                    background: hexToRgba(primary, 0.1),
                                    border: `1px solid ${primary}33`,
                                    borderRadius: 10,
                                }}
                            >
                                <div style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: textMuted,
                                    width: 24,
                                    textAlign: "center"
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ fontSize: 20, width: 32, textAlign: "center" }}>
                                    {module.icon || "📦"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: text }}>{module.label}</div>
                                    <div style={{ fontSize: 11, color: textMuted }}>{info.description}</div>
                                </div>
                                <div style={{ display: "flex", gap: 4 }}>
                                    <GloButton
                                        icon="↑"
                                        size="small"
                                        variant="ghost"
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        style={{ opacity: index === 0 ? 0.3 : 1 }}
                                    />
                                    <GloButton
                                        icon="↓"
                                        size="small"
                                        variant="ghost"
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === modules.length - 1}
                                        style={{ opacity: index === modules.length - 1 ? 0.3 : 1 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {hasChanges && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <GloButton label="Save Order" icon="💾" variant="primary" onClick={handleSave} glow />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Capsules (add/remove with auto-activity management)
// ─────────────────────────────────────────────────────────────────────────────
function CapsulesSection({ settings, onUpdate, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    const warning = theme?.["color-warning"] || "#f59e0b";
    const errorColor = theme?.["color-red"] || "#ef4444";

    // Top bar modules (for Daily Wrapper tabs)
    const installedModules = settings?.["installed-modules"] || [];
    const installedModuleIds = installedModules.map(m => m.id);

    // Dashboard-only capsules (appear in bottom bar, not top bar)
    const installedDashboards = settings?.["installed-dashboards"] || [];

    const [filter, setFilter] = dc.useState("all");

    const sources = ["all", "Built-in", "Active AF", "Kitchen AF", "Workout AF", "Academic AF"];

    const filteredCapsules = filter === "all"
        ? CAPSULE_CATALOG
        : CAPSULE_CATALOG.filter(c => c.source === filter);

    const checkWidgetExists = (widgetName) => {
        if (!widgetName) return true;
        const path = `System/Scripts/Widgets/${widgetName}.jsx`;
        return !!app.vault.getAbstractFileByPath(path);
    };

    const checkDashboardExists = (dashboardPath) => {
        if (!dashboardPath) return false;
        return !!app.vault.getAbstractFileByPath(dashboardPath);
    };

    const isInstalled = (capsuleId) => {
        return installedModuleIds.includes(capsuleId) || installedDashboards.includes(capsuleId);
    };

    // Get all installed capsule IDs for activity computation
    const getAllInstalledIds = () => {
        return [...installedModuleIds, ...installedDashboards];
    };

    const handleAddCapsule = async (capsule) => {
        const updates = {};

        if (capsule.dashboardOnly) {
            // Dashboard-only: add to installed-dashboards, NOT installed-modules
            const newDashboards = [...installedDashboards, capsule.id];
            updates["installed-dashboards"] = newDashboards;

            // Compute activities from all installed capsules
            const allIds = [...installedModuleIds, ...newDashboards];
            updates["activities"] = computeActivitiesForCapsules(allIds);
        } else {
            // Regular module: add to installed-modules
            const newModule = {
                id: capsule.id,
                label: capsule.label,
                icon: capsule.icon,
                widget: capsule.widget,
            };
            const newModules = [...installedModules, newModule];
            updates["installed-modules"] = newModules;

            // Compute activities from all installed capsules
            const allIds = [...newModules.map(m => m.id), ...installedDashboards];
            updates["activities"] = computeActivitiesForCapsules(allIds);
        }

        await onUpdate(updates);
        new Notice(`Added ${capsule.label} capsule`);
    };

    const handleRemoveCapsule = async (capsuleId) => {
        const capsule = CAPSULE_CATALOG.find(c => c.id === capsuleId);
        const updates = {};

        if (capsule?.dashboardOnly) {
            // Remove from installed-dashboards
            const newDashboards = installedDashboards.filter(id => id !== capsuleId);
            updates["installed-dashboards"] = newDashboards;

            // Compute activities
            const allIds = [...installedModuleIds, ...newDashboards];
            updates["activities"] = computeActivitiesForCapsules(allIds);
        } else {
            // Remove from installed-modules
            const newModules = installedModules.filter(m => m.id !== capsuleId);
            updates["installed-modules"] = newModules;

            // Compute activities
            const allIds = [...newModules.map(m => m.id), ...installedDashboards];
            updates["activities"] = computeActivitiesForCapsules(allIds);
        }

        await onUpdate(updates);
        new Notice(`Removed ${capsule?.label || capsuleId} capsule`);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: textMuted }}>
                Add or remove capsules. Activities are automatically synced based on installed capsules.
            </div>

            {/* Filter buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sources.map(source => (
                    <GloButton
                        key={source}
                        label={source === "all" ? "All" : source}
                        size="small"
                        variant={filter === source ? "primary" : "ghost"}
                        onClick={() => setFilter(source)}
                    />
                ))}
            </div>

            {/* Capsule grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {filteredCapsules.map(capsule => {
                    const installed = isInstalled(capsule.id);
                    const isDashboardOnly = capsule.dashboardOnly === true;
                    const widgetExists = isDashboardOnly ? true : checkWidgetExists(capsule.widget);
                    const dashboardExists = isDashboardOnly ? checkDashboardExists(capsule.dashboardPath) : true;
                    const canInstall = isDashboardOnly ? dashboardExists : widgetExists;
                    const activityCount = capsule.activities?.length || 0;

                    return (
                        <GloCard key={capsule.id} padding="16px">
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{
                                    fontSize: 28,
                                    width: 48,
                                    height: 48,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: installed ? hexToRgba(success, 0.2) : hexToRgba(primary, 0.15),
                                    borderRadius: 10,
                                    border: installed ? `2px solid ${success}` : "none",
                                }}>
                                    {capsule.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 600, color: text }}>{capsule.label}</span>
                                        {installed && (
                                            <GloBadge label="✓" color={success} size="small" />
                                        )}
                                    </div>
                                    <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>
                                        {capsule.description}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <GloBadge label={capsule.source} color={primary} size="small" />
                                        {isDashboardOnly && (
                                            <GloBadge label="Dashboard" color={textMuted} size="small" />
                                        )}
                                        {activityCount > 0 && (
                                            <GloBadge label={`${activityCount} activities`} color={textMuted} size="small" />
                                        )}
                                        {!widgetExists && capsule.widget && (
                                            <GloBadge label="Widget Missing" color={warning} size="small" />
                                        )}
                                        {isDashboardOnly && !dashboardExists && (
                                            <GloBadge label="Dashboard Missing" color={warning} size="small" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Activity preview */}
                            {capsule.activities && capsule.activities.length > 0 && (
                                <div style={{
                                    marginTop: 12,
                                    padding: "8px 12px",
                                    background: hexToRgba(primary, 0.05),
                                    borderRadius: 8,
                                    fontSize: 11,
                                    color: textMuted,
                                }}>
                                    <strong>Activities:</strong> {capsule.activities.map(a => a.name).join(", ")}
                                </div>
                            )}

                            {/* Action button */}
                            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                                {installed ? (
                                    <GloButton
                                        label="Remove"
                                        icon="✕"
                                        size="small"
                                        variant="ghost"
                                        onClick={() => handleRemoveCapsule(capsule.id)}
                                        style={{ color: errorColor }}
                                    />
                                ) : canInstall ? (
                                    <GloButton
                                        label="Add Capsule"
                                        icon="+"
                                        size="small"
                                        variant="primary"
                                        onClick={() => handleAddCapsule(capsule)}
                                    />
                                ) : (
                                    <GloButton
                                        label={isDashboardOnly ? "Copy Dashboard First" : "Copy Widget First"}
                                        icon="⚠️"
                                        size="small"
                                        variant="ghost"
                                        disabled
                                        style={{ color: warning }}
                                    />
                                )}
                            </div>
                        </GloCard>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: Settings
// ═══════════════════════════════════════════════════════════════════════════════
function Settings() {
    const { theme, isLoading: themeLoading } = useTheme();
    useComponentCSS();

    const primary = theme?.["color-primary"] || "#7c3aed";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";

    const [settings, setSettings] = dc.useState(null);
    const [isLoading, setIsLoading] = dc.useState(true);
    const [activeTab, setActiveTab] = dc.useState("theme");

    // Load settings on mount
    dc.useEffect(() => {
        const load = async () => {
            const s = await loadSettings();
            setSettings(s);
            setIsLoading(false);
        };
        load();
    }, []);

    const handleUpdate = async (updates) => {
        const success = await saveSettings(updates);
        if (success) {
            // Reload settings
            const s = await loadSettings();
            setSettings(s);
        }
    };

    if (themeLoading || isLoading) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: textMuted }}>
                Loading Settings...
            </div>
        );
    }

    const tabs = [
        { id: "theme", label: "Theme", icon: "🎨" },
        { id: "capsules", label: "Capsules", icon: "📦" },
        { id: "order", label: "Order", icon: "↕️" },
    ];

    return (
        <div style={{
            background: surface,
            borderRadius: 16,
            border: `1px solid ${primary}33`,
            overflow: "hidden",
        }}>
            {/* Header */}
            <div style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${primary}22`,
                background: hexToRgba(primary, 0.05),
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>⚙️</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: text }}>
                            Settings
                        </h2>
                        <div style={{ fontSize: 12, color: textMuted }}>
                            Configure your Daily AF experience
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: "flex",
                gap: 4,
                padding: "12px 16px",
                borderBottom: `1px solid ${primary}22`,
                background: hexToRgba(primary, 0.02),
            }}>
                {tabs.map(tab => (
                    <GloButton
                        key={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        variant={activeTab === tab.id ? "primary" : "ghost"}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ flex: 1 }}
                    />
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: 20 }}>
                {activeTab === "theme" && (
                    <ThemeSection theme={theme} />
                )}
                {activeTab === "capsules" && (
                    <CapsulesSection settings={settings} onUpdate={handleUpdate} theme={theme} />
                )}
                {activeTab === "order" && (
                    <OrderSection settings={settings} onUpdate={handleUpdate} theme={theme} />
                )}
            </div>
        </div>
    );
}

return { Settings, Func: Settings };
