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
// SEMVER: Semantic version comparison
// ─────────────────────────────────────────────────────────────────────────────
const compareSemver = (a, b) => {
    const parseVersion = (v) => {
        const [main, pre] = (v || '0.0.0').split('-');
        const [major, minor, patch] = main.split('.').map(n => parseInt(n, 10) || 0);
        return { major, minor, patch, pre: pre || '' };
    };

    const va = parseVersion(a);
    const vb = parseVersion(b);

    if (va.major !== vb.major) return va.major - vb.major;
    if (va.minor !== vb.minor) return va.minor - vb.minor;
    if (va.patch !== vb.patch) return va.patch - vb.patch;

    // Pre-release versions are lower than release versions
    if (va.pre && !vb.pre) return -1;
    if (!va.pre && vb.pre) return 1;
    return va.pre.localeCompare(vb.pre);
};

// Returns true if 'available' is newer than 'installed'
const hasNewerVersion = (installed, available) => compareSemver(installed, available) < 0;

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP: File backup before overwrite
// ─────────────────────────────────────────────────────────────────────────────
const backupFile = async (filePath) => {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file) return null;

    try {
        const content = await app.vault.read(file);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `System/Backups/${filePath.replace(/\//g, '_')}_${timestamp}`;

        // Ensure backup directory exists (uses ensureDirectoryExists defined below)
        const backupDir = 'System/Backups';
        const existing = app.vault.getAbstractFileByPath(backupDir);
        if (!existing) {
            // Create System first, then System/Backups
            const systemDir = app.vault.getAbstractFileByPath('System');
            if (!systemDir) {
                try { await app.vault.createFolder('System'); } catch (e) { /* ignore if exists */ }
            }
            try { await app.vault.createFolder(backupDir); } catch (e) { /* ignore if exists */ }
        }

        await app.vault.create(backupPath, content);
        console.log(`[Capsules] Backed up: ${filePath} -> ${backupPath}`);
        return backupPath;
    } catch (e) {
        console.error(`[Capsules] Failed to backup ${filePath}:`, e);
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFLICT: Check if local file differs from remote content
// ─────────────────────────────────────────────────────────────────────────────
const detectConflict = async (localPath, remoteContent) => {
    const file = app.vault.getAbstractFileByPath(localPath);
    if (!file) return { hasConflict: false, reason: 'new' };

    try {
        const localContent = await app.vault.read(file);
        if (localContent === remoteContent) {
            return { hasConflict: false, reason: 'identical' };
        }

        return {
            hasConflict: true,
            reason: 'modified',
            localLength: localContent.length,
            remoteLength: remoteContent.length
        };
    } catch (e) {
        console.error(`[Capsules] Failed to detect conflict for ${localPath}:`, e);
        return { hasConflict: false, reason: 'error' };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEPENDENCIES: Check if required capsules are installed
// ─────────────────────────────────────────────────────────────────────────────
const checkDependencies = (capsule, installedCapsules) => {
    const requires = capsule.requires || [];
    const missing = requires.filter(reqId => !installedCapsules[reqId]);
    return {
        satisfied: missing.length === 0,
        missing
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Recursively create nested directories
// ─────────────────────────────────────────────────────────────────────────────
const ensureDirectoryExists = async (dirPath) => {
    if (!dirPath) return;

    // Check if directory already exists
    const existing = app.vault.getAbstractFileByPath(dirPath);
    if (existing) return;

    // Split path and create each level
    const parts = dirPath.split('/');
    let currentPath = '';

    for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const exists = app.vault.getAbstractFileByPath(currentPath);
        if (!exists) {
            try {
                await app.vault.createFolder(currentPath);
            } catch (e) {
                // Folder might have been created by another process, ignore
                if (!e.message?.includes('already exists')) {
                    console.error(`[Capsules] Failed to create folder ${currentPath}:`, e);
                }
            }
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Load/Save Settings - parses YAML directly from file (no cache)
// ─────────────────────────────────────────────────────────────────────────────
async function loadSettings() {
    const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
    if (!file) return null;

    try {
        const content = await app.vault.read(file);
        // Extract YAML frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return {};

        const yamlContent = match[1];

        // Try multiple methods to parse YAML
        // Method 1: Try obsidian module's parseYaml
        try {
            const obsidian = require('obsidian');
            if (obsidian && obsidian.parseYaml) {
                return obsidian.parseYaml(yamlContent) || {};
            }
        } catch (e) {}

        // Method 2: Try global parseYaml
        if (typeof parseYaml === 'function') {
            return parseYaml(yamlContent) || {};
        }

        // Method 3: Fallback to metadataCache (might be slightly stale)
        const cache = app.metadataCache.getFileCache(file);
        return cache?.frontmatter || {};
    } catch (e) {
        console.error("Failed to load settings:", e);
        return {};
    }
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
        // 1. Check dependencies first
        const deps = checkDependencies(capsule, installedCapsules);
        if (!deps.satisfied) {
            setOperationStatus(prev => ({
                ...prev,
                [capsule.id]: {
                    status: "error",
                    message: `Missing: ${deps.missing.join(', ')}. Install core-af first.`
                }
            }));
            new Notice(`Cannot install ${capsule.name}: requires ${deps.missing.join(', ')}`);
            return;
        }

        setOperationStatus(prev => ({ ...prev, [capsule.id]: { status: "cloning", message: "Downloading..." } }));

        try {
            const installedFiles = [];
            const backedUpFiles = [];
            const conflicts = [];

            // Get core files list and per-capsule behavior
            const coreFiles = manifest?.coreFiles || [];
            const capsuleBehavior = capsule.coreFileBehavior || 'skip'; // Default: skip

            for (const file of capsule.files) {
                // Skip _comment entries (manifest organization)
                if (file._comment) continue;

                const isCoreFile = coreFiles.includes(file.dest);
                const existingFile = app.vault.getAbstractFileByPath(file.dest);

                // Core file handling based on per-capsule behavior
                if (isCoreFile && existingFile) {
                    if (capsuleBehavior === 'skip') {
                        console.log(`[Capsules] Skipping core file (exists): ${file.dest}`);
                        installedFiles.push(file.dest);
                        continue;
                    }
                    // capsuleBehavior === 'update' - proceed to download and overwrite
                    console.log(`[Capsules] Updating core file: ${file.dest}`);
                }

                const fileUrl = `${GITHUB_RAW_BASE}/${file.src}?t=${Date.now()}`;
                console.log('[Capsules] Fetching file:', fileUrl);
                setOperationStatus(prev => ({
                    ...prev,
                    [capsule.id]: { status: "cloning", message: `Fetching ${file.src.split('/').pop()}...` }
                }));

                const response = await fetch(fileUrl);
                if (!response.ok) {
                    console.error(`[Capsules] Failed to fetch: ${file.dest}`);
                    continue;
                }
                const content = await response.text();

                // Conflict detection & backup for existing non-core files
                if (existingFile && !isCoreFile) {
                    const conflict = await detectConflict(file.dest, content);
                    if (conflict.hasConflict) {
                        const backupPath = await backupFile(file.dest);
                        if (backupPath) {
                            backedUpFiles.push({ original: file.dest, backup: backupPath });
                        }
                        conflicts.push(file.dest);
                    }
                }

                // Ensure directory exists (handles nested paths like .obsidian/snippets)
                const destDir = file.dest.split('/').slice(0, -1).join('/');
                await ensureDirectoryExists(destDir);

                // Write or update file (with error handling to not break the loop)
                try {
                    if (existingFile) {
                        await app.vault.modify(existingFile, content);
                    } else {
                        await app.vault.create(file.dest, content);
                    }
                    installedFiles.push(file.dest);
                } catch (writeErr) {
                    // If create fails because file exists (race condition), try modify
                    if (writeErr.message?.includes('already exists')) {
                        try {
                            const retryFile = app.vault.getAbstractFileByPath(file.dest);
                            if (retryFile) {
                                await app.vault.modify(retryFile, content);
                                installedFiles.push(file.dest);
                                console.log(`[Capsules] Recovered from race condition: ${file.dest}`);
                            }
                        } catch (retryErr) {
                            console.error(`[Capsules] Failed to write ${file.dest}:`, retryErr);
                        }
                    } else {
                        console.error(`[Capsules] Failed to write ${file.dest}:`, writeErr);
                    }
                }
            }

            // Use atomic processFrontMatter to read-modify-write in one operation
            // This ensures we don't lose data from race conditions or stale reads
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) throw new Error("Settings.md not found");

            await app.fileManager.processFrontMatter(settingsFile, (fm) => {
                // Get current values directly from frontmatter (always fresh)
                const currentInstalledCapsules = fm["installed-capsules"] || {};
                const currentInstalledModules = fm["installed-modules"] || [];

                console.log('[Capsules] Current installed capsules:', Object.keys(currentInstalledCapsules));

                // Merge new capsule into installed-capsules
                fm["installed-capsules"] = {
                    ...currentInstalledCapsules,
                    [capsule.id]: {
                        version: capsule.version,
                        installedAt: new Date().toISOString(),
                        files: installedFiles
                    }
                };

                console.log('[Capsules] After merge:', Object.keys(fm["installed-capsules"]));

                // Add widgets from capsule's widgets array to installed-modules (top bar)
                let newModules = [...currentInstalledModules];
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
                fm["installed-modules"] = newModules;

                // Compute activities from all installed capsules
                const allInstalledIds = Object.keys(fm["installed-capsules"]);
                console.log('[Capsules] Computing activities for:', allInstalledIds);
                fm["activities"] = computeActivitiesForCapsules(allInstalledIds, manifest?.capsules || []);
                console.log('[Capsules] Activities count:', fm["activities"].length);
            });

            // Wait for file system and metadata cache to sync after frontmatter update
            await new Promise(r => setTimeout(r, 200));

            // Notify parent to refresh
            onUpdate({});

            // Show conflict/backup notification if any
            if (backedUpFiles.length > 0) {
                console.log(`[Capsules] ${backedUpFiles.length} files backed up before overwrite`);
                setOperationStatus(prev => ({
                    ...prev,
                    [capsule.id]: {
                        status: "success",
                        message: `Installed v${capsule.version}. ${backedUpFiles.length} file(s) backed up.`,
                        backedUpFiles
                    }
                }));
                new Notice(`Installed ${capsule.name} v${capsule.version}. ${backedUpFiles.length} file(s) backed up to System/Backups/`);
            } else {
                setOperationStatus(prev => ({
                    ...prev,
                    [capsule.id]: { status: "success", message: `Installed v${capsule.version}` }
                }));
                new Notice(`Installed ${capsule.name} v${capsule.version}`);
            }
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
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) throw new Error("Settings.md not found");

            // First, read current state to get the file list
            const currentSettings = await loadSettings();
            const installed = currentSettings?.["installed-capsules"]?.[capsule.id];
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

            // Use atomic processFrontMatter to update settings
            await app.fileManager.processFrontMatter(settingsFile, (fm) => {
                const currentInstalledCapsules = fm["installed-capsules"] || {};
                const currentInstalledModules = fm["installed-modules"] || [];

                // Remove from installed-capsules
                delete currentInstalledCapsules[capsule.id];
                fm["installed-capsules"] = currentInstalledCapsules;

                // Remove widgets that came from this capsule from installed-modules
                const capsuleWidgetIds = (capsule.widgets || []).map(w => w.id);
                fm["installed-modules"] = currentInstalledModules.filter(m => !capsuleWidgetIds.includes(m.id));

                // Recompute activities
                const allInstalledIds = Object.keys(currentInstalledCapsules);
                fm["activities"] = computeActivitiesForCapsules(allInstalledIds, manifest?.capsules || []);
            });

            // Wait for file system and metadata cache to sync after frontmatter update
            await new Promise(r => setTimeout(r, 200));

            // Notify parent to refresh
            onUpdate({});

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
            // Use semver comparison instead of string comparison
            const updateAvailable = capsule && hasNewerVersion(installed.version, capsule.version);
            if (updateAvailable) {
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
                    // Use semver comparison for update detection
                    const hasUpdate = installed && hasNewerVersion(installed.version, capsule.version);
                    const isOperating = ["cloning", "pulling", "deleting"].includes(operationStatus[capsule.id]?.status);
                    const activityCount = capsule.activities?.length || 0;
                    // Check dependencies - blocks installation if not met
                    const deps = checkDependencies(capsule, installedCapsules);
                    const isInstalled = !!installed;
                    // Filter out _comment entries from file count
                    const fileCount = capsule.files?.filter(f => !f._comment).length || 0;

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
                                        <GloBadge label={`${fileCount} files`} color={textMuted} size="small" />
                                        {activityCount > 0 && (
                                            <GloBadge label={`${activityCount} activities`} color={textMuted} size="small" />
                                        )}
                                        {/* Dependency warning badge - shown when deps not satisfied and not installed */}
                                        {!deps.satisfied && !isInstalled && (
                                            <GloBadge
                                                label={`Requires: ${deps.missing.join(', ')}`}
                                                color={errorColor}
                                                size="small"
                                            />
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

                            {/* File list preview - filter out _comment entries */}
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
                                {capsule.files?.filter(f => !f._comment).map(f => f.dest).join("\n")}
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
                                        label={deps.satisfied ? "Install" : "Install (Blocked)"}
                                        icon="📥"
                                        size="small"
                                        variant={deps.satisfied ? "primary" : "ghost"}
                                        onClick={() => cloneCapsule(capsule)}
                                        disabled={isOperating || !deps.satisfied}
                                        glow={deps.satisfied}
                                        style={!deps.satisfied ? { opacity: 0.5 } : {}}
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
        // If updates provided, save them
        if (updates && Object.keys(updates).length > 0) {
            await saveSettings(updates);
        }
        // Always reload settings to get fresh state
        const s = await loadSettings();
        setSettings(s);
        console.log('[Settings] Reloaded settings, installed capsules:', Object.keys(s?.["installed-capsules"] || {}));
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
