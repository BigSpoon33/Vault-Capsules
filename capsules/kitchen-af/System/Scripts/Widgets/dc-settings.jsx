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
// REMOTE CAPSULE STORE - Network-based capsule management
// ─────────────────────────────────────────────────────────────────────────────
const REMOTE_MANIFEST_URL = "https://raw.githubusercontent.com/BigSpoon33/Vault-Capsules/main/capsule-manifest.json";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/BigSpoon33/Vault-Capsules/main";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Load/Save Settings - reads directly from file to avoid stale cache
// ─────────────────────────────────────────────────────────────────────────────
async function loadSettings() {
    const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
    if (!file) return null;

    // Read file directly to avoid stale metadataCache
    try {
        const content = await app.vault.read(file);
        // Parse YAML frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
            // Use Obsidian's built-in YAML parser if available
            const yaml = match[1];
            // Simple approach: let Obsidian parse it by triggering cache refresh
            await app.metadataCache.trigger("resolve", file);
            // Small delay to let cache update
            await new Promise(r => setTimeout(r, 50));
        }
    } catch (e) {
        console.warn("Could not force cache refresh:", e);
    }

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
        // Wait for cache to update after save
        await new Promise(r => setTimeout(r, 100));
        return true;
    } catch (e) {
        console.error("Failed to save settings:", e);
        new Notice("Failed to save settings");
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Sync activities based on installed capsules (from manifest)
// ─────────────────────────────────────────────────────────────────────────────
function computeActivitiesForCapsules(installedCapsuleIds, manifestCapsules = []) {
    const activities = [];
    const seenIds = new Set();

    for (const capsuleId of installedCapsuleIds) {
        const capsule = manifestCapsules.find(c => c.id === capsuleId);
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

    const getCapsuleInfo = (module) => {
        // Module now contains its own description from the manifest
        return { description: module.description || "Custom capsule" };
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
                        const info = getCapsuleInfo(module);
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
// SECTION: Capsules (Remote capsule management - clone/pull/delete)
// Fetches capsule catalog from GitHub, manages installation and activities
// ─────────────────────────────────────────────────────────────────────────────
function CapsulesSection({ settings, onUpdate, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    const warning = theme?.["color-warning"] || "#f59e0b";
    const errorColor = theme?.["color-red"] || "#ef4444";

    const [manifest, setManifest] = dc.useState(null);
    const [loadingManifest, setLoadingManifest] = dc.useState(true);
    const [manifestError, setManifestError] = dc.useState(null);
    const [operationStatus, setOperationStatus] = dc.useState({});
    const [filter, setFilter] = dc.useState("all");

    // Track installed capsules from settings
    const installedCapsules = settings?.["installed-capsules"] || {};
    const installedModules = settings?.["installed-modules"] || [];

    // Fetch manifest on mount
    dc.useEffect(() => {
        fetchManifest();
    }, []);

    const fetchManifest = async () => {
        setLoadingManifest(true);
        setManifestError(null);
        try {
            const fetchUrl = REMOTE_MANIFEST_URL + '?t=' + Date.now();
            console.log('[Capsules] Fetching manifest:', fetchUrl);
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setManifest(data);
        } catch (err) {
            setManifestError(err.message);
        } finally {
            setLoadingManifest(false);
        }
    };

    // Get unique sources for filter buttons
    const sources = dc.useMemo(() => {
        if (!manifest?.capsules) return ["all"];
        const uniqueSources = [...new Set(manifest.capsules.map(c => c.source).filter(Boolean))];
        return ["all", ...uniqueSources];
    }, [manifest]);

    // Filter capsules by source
    const filteredCapsules = dc.useMemo(() => {
        if (!manifest?.capsules) return [];
        if (filter === "all") return manifest.capsules;
        return manifest.capsules.filter(c => c.source === filter);
    }, [manifest, filter]);

    // Clone (install) a capsule
    const cloneCapsule = async (capsule) => {
        setOperationStatus(prev => ({ ...prev, [capsule.id]: { status: "cloning", message: "Downloading..." } }));

        try {
            const installedFiles = [];

            for (const file of capsule.files) {
                const fileUrl = `${GITHUB_RAW_BASE}/${file.src}?t=${Date.now()}`;
                console.log('[Capsules] Fetching file:', fileUrl);
                setOperationStatus(prev => ({
                    ...prev,
                    [capsule.id]: { status: "cloning", message: `Fetching ${file.src.split('/').pop()}...` }
                }));

                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error(`Failed to fetch ${file.src}: HTTP ${response.status}`);
                const content = await response.text();

                // Ensure directory exists
                const destDir = file.dest.split('/').slice(0, -1).join('/');
                if (destDir) {
                    const dirExists = app.vault.getAbstractFileByPath(destDir);
                    if (!dirExists) {
                        await app.vault.createFolder(destDir);
                    }
                }

                // Write or update file
                const existingFile = app.vault.getAbstractFileByPath(file.dest);
                if (existingFile) {
                    await app.vault.modify(existingFile, content);
                } else {
                    await app.vault.create(file.dest, content);
                }

                installedFiles.push(file.dest);
            }

            // IMPORTANT: Read FRESH settings to avoid losing previously installed capsules
            // (props may be stale if multiple installs happen in sequence)
            const freshSettings = await loadSettings();
            const freshInstalledCapsules = freshSettings?.["installed-capsules"] || {};
            const freshInstalledModules = freshSettings?.["installed-modules"] || [];

            // Update installed-capsules tracking (merge with fresh data)
            const newInstalledCapsules = {
                ...freshInstalledCapsules,
                [capsule.id]: {
                    version: capsule.version,
                    installedAt: new Date().toISOString(),
                    files: installedFiles
                }
            };

            // Add widgets from capsule's widgets array to installed-modules (top bar)
            // This allows vault capsules to define multiple top-bar widgets
            let newModules = [...freshInstalledModules];
            if (capsule.widgets && capsule.widgets.length > 0) {
                for (const widget of capsule.widgets) {
                    // Skip if already exists (don't duplicate)
                    if (!newModules.some(m => m.id === widget.id)) {
                        newModules.push({
                            id: widget.id,
                            label: widget.label,
                            icon: widget.icon,
                            widget: widget.widget,
                            description: widget.description
                        });
                    }
                }
            }

            // Compute activities from all installed capsules
            const allInstalledIds = Object.keys(newInstalledCapsules);
            const activities = computeActivitiesForCapsules(allInstalledIds, manifest?.capsules || []);

            await onUpdate({
                "installed-capsules": newInstalledCapsules,
                "installed-modules": newModules,
                "activities": activities
            });

            setOperationStatus(prev => ({
                ...prev,
                [capsule.id]: { status: "success", message: `Installed v${capsule.version}` }
            }));
            new Notice(`Installed ${capsule.name} v${capsule.version}`);
        } catch (err) {
            setOperationStatus(prev => ({
                ...prev,
                [capsule.id]: { status: "error", message: err.message }
            }));
            new Notice(`Failed to install ${capsule.name}: ${err.message}`);
        }
    };

    // Pull (update) a capsule
    const pullCapsule = async (capsule) => {
        setOperationStatus(prev => ({ ...prev, [capsule.id]: { status: "pulling", message: "Updating..." } }));
        await cloneCapsule(capsule);
    };

    // Delete a capsule
    const deleteCapsule = async (capsule) => {
        setOperationStatus(prev => ({ ...prev, [capsule.id]: { status: "deleting", message: "Removing..." } }));

        try {
            // Read FRESH settings to get accurate installed state
            const freshSettings = await loadSettings();
            const freshInstalledCapsules = freshSettings?.["installed-capsules"] || {};
            const freshInstalledModules = freshSettings?.["installed-modules"] || [];

            const installed = freshInstalledCapsules[capsule.id];
            if (!installed) throw new Error("Capsule not found in installed list");

            // Get core files from manifest that should NEVER be deleted
            const coreFiles = manifest?.coreFiles || [];

            // Delete capsule files, but SKIP core files
            let deletedCount = 0;
            let skippedCount = 0;
            for (const filePath of installed.files) {
                // Skip core/protected files
                if (coreFiles.includes(filePath)) {
                    console.log(`[Capsules] Skipping core file: ${filePath}`);
                    skippedCount++;
                    continue;
                }

                const file = app.vault.getAbstractFileByPath(filePath);
                if (file) {
                    await app.vault.delete(file);
                    deletedCount++;
                }
            }
            console.log(`[Capsules] Deleted ${deletedCount} files, skipped ${skippedCount} core files`);

            // Remove from installed-capsules (using fresh data)
            const newInstalledCapsules = { ...freshInstalledCapsules };
            delete newInstalledCapsules[capsule.id];

            // Remove widgets that came from this capsule from installed-modules
            const capsuleWidgetIds = (capsule.widgets || []).map(w => w.id);
            const newModules = freshInstalledModules.filter(m => !capsuleWidgetIds.includes(m.id));

            // Recompute activities
            const allInstalledIds = Object.keys(newInstalledCapsules);
            const activities = computeActivitiesForCapsules(allInstalledIds, manifest?.capsules || []);

            await onUpdate({
                "installed-capsules": newInstalledCapsules,
                "installed-modules": newModules,
                "activities": activities
            });

            setOperationStatus(prev => ({
                ...prev,
                [capsule.id]: { status: "deleted", message: "Removed" }
            }));
            new Notice(`Removed ${capsule.name}`);
        } catch (err) {
            setOperationStatus(prev => ({
                ...prev,
                [capsule.id]: { status: "error", message: err.message }
            }));
            new Notice(`Failed to remove ${capsule.name}: ${err.message}`);
        }
    };

    const getStatusBadge = (capsuleId, capsule) => {
        const op = operationStatus[capsuleId];
        const installed = installedCapsules[capsuleId];

        if (op?.status === "cloning" || op?.status === "pulling") {
            return <GloBadge label={`⏳ ${op.message}`} color={warning} size="small" />;
        }
        if (op?.status === "deleting") {
            return <GloBadge label="🗑️ Removing..." color={warning} size="small" />;
        }
        if (op?.status === "error") {
            return <GloBadge label={`❌ ${op.message}`} color={errorColor} size="small" />;
        }
        if (op?.status === "success") {
            return <GloBadge label={`✓ ${op.message}`} color={success} size="small" />;
        }
        if (op?.status === "deleted") {
            return <GloBadge label="🗑️ Removed" color={textMuted} size="small" />;
        }

        if (installed) {
            const hasUpdate = capsule && installed.version !== capsule.version;
            if (hasUpdate) {
                return <GloBadge label={`⬆️ Update: v${capsule.version}`} color={warning} size="small" />;
            }
            return <GloBadge label={`✓ v${installed.version}`} color={success} size="small" />;
        }

        return null;
    };

    if (loadingManifest) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
                Fetching capsule catalog...
            </div>
        );
    }

    if (manifestError && !manifest) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <div style={{ color: errorColor, marginBottom: 12 }}>Failed to load capsule catalog</div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>{manifestError}</div>
                <GloButton label="Retry" icon="🔄" variant="primary" onClick={fetchManifest} />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header with refresh */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: textMuted }}>
                    {`${manifest?.capsules?.length || 0} capsules available • ${Object.keys(installedCapsules).length} installed`}
                </div>
                <GloButton
                    icon="🔄"
                    label="Refresh"
                    size="small"
                    variant="ghost"
                    onClick={fetchManifest}
                />
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                {filteredCapsules.map(capsule => {
                    const installed = installedCapsules[capsule.id];
                    const hasUpdate = installed && installed.version !== capsule.version;
                    const isOperating = ["cloning", "pulling", "deleting"].includes(operationStatus[capsule.id]?.status);
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
                                        <span style={{ fontWeight: 600, color: text }}>{capsule.name}</span>
                                        <span style={{ fontSize: 11, color: textMuted }}>v{capsule.version}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>
                                        {capsule.description}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        {capsule.source && <GloBadge label={capsule.source} color={primary} size="small" />}
                                        <GloBadge label={`${capsule.files?.length || 0} files`} color={textMuted} size="small" />
                                        {activityCount > 0 && (
                                            <GloBadge label={`${activityCount} activities`} color={textMuted} size="small" />
                                        )}
                                        {getStatusBadge(capsule.id, capsule)}
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
                                    <strong>Activities:</strong> {capsule.activities.map(a => `${a.icon} ${a.name}`).join(", ")}
                                </div>
                            )}

                            {/* File list preview */}
                            <div style={{
                                marginTop: 8,
                                padding: "8px 12px",
                                background: hexToRgba(primary, 0.05),
                                borderRadius: 8,
                                fontSize: 10,
                                fontFamily: "var(--font-monospace)",
                                color: textMuted,
                                maxHeight: 50,
                                overflow: "auto"
                            }}>
                                {capsule.files?.map(f => f.dest).join("\n")}
                            </div>

                            {/* Action buttons */}
                            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                {installed ? (
                                    <>
                                        <GloButton
                                            label="Delete"
                                            icon="🗑️"
                                            size="small"
                                            variant="ghost"
                                            onClick={() => deleteCapsule(capsule)}
                                            disabled={isOperating}
                                            style={{ color: errorColor }}
                                        />
                                        <GloButton
                                            label={hasUpdate ? "Update" : "Reinstall"}
                                            icon="⬇️"
                                            size="small"
                                            variant={hasUpdate ? "primary" : "ghost"}
                                            onClick={() => pullCapsule(capsule)}
                                            disabled={isOperating}
                                            glow={hasUpdate}
                                        />
                                    </>
                                ) : (
                                    <GloButton
                                        label="Install"
                                        icon="📥"
                                        size="small"
                                        variant="primary"
                                        onClick={() => cloneCapsule(capsule)}
                                        disabled={isOperating}
                                        glow
                                    />
                                )}
                            </div>
                        </GloCard>
                    );
                })}
            </div>

            {/* Empty state */}
            {filteredCapsules.length === 0 && (
                <GloCard padding="40px">
                    <div style={{ textAlign: "center", color: textMuted }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                        <div>No capsules found{filter !== "all" ? ` in "${filter}"` : ""}.</div>
                    </div>
                </GloCard>
            )}
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
