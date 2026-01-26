// ═══════════════════════════════════════════════════════════════════════════════
// THEME STUDIO v1.1 (Responsive Layout Update)
// Unified wrapper that combines Theme Dashboard and Theme Editor
// 
// Features:
//   • Responsive Header: Buttons stack below title on mobile
//   • Seamless navigation between Dashboard and Editor views
//   • Pass theme ID to editor for direct editing
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { ThemeDashboard } = await dc.require(
    dc.fileLink("System/Scripts/Widgets/dc-themeDashboard.jsx")
);

const { ThemeEditor } = await dc.require(
    dc.fileLink("System/Scripts/Widgets/dc-themeEditor.jsx")
);

const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE CSS INJECTION
// ─────────────────────────────────────────────────────────────────────────────

function useResponsiveStudioCSS() {
    dc.useEffect(() => {
        const styleId = "dc-theme-studio-responsive-css";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                /* Container */
                .dc-theme-studio-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 600px;
                    font-family: Inter, system-ui, sans-serif;
                }

                /* Header Layout */
                .dc-theme-studio-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-radius: 12px 12px 0 0;
                    margin-bottom: 0;
                    background: linear-gradient(135deg, var(--theme-surface), var(--theme-background));
                    border-bottom: 1px solid var(--theme-surface-hover);
                }

                .dc-theme-studio-nav-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .dc-theme-studio-nav-right {
                    display: flex;
                    gap: 10px;
                }

                /* Buttons */
                .dc-theme-studio-nav-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                }

                /* Active State */
                .dc-theme-studio-nav-btn.active {
                    background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
                    color: #fff;
                    border: none;
                    box-shadow: 0 4px 12px var(--theme-surface-hover);
                }

                /* Inactive State */
                .dc-theme-studio-nav-btn.inactive {
                    background: transparent;
                    color: var(--theme-text-muted);
                    border: 1px solid var(--theme-surface-hover);
                }
                .dc-theme-studio-nav-btn.inactive:hover {
                    background: var(--theme-surface-hover);
                    color: var(--theme-text);
                }

                /* Typography */
                .dc-theme-studio-title {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--theme-primary);
                }

                .dc-theme-studio-breadcrumb {
                    font-size: 12px;
                    padding: 4px 10px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 12px;
                    color: var(--theme-text-muted);
                }

                /* MOBILE RESPONSIVE BREAKPOINT */
                @media (max-width: 640px) {
                    .dc-theme-studio-header {
                        flex-direction: column;
                        align-items: stretch; /* Stretch children to full width */
                        gap: 16px;
                        padding: 16px;
                    }

                    .dc-theme-studio-nav-left {
                        justify-content: space-between;
                        width: 100%;
                    }

                    .dc-theme-studio-nav-right {
                        width: 100%;
                        display: flex;
                    }

                    .dc-theme-studio-nav-btn {
                        flex: 1; /* Buttons share equal width */
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: ThemeStudio
// ═══════════════════════════════════════════════════════════════════════════════

function ThemeStudio() {
    // Mode: "dashboard" or "editor"
    const [mode, setMode] = dc.useState("dashboard");

    // Theme ID to pass to editor when switching
    const [editThemeId, setEditThemeId] = dc.useState(null);

    // Flashy Mode state
    const [flashyMode, setFlashyMode] = dc.useState(true);

    // Get current theme state
    const { theme, isLoading } = useTheme();

    // Load CSS
    useComponentCSS();
    useResponsiveStudioCSS();

    // Load flashy-mode from Settings.md on mount
    dc.useEffect(() => {
        const loadFlashyMode = async () => {
            const settingsFile = app.metadataCache.getFirstLinkpathDest("System/Settings.md", "");
            if (settingsFile) {
                const cache = app.metadataCache.getFileCache(settingsFile);
                setFlashyMode(cache?.frontmatter?.["flashy-mode"] !== false);
            }
        };
        loadFlashyMode();
    }, []);

    // Toggle flashy-mode in Settings.md
    const toggleFlashyMode = async () => {
        const newValue = !flashyMode;
        setFlashyMode(newValue);

        const settingsFile = app.vault.getAbstractFileByPath("System/Settings.md");
        if (settingsFile) {
            await app.fileManager.processFrontMatter(settingsFile, (fm) => {
                fm["flashy-mode"] = newValue;
            });
            new Notice(`Flashy Mode: ${newValue ? "ON" : "OFF"}`);
        }
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // NAVIGATION HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const openEditor = (themeId = null) => {
        setEditThemeId(themeId);
        setMode("editor");
    };
    
    const openDashboard = () => {
        setMode("dashboard");
        setEditThemeId(null);
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // LOADING STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Loading Theme Studio...</span>
            </div>
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    return (
        <div className="dc-theme-studio-container">
            {/* Navigation Header */}
            <div className="dc-theme-studio-header">
                {/* Left: Title & Breadcrumb */}
                <div className="dc-theme-studio-nav-left">
                    <h1 className="dc-theme-studio-title">
                        Theme Studio
                    </h1>
                    <span className="dc-theme-studio-breadcrumb">
                        {mode === "dashboard" ? "Select & Apply" : "Edit Theme"}
                    </span>
                    {/* Flashy Mode Toggle */}
                    <button
                        onClick={toggleFlashyMode}
                        title={flashyMode ? "Disable effects (glow, animations)" : "Enable effects (glow, animations)"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            border: flashyMode
                                ? "none"
                                : "1px solid var(--theme-surface-hover)",
                            background: flashyMode
                                ? "linear-gradient(135deg, var(--theme-primary), var(--theme-accent))"
                                : "transparent",
                            color: flashyMode ? "#fff" : "var(--theme-text-muted)",
                            boxShadow: flashyMode ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                        }}
                    >
                        <span>{flashyMode ? "✨" : "💤"}</span>
                        <span>Flashy</span>
                    </button>
                </div>
                
                {/* Right: Mode Toggle Buttons */}
                <div className="dc-theme-studio-nav-right">
                    {/* Dashboard Button */}
                    <button
                        onClick={openDashboard}
                        className={`dc-theme-studio-nav-btn ${mode === "dashboard" ? "active" : "inactive"}`}
                    >
                        <span>🎨</span>
                        <span>Dashboard</span>
                    </button>
                    
                    {/* Editor Button */}
                    <button
                        onClick={() => openEditor(null)}
                        className={`dc-theme-studio-nav-btn ${mode === "editor" ? "active" : "inactive"}`}
                    >
                        <span>✏️</span>
                        <span>Editor</span>
                    </button>
                </div>
            </div>
            
            {/* Content Area */}
            <div style={{ flex: 1 }}>
                {mode === "dashboard" ? (
                    <ThemeDashboard onEditTheme={openEditor} />
                ) : (
                    <ThemeEditor initialThemeId={editThemeId} />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const renderedView = <ThemeStudio />;
return { renderedView, ThemeStudio };