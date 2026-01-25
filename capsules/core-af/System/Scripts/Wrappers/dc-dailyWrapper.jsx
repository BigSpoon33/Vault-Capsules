// ═══════════════════════════════════════════════════════════════════════════════
// DC-DAILY-WRAPPER - Unified Daily Note Interface
// Fixes: 
// 1. Added missing 'toggleDashboardEmbed' function to BottomViewBar.
// 2. Includes Water Tracker sync fix (double update).
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const {
    getTodayDateStr,
    getOffsetDateStr,
    formatDateDisplay,
    formatDateShort,
    getRelativeDateLabel,
    isToday,
    isPastDate,
    isFutureDate,
    getFileForDate,
    dateNoteExists,
    getFrontmatterForDate,
    saveFrontmatterForDate,
    getJournalSection,
    saveJournalSection,
    resolveDateStr,
} = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-dateContext.jsx")
);

const { CalendarPopup } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-calendarPicker.jsx")
);

// Capture Obsidian API
let ObsidianAPI = null;
try {
    ObsidianAPI = require("obsidian");
} catch (e) {
    if (typeof MarkdownRenderer !== "undefined") {
        ObsidianAPI = { MarkdownRenderer, Component };
    } else if (typeof obsidian !== "undefined") {
        ObsidianAPI = obsidian;
    }
}

const PLAN_FOLDER = "System/Plans";
const JOURNAL_FOLDER = "System/Journals";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Robust Markdown Renderer
// ─────────────────────────────────────────────────────────────────────────────
function Markdown({ content, sourcePath = "" }) {
    const containerRef = dc.useRef(null);

    dc.useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.empty();
        
        const Renderer = ObsidianAPI?.MarkdownRenderer || window.MarkdownRenderer;
        const Component = ObsidianAPI?.Component || window.Component || class {};

        if (Renderer) {
            Renderer.render(app, content, containerRef.current, sourcePath, new Component());
        } else {
            containerRef.current.innerText = content;
            containerRef.current.style.whiteSpace = "pre-wrap";
        }
    }, [content]);

    return <div ref={containerRef} className="markdown-rendered" style={{ padding: 0, minHeight: "20px", color: "var(--text-normal)" }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TodaysPlanViewer({ targetDate, theme }) {
    const filename = `${targetDate} Plan.md`;
    const filePath = `${PLAN_FOLDER}/${filename}`;
    const [content, setContent] = dc.useState("");
    const [exists, setExists] = dc.useState(false);
    const primary = theme?.["color-primary"] || "#7c3aed";

    dc.useEffect(() => {
        const load = async () => {
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file) {
                const raw = await app.vault.read(file);
                const body = raw.replace(/^---[\s\S]+?---(\r\n|\n)?/, "").trim();
                setContent(body);
                setExists(true);
            } else {
                setExists(false);
            }
        };
        load();
    }, [targetDate]);

    if (!exists) return null; 

    return (
        <div style={{
            background: `var(--background-secondary)`,
            borderRadius: 12,
            border: `1px solid ${primary}22`,
            padding: "16px 20px",
            marginTop: "16px"
        }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: primary, textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", borderBottom: `1px solid ${primary}22`, paddingBottom: "8px" }}>
                <span>🎯</span> Plan for Today
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <Markdown content={content} sourcePath={filePath} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIGURATION & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Default tabs (fallback if no installed-modules in Settings.md)
const DEFAULT_TABS = [
    { id: "morning", label: "Morning", icon: "🌅", widget: "dc-sleepTracker" },
    { id: "activities", label: "Activities", icon: "📊", widget: "dc-activityLogger" },
    { id: "meals", label: "Meals", icon: "🍽️", widget: "dc-todayMenu" },
    { id: "movement", label: "Movement", icon: "💪", widget: "dc-workoutToday" },
    { id: "meditation", label: "Meditation", icon: "🧘", widget: "dc-meditationTimer" },
    { id: "journal", label: "Journal", icon: "📝", widget: null },
    { id: "evening", label: "Evening", icon: "🌙", widget: "dc-eveningReflection" },
    { id: "tracker", label: "Trends", icon: "📉", widget: "dc-activityTracker" }
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: Load installed modules from Settings.md
// ─────────────────────────────────────────────────────────────────────────────
function useInstalledModules() {
    const [modules, setModules] = dc.useState([]);
    const [isLoading, setIsLoading] = dc.useState(true);

    dc.useEffect(() => {
        const loadModules = () => {
            try {
                const settingsFile = app.vault.getAbstractFileByPath("System/Settings.md");
                if (!settingsFile) {
                    console.warn("Settings.md not found, using default tabs");
                    setModules(DEFAULT_TABS);
                    setIsLoading(false);
                    return;
                }

                const cache = app.metadataCache.getFileCache(settingsFile);
                const installedModules = cache?.frontmatter?.["installed-modules"];

                if (installedModules && Array.isArray(installedModules) && installedModules.length > 0) {
                    // Validate and normalize module entries
                    const validModules = installedModules
                        .filter(m => m && m.id)
                        .map(m => ({
                            id: m.id,
                            label: m.label || m.id,
                            icon: m.icon || "📦",
                            widget: m.widget || null
                        }));

                    if (validModules.length > 0) {
                        setModules(validModules);
                    } else {
                        setModules(DEFAULT_TABS);
                    }
                } else {
                    // No installed-modules configured, use defaults
                    setModules(DEFAULT_TABS);
                }
            } catch (e) {
                console.error("Failed to load installed modules:", e);
                setModules(DEFAULT_TABS);
            }
            setIsLoading(false);
        };

        loadModules();
    }, []);

    return { modules, isLoading };
}

const DIRECTORIES = [
    {
        id: "tasks", label: "Tasks", icon: "✅",
        items: [
            { label: "Agenda", icon: "📘", type: "embed", value: "![[System/TaskNotes/Views/agenda-default.base]]" },
            { label: "Calendar", icon: "📅", type: "embed", value: "![[System/TaskNotes/Views/calendar-default.base]]" },
            { label: "Kanban Board", icon: "📋", type: "embed", value: "![[TaskNotes/Views/kanban-default.base|kanban-default]]" },
            { label: "View All", icon: "✅", type: "embed", value: "![[System/TaskNotes/Views/tasks-default.base]]" },
            { label: "Statistics", icon: "📈", type: "command", value: "tasknotes:open-statistics" }
        ]
    },
    {
        id: "notes", label: "Knowledge", icon: "🧠",
        items: [
            { label: "Inbox", icon: "📥", type: "embed", value: "![[System/Inbox]]" },
            { label: "Wiki", icon: "🌐", type: "embed", value: "![[System/Wiki]]" },
            { label: "Graph", icon: "🕸️", type: "command", value: "graph:open" }
        ]
    },
    {
        id: "admin", label: "System", icon: "⚙️",
        items: [
            { label: "Settings", icon: "🔧", type: "command", value: "app:open-settings" },
            { label: "Rice AF Settings", icon: "🔧", type: "embed", value: "![[System/Settings]]" },            
            { label: "Reload App", icon: "🔄", type: "command", value: "app:reload" }
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS & COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

async function createDailyNoteWithTemplater(dateStr) {
    const templatePath = "System/Templates/Daily Note Template.md";
    // 1. Define your target folder specifically
    const targetFolderPath = "System/Periodic"; 

    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    if (!templateFile) { new Notice(`⚠️ Template not found: ${templatePath}`); return false; }
    
    const templater = app.plugins.plugins["templater-obsidian"];
    if (!templater) { new Notice("⚠️ Templater plugin is not enabled."); return false; }

    // 2. Ensure the folder exists, create it if it doesn't
    let folderHandle = app.vault.getAbstractFileByPath(targetFolderPath);
    if (!folderHandle) {
        try {
            await app.vault.createFolder(targetFolderPath);
            folderHandle = app.vault.getAbstractFileByPath(targetFolderPath);
        } catch (err) {
            new Notice(`❌ Could not create folder: ${targetFolderPath}`);
            return false;
        }
    }
    
    try {
        await templater.templater.create_new_note_from_template(
            templateFile,
            folderHandle, // 3. Pass the explicit folder handle here
            dateStr,
            false
        );
        new Notice(`✅ Created ${dateStr} in ${targetFolderPath}`);
        return true;
    } catch (e) {
        console.error("Failed to create note:", e);
        new Notice("❌ Error creating note.");
        return false;
    }
}

function MissingNoteBanner({ selectedDate, onCreate, theme }) {
    const exists = dateNoteExists(selectedDate);
    if (exists) return null;
    const error = theme?.["color-red"] || "#ef4444";
    
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", background: hexToRgba(error, 0.15), border: `1px solid ${error}44`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🚫</span>
                <span style={{ fontSize: 13, color: error, fontWeight: 600 }}>Daily Note Missing</span>
            </div>
            <GloButton label="Create Note (+)" size="small" variant="filled" onClick={onCreate} style={{ padding: "4px 12px", background: hexToRgba(error, 0.2), color: error, borderColor: error }} />
        </div>
    );
}

function DateNavigation({ selectedDate, onDateChange, onCalendarOpen, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const prevDate = getOffsetDateStr(selectedDate, -1);
    const nextDate = getOffsetDateStr(selectedDate, 1);
    
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0" }}>
            <GloButton label={formatDateShort(prevDate)} icon="←" variant="ghost" size="small" onClick={() => onDateChange(prevDate)} style={{ padding: "6px 12px" }} />
            <div onClick={onCalendarOpen} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: hexToRgba(primary, 0.15), border: `1px solid ${primary}44`, borderRadius: 10, cursor: "pointer", transition: "all 0.2s ease", minWidth: "140px", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: text }}>{formatDateDisplay(selectedDate)}</span>
            </div>
            <GloButton label={formatDateShort(nextDate)} iconRight="→" variant="ghost" size="small" onClick={() => onDateChange(nextDate)} style={{ padding: "6px 12px" }} />
        </div>
    );
}

function PastDayBanner({ selectedDate, onReturnToToday, theme }) {
    const todayStr = getTodayDateStr();
    if (selectedDate === todayStr) return null;
    const primary = theme?.["color-primary"] || "#7c3aed";
    const warning = theme?.["color-warning"] || "#f59e0b";
    const isPast = isPastDate(selectedDate);
    
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", background: hexToRgba(isPast ? warning : primary, 0.15), border: `1px solid ${isPast ? warning : primary}44`, borderRadius: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: isPast ? warning : primary, fontWeight: 500 }}>
                {isPast ? "⚠️" : "📅"} Viewing {getRelativeDateLabel(selectedDate)} ({formatDateShort(selectedDate)})
            </span>
            <GloButton label="Return to Today" size="small" variant="ghost" onClick={onReturnToToday} style={{ padding: "4px 12px" }} />
        </div>
    );
}

function QuickStatsBar({ selectedDate, onWaterAdd, theme, showBackgrounds, lastUpdate }) {
    const fm = getFrontmatterForDate(selectedDate);
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    
    const sleepHours = fm["sleep-hours"] || 0;
    const mood = fm.mood || 0;
    const energy = fm.energy || 0;
    const meditationMins = fm["meditation-minutes"] || 0;
    const healthScore = fm["health-score"] || "—";
    const waterMl = fm["water-ml"] || 0;
    
    const stats = [
        { icon: "🌙", value: `${sleepHours}h`, label: "Sleep" },
        { icon: "😊", value: `${mood}/5`, label: "Mood" },
        { icon: "⚡", value: `${energy}/5`, label: "Energy" },
        { icon: "🧘", value: `${meditationMins}m`, label: "Meditation" },
        { icon: "📊", value: healthScore.toString().replace(/[😎🙂😐😔]\s*/, ""), label: "Score" },
    ];
    
    const isViewingToday = isToday(selectedDate);
    
    const containerStyle = {
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 12px",
        background: showBackgrounds ? hexToRgba(primary, 0.08) : "transparent",
        flexWrap: "wrap",
    };
    
    return (
        <div style={containerStyle}>
            {stats.map((stat, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", fontSize: 12, color: textMuted }} title={stat.label}>
                    <span>{stat.icon}</span><span style={{ fontWeight: 500, color: text }}>{stat.value}</span>
                </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: hexToRgba(success, 0.15), borderRadius: 6, marginLeft: 8 }}>
                <span style={{ fontSize: 12 }}>💧</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: text }}>{waterMl}ml</span>
                {isViewingToday && (
                    <button onClick={() => onWaterAdd(250)} style={{ background: hexToRgba(success, 0.3), border: "none", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, color: success, cursor: "pointer", marginLeft: 4 }}>+250</button>
                )}
            </div>
        </div>
    );
}

function TabNavigation({ activeTab, onTabChange, theme, showBackgrounds, tabs }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";

    // Use provided tabs or fall back to defaults
    const displayTabs = tabs && tabs.length > 0 ? tabs : DEFAULT_TABS;

    const containerStyle = {
        display: "flex", gap: 4, padding: "4px",
        background: showBackgrounds ? hexToRgba(primary, 0.08) : "transparent",
        borderRadius: 12, marginBottom: 16, overflowX: "auto", flexWrap: "nowrap",
    };

    return (
        <div style={containerStyle}>
            {displayTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            display: "flex", alignItems: "center", gap: 4, padding: "8px 12px",
                            background: isActive ? primary : "transparent",
                            border: isActive ? "none" : (showBackgrounds ? "none" : `1px solid ${primary}22`),
                            borderRadius: 8, color: isActive ? "#ffffff" : textMuted,
                            fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { if (!isActive) { e.target.style.background = hexToRgba(primary, 0.2); e.target.style.color = text; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.target.style.background = "transparent"; e.target.style.color = textMuted; } }}
                    >
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONTENT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function JournalTab({ targetDate, theme }) {
    const filename = `${targetDate} Journal.md`;
    const filePath = `${JOURNAL_FOLDER}/${filename}`;
    const [content, setContent] = dc.useState("");
    const [exists, setExists] = dc.useState(false);
    const [isLoading, setIsLoading] = dc.useState(true);
    const [lastSaved, setLastSaved] = dc.useState(null);
    const saveTimeoutRef = dc.useRef(null);

    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";

    const loadFile = async () => {
        setIsLoading(true);
        const file = app.vault.getAbstractFileByPath(filePath);
        if (file) {
            setExists(true);
            const text = await app.vault.read(file);
            setContent(text);
        } else {
            setExists(false);
        }
        setIsLoading(false);
    };

    dc.useEffect(() => { loadFile(); }, [targetDate]);

    const handleCreate = async () => {
        const folder = app.vault.getAbstractFileByPath(JOURNAL_FOLDER);
        if (!folder) await app.vault.createFolder(JOURNAL_FOLDER);
        const todayStr = window.moment().format("YYYY-MM-DD");
        const initialContent = `---
created: ${todayStr}
tags:
  - journal
---

# 📝 Journal for ${targetDate}

`;
        try {
            await app.vault.create(filePath, initialContent);
            new Notice(`Created ${filename}`);
            loadFile();
        } catch (e) { console.error(e); }
    };

    const handleChange = (e) => {
        const newText = e.target.value;
        setContent(newText);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file) { await app.vault.modify(file, newText); setLastSaved(new Date()); }
        }, 1000);
    };

    const handleOpenNote = () => { app.workspace.openLinkText(filePath, "", true); };

    if (isLoading) return <div>Loading...</div>;

    if (!exists) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", background: hexToRgba(primary, 0.05), borderRadius: 12, border: `1px dashed ${primary}44`, gap: "12px" }}>
                <span style={{ color: textMuted, fontSize: "13px" }}>No journal entry for {targetDate}.</span>
                <GloButton label="Create Journal Entry" icon="✍️" variant="primary" onClick={handleCreate} />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: primary }}>📝 Journal</span>
                    <button onClick={handleOpenNote} style={{ background: "transparent", border: `1px solid ${textMuted}44`, borderRadius: "4px", color: textMuted, cursor: "pointer", fontSize: "10px", padding: "2px 6px" }}>↗️ Open</button>
                </div>
                {lastSaved && <span style={{ fontSize: "10px", color: textMuted, opacity: 0.7 }}>Saved {lastSaved.toLocaleTimeString()}</span>}
            </div>
            <textarea value={content} onChange={handleChange} spellCheck="false" placeholder="Write your thoughts..." style={{ width: "100%", minHeight: "400px", padding: "16px", background: surfaceAlt, border: `1px solid ${primary}33`, borderRadius: "12px", color: text, fontSize: "15px", lineHeight: "1.6", fontFamily: "var(--font-text)", resize: "vertical", outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = primary} onBlur={(e) => e.target.style.borderColor = `${primary}33`} />
        </div>
    );
}

function WidgetLoader({ widgetName, targetDate, theme, lastUpdate }) {
    const [Widget, setWidget] = dc.useState(null);
    const [error, setError] = dc.useState(null);
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    
    dc.useEffect(() => {
        const loadWidget = async () => {
            try {
                const widgetPath = `System/Scripts/Widgets/${widgetName}.jsx`;
                const result = await dc.require(dc.fileLink(widgetPath));
                setWidget(() => result.Func || result.default || result);
                setError(null);
            } catch (e) {
                console.error(`Failed to load widget ${widgetName}:`, e);
                setError(`Failed to load ${widgetName}`);
            }
        };
        if (widgetName) loadWidget();
    }, [widgetName]);
    
    if (error) return <div style={{ padding: 20, textAlign: "center", color: textMuted }}>{error}</div>;
    if (!Widget) return <div style={{ padding: 20, textAlign: "center", color: textMuted }}>Loading widget...</div>;
    
    return <Widget targetDate={targetDate} lastUpdate={lastUpdate} />;
}

function MealsTab({ targetDate, theme, lastUpdate }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <WidgetLoader widgetName="dc-todayMenu" targetDate={targetDate} theme={theme} lastUpdate={lastUpdate} />
            <WidgetLoader widgetName="dc-waterTracker" targetDate={targetDate} theme={theme} lastUpdate={lastUpdate} />
        </div>
    );
}

function EveningTab({ targetDate, theme, lastUpdate }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const tomorrowDate = getOffsetDateStr(targetDate, 1);
    
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <WidgetLoader widgetName="dc-eveningReflection" targetDate={targetDate} theme={theme} lastUpdate={lastUpdate} />
            <div style={{ background: hexToRgba(primary, 0.08), borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 600, color: primary, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🎯</span> Tomorrow's Plan ({formatDateShort(tomorrowDate)})
                </h3>
                <TomorrowsPlan tomorrowDate={tomorrowDate} theme={theme} />
            </div>
        </div>
    );
}

function TomorrowsPlan({ tomorrowDate, theme }) {
    const filename = `${tomorrowDate} Plan.md`;
    const filePath = `${PLAN_FOLDER}/${filename}`;
    const [content, setContent] = dc.useState("");
    const [exists, setExists] = dc.useState(false);
    const [isLoading, setIsLoading] = dc.useState(true);
    const [lastSaved, setLastSaved] = dc.useState(null);
    const saveTimeoutRef = dc.useRef(null);
    const primary = theme?.["color-primary"] || "#7c3aed";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";

    const loadFile = async () => {
        setIsLoading(true);
        const file = app.vault.getAbstractFileByPath(filePath);
        if (file) {
            setExists(true);
            const text = await app.vault.read(file);
            setContent(text);
        } else {
            setExists(false);
        }
        setIsLoading(false);
    };

    dc.useEffect(() => { loadFile(); }, [tomorrowDate]);

    const handleCreate = async () => {
        const folder = app.vault.getAbstractFileByPath(PLAN_FOLDER);
        if (!folder) await app.vault.createFolder(PLAN_FOLDER);
        const todayStr = window.moment().format("YYYY-MM-DD");
        const initialContent = `---
created: ${todayStr}
tags:
  - note
  - plan
---

# 🎯 Plan for ${tomorrowDate}

- [ ] 
`;
        try {
            await app.vault.create(filePath, initialContent);
            new Notice(`Created ${filename}`);
            loadFile();
        } catch (e) { console.error(e); }
    };

    const handleChange = (e) => {
        const newText = e.target.value;
        setContent(newText);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file) { await app.vault.modify(file, newText); setLastSaved(new Date()); }
        }, 1000);
    };

    if (isLoading) return <div>Loading...</div>;

    if (!exists) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", background: hexToRgba(primary, 0.05), borderRadius: 12, border: `1px dashed ${primary}44`, gap: "12px" }}>
                <span style={{ color: textMuted, fontSize: "13px" }}>No plan found for tomorrow ({tomorrowDate}).</span>
                <GloButton label="Create Tomorrow's Plan" icon="✨" variant="primary" onClick={handleCreate} />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: primary, fontWeight: "bold", textTransform: "uppercase" }}>Editing: {filename}</span>
                {lastSaved && <span style={{ fontSize: "10px", color: textMuted, opacity: 0.7 }}>Saved {lastSaved.toLocaleTimeString()}</span>}
            </div>
            <textarea value={content} onChange={handleChange} spellCheck="false" style={{ width: "100%", minHeight: "300px", padding: "16px", background: surfaceAlt, border: `1px solid ${primary}33`, borderRadius: "12px", color: text, fontSize: "14px", lineHeight: "1.5", fontFamily: "var(--font-monospace)", resize: "vertical", outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }} onFocus={(e) => e.target.style.borderColor = primary} onBlur={(e) => e.target.style.borderColor = `${primary}33`} />
        </div>
    );
}

function FileLinkButton({ filePath, label, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const handleClick = () => { app.workspace.openLinkText(filePath, "", true); };
    return (
        <div onClick={handleClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "24px", background: `rgba(124, 58, 237, 0.05)`, border: `1px dashed ${primary}44`, borderRadius: 12, cursor: "pointer", transition: "all 0.2s ease", textAlign: "center", color: textMuted, minHeight: "120px" }} onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(124, 58, 237, 0.1)`; e.currentTarget.style.borderColor = primary; }} onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(124, 58, 237, 0.05)`; e.currentTarget.style.borderColor = `${primary}44`; }}>
            <div style={{ fontSize: "24px" }}>📋</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: theme?.["color-text"] }}>{label}</span>
                <span style={{ fontSize: "12px", fontStyle: "italic" }}>Click to open Kanban board</span>
            </div>
        </div>
    );
}

// ⚠️ FIXED: Added missing `toggleDashboardEmbed` function
// ⚠️ FIXED: Smart "Slot" Management
// 1. Finds the closing ``` of the widget.
// 2. Checks the line immediately below it.
// 3. If that line is an embed, it REPLACES it (preventing stacking).
// 4. If that line is the same embed, it REMOVES it (toggling off).
function BottomViewBar({ theme }) {
    const [activeDir, setActiveDir] = dc.useState(null);
    const [dynamicDashboards, setDynamicDashboards] = dc.useState([]);
    const [dynamicCategories, setDynamicCategories] = dc.useState([]);
    const [dynamicPlanners, setDynamicPlanners] = dc.useState([]);
    const primary = theme?.["color-primary"] || "#7c3aed";

    const toggleDashboardEmbed = async (embedLink) => {
        const file = app.workspace.getActiveFile();
        if (!file) { new Notice("No active file found."); return; }
        
        try {
            const content = await app.vault.read(file);
            const lines = content.split("\n");
            
            // 1. Find the Widget Block (The closing backticks)
            let blockEndIndex = -1;
            let insideBlock = false;
            
            // We scan for the first code block, assuming the widget is at the top
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith("```")) {
                    if (insideBlock) {
                        blockEndIndex = i; // Found closing tags
                        break;
                    } else {
                        insideBlock = true; // Found opening tags
                    }
                }
            }

            // Fallback: If no code block found, append to end (safety net)
            if (blockEndIndex === -1) {
                const newContent = content.includes(embedLink) 
                    ? content.replace(embedLink, "").trim() 
                    : content + "\n" + embedLink;
                await app.vault.modify(file, newContent);
                return;
            }

            // 2. Define the Target Slot (The line immediately after the block)
            const targetIndex = blockEndIndex + 1;
            
            // Handle case where file ends right after the block
            if (targetIndex >= lines.length) {
                lines.push(embedLink);
                new Notice("Opened view");
            } else {
                const currentLine = lines[targetIndex].trim();

                // Logic to Prevent Stacking:
                if (currentLine === embedLink) {
                    // CASE A: It's the same link -> Toggle OFF (Remove line)
                    lines.splice(targetIndex, 1);
                    new Notice("Closed view");
                } 
                else if (currentLine.startsWith("![[") && currentLine.endsWith("]]")) {
                    // CASE B: It's a DIFFERENT embed -> REPLACE it (Swap)
                    lines[targetIndex] = embedLink;
                    new Notice("Switched view");
                } 
                else if (currentLine === "") {
                    // CASE C: Empty line -> Fill it
                    lines[targetIndex] = embedLink;
                    new Notice("Opened view");
                } 
                else {
                    // CASE D: It's text/content -> Insert (Push text down)
                    lines.splice(targetIndex, 0, embedLink);
                    new Notice("Opened view");
                }
            }
            
            await app.vault.modify(file, lines.join("\n"));
            
        } catch (e) {
            console.error(e);
            new Notice("Error toggling embed");
        }
    };

    dc.useEffect(() => {
        const hasTag = (file, cache, tag) => {
            if (!cache) return false;
            const fmTags = cache.frontmatter?.tags;
            if (Array.isArray(fmTags) && fmTags.includes(tag)) return true;
            if (typeof fmTags === "string" && fmTags === tag) return true;
            if (cache.tags && cache.tags.some(t => t.tag === `#${tag}`)) return true;
            return false;
        };

        const resolveImage = (item, sourcePath) => {
            if (!item) return null;
            let rawPath = item;
            if (typeof item === "object" && item.path) rawPath = item.path;
            if (typeof rawPath !== "string") return null;
            if (rawPath.startsWith("http") || rawPath.startsWith("data:") || rawPath.startsWith("app:")) return rawPath;
            let cleanPath = rawPath;
            if (rawPath.startsWith("[[")) { cleanPath = rawPath.replace(/^\[\[|\]\]$/g, ""); if (cleanPath.includes("|")) cleanPath = cleanPath.split("|")[0]; }
            const file = app.metadataCache.getFirstLinkpathDest(cleanPath, sourcePath);
            if (file) return app.vault.adapter.getResourcePath(file.path);
            return rawPath;
        };

        const scanFiles = (tag, defaultIcon) => {
            const files = app.vault.getMarkdownFiles();
            return files
                .filter(f => { const cache = app.metadataCache.getFileCache(f); return hasTag(f, cache, tag); })
                .map(f => {
                    const cache = app.metadataCache.getFileCache(f);
                    const fm = cache?.frontmatter || {};
                    let bg = null;
                    const rawBg = fm.cover || fm.image;
                    if (rawBg) { const resolvedBg = resolveImage(rawBg, f.path); if (resolvedBg) { if (resolvedBg.startsWith("app:") || resolvedBg.startsWith("http")) { bg = `url("${resolvedBg}")`; } else { bg = resolvedBg; } } }
                    let finalIcon = defaultIcon;
                    let finalSprite = null;
                    const rawIcon = fm.icon || fm.sprite;
                    if (rawIcon) { const resolved = resolveImage(rawIcon, f.path); const isImage = resolved.startsWith("http") || resolved.startsWith("data:") || resolved.startsWith("app:") || resolved.startsWith("url("); if (isImage) { finalSprite = resolved.replace(/^url\("?|"?\)$/g, ""); } else { finalIcon = resolved; } }
                    return { label: f.basename, type: "embed", value: `![[${f.path}]]`, icon: finalIcon, sprite: finalSprite, bg: bg };
                })
                .sort((a, b) => a.label.localeCompare(b.label));
        };

        setDynamicDashboards(scanFiles("dashboards", "🖥️"));
        setDynamicCategories(scanFiles("categories", "📂"));
        setDynamicPlanners(scanFiles("planners", "📅"));
    }, []);

    const allDirectories = [
        ...DIRECTORIES, 
        { id: "dashboards", label: "Dashboards", icon: "🚀", items: dynamicDashboards.length > 0 ? dynamicDashboards : [{ label: "None found", icon: "⚠️", type: "none" }] },
        { id: "categories", label: "Categories", icon: "🗂️", items: dynamicCategories.length > 0 ? dynamicCategories : [{ label: "None found", icon: "⚠️", type: "none" }] },
        { id: "planners", label: "Planners", icon: "🗓️", items: dynamicPlanners.length > 0 ? dynamicPlanners : [{ label: "None found", icon: "⚠️", type: "none" }] }        
    ];

    const handleDirClick = (dirId) => { setActiveDir(activeDir === dirId ? null : dirId); };
    const handleAction = (item) => {
        if (!item || item.type === "none") return;
        if (item.type === "embed") { toggleDashboardEmbed(item.value); } 
        else if (item.type === "command") { app.commands.executeCommandById(item.value); new Notice(`Executed: ${item.label}`); }
    };

    const currentSubItems = activeDir ? allDirectories.find(d => d.id === activeDir)?.items || [] : [];

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${primary}22`, transition: "all 0.3s ease" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {allDirectories.map((dir) => {
                    const isActive = activeDir === dir.id;
                    if (dir.id === "dashboards" && dynamicDashboards.length === 0) return null;
                    if (dir.id === "categories" && dynamicCategories.length === 0) return null;
                    if (dir.id === "planners" && dynamicPlanners.length === 0) return null;
                    return <GloButton key={dir.id} label={dir.label} icon={dir.icon} variant={isActive ? "primary" : "ghost"} glow={isActive} onClick={() => handleDirClick(dir.id)} style={{ minWidth: "100px" }} />;
                })}
            </div>
            {activeDir && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "12px", background: hexToRgba(primary, 0.05), borderRadius: 16, border: `1px dashed ${primary}33`, animation: "fadeIn 0.2s ease-out", width: "100%", boxSizing: "border-box" }}>
                    {currentSubItems.map((item, i) => (
                        <GloButton key={i} label={item.label} icon={item.icon} bg={item.bg} sprite={item.sprite} showSprite={!!item.sprite} variant={item.bg ? "primary" : "secondary"} size="small" onClick={() => handleAction(item)} style={item.bg ? { minWidth: "120px", height: "60px", textShadow: "0 2px 4px black", color: "white", border: "1px solid rgba(255,255,255,0.2)" } : {}} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: DailyWrapper
// ═══════════════════════════════════════════════════════════════════════════════

function DailyWrapper() {
    const { theme, isLoading: themeLoading, settings: themeSettings } = useTheme();
    useComponentCSS();

    // Load installed modules from Settings.md
    const { modules: installedModules, isLoading: modulesLoading } = useInstalledModules();

    const showBackgrounds = themeSettings?.widgetBackgrounds !== false;

    const primary = theme?.["color-primary"] || "#7c3aed";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";

    const initialDate = resolveDateStr();
    const [selectedDate, setSelectedDate] = dc.useState(initialDate);
    const [activeTab, setActiveTab] = dc.useState(null);
    const [showCalendar, setShowCalendar] = dc.useState(false);
    const [lastUpdate, setLastUpdate] = dc.useState(Date.now());

    // Set initial active tab to first installed module
    dc.useEffect(() => {
        if (installedModules.length > 0 && activeTab === null) {
            setActiveTab(installedModules[0].id);
        }
    }, [installedModules, activeTab]);

    const handleDateChange = (newDate) => { setSelectedDate(newDate); setShowCalendar(false); };
    const handleReturnToToday = () => { setSelectedDate(getTodayDateStr()); };
    const handleWaterAdd = async (amount) => {
        const fm = getFrontmatterForDate(selectedDate);
        const currentWater = fm["water-ml"] || 0;
        await saveFrontmatterForDate(selectedDate, { "water-ml": currentWater + amount });
        setLastUpdate(Date.now());
        setTimeout(() => setLastUpdate(Date.now()), 600);
    };

    const handleCreateNote = async () => {
        const success = await createDailyNoteWithTemplater(selectedDate);
        if (success) { setLastUpdate(Date.now()); setTimeout(() => setLastUpdate(Date.now()), 500); }
    };

    const renderTabContent = () => {
        // Find the active tab config from installed modules
        const activeTabConfig = installedModules.find(t => t.id === activeTab);
        if (!activeTabConfig) return <div style={{ color: textMuted }}>Select a module</div>;

        // Special handling for built-in tabs (can be customized per-vault)
        switch (activeTab) {
            case "morning":
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <WidgetLoader widgetName="dc-sleepTracker" targetDate={selectedDate} theme={theme} lastUpdate={lastUpdate} />
                        <TodaysPlanViewer targetDate={selectedDate} theme={theme} />
                    </div>
                );
            case "journal":
                return <JournalTab targetDate={selectedDate} theme={theme} />;
            case "meals":
                return <MealsTab targetDate={selectedDate} theme={theme} lastUpdate={lastUpdate} />;
            case "evening":
                return <EveningTab targetDate={selectedDate} theme={theme} lastUpdate={lastUpdate} />;
            default:
                // Generic widget loader for any module with a widget defined
                if (activeTabConfig.widget) {
                    return <WidgetLoader widgetName={activeTabConfig.widget} targetDate={selectedDate} theme={theme} lastUpdate={lastUpdate} />;
                }
                return <div style={{ color: textMuted }}>No widget configured for this module</div>;
        }
    };

    if (themeLoading || modulesLoading) return <div style={{ padding: 40, textAlign: "center", color: textMuted }}>Loading Daily Wrapper...</div>;

    return (
        <div style={{ background: showBackgrounds ? surface : "transparent", border: showBackgrounds ? `1px solid ${primary}33` : "none", borderRadius: 16, padding: 16, color: text, position: "relative" }}>
            <DateNavigation selectedDate={selectedDate} onDateChange={handleDateChange} onCalendarOpen={() => setShowCalendar(!showCalendar)} theme={theme} />
            <CalendarPopup isOpen={showCalendar} selectedDate={selectedDate} onSelectDate={handleDateChange} onClose={() => setShowCalendar(false)} style={{ top: 60, left: "50%", transform: "translateX(-50%)" }} />
            <MissingNoteBanner key={lastUpdate} selectedDate={selectedDate} onCreate={handleCreateNote} theme={theme} lastUpdate={lastUpdate} />
            {dateNoteExists(selectedDate) && <PastDayBanner selectedDate={selectedDate} onReturnToToday={handleReturnToToday} theme={theme} />}
            {dateNoteExists(selectedDate) ? (
                <>
                    <QuickStatsBar selectedDate={selectedDate} onWaterAdd={handleWaterAdd} theme={theme} showBackgrounds={showBackgrounds} lastUpdate={lastUpdate} />
                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} theme={theme} showBackgrounds={showBackgrounds} tabs={installedModules} />
                    <div style={{ minHeight: 300 }}>{renderTabContent()}</div>
                </>
            ) : (
                <div style={{ padding: 40, textAlign: "center", color: theme?.["color-text-muted"], fontStyle: "italic" }}>Create the daily note to start tracking.</div>
            )}
            <BottomViewBar theme={theme} />
        </div>
    );
}

return { DailyWrapper, Func: DailyWrapper };