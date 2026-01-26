// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC COURSEWORK VIEW
// Features: QuickNav, Frontmatter Editor for Status, Due Dates, and Grades
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { GloButton, GloBadge, useComponentCSS, hexToRgba } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloButton.jsx"));

// ─────────────────────────────────────────────────────────────────────────────
// QUICK NAV COMPONENT (Enhanced with tabs like classView)
// ─────────────────────────────────────────────────────────────────────────────
function QuickNav({ currentPath, linkedClassPath, linkedClassName, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const pages = dc.useQuery("@page");

    // Helper to get field from raw page
    const getPageField = (p, field) => {
        if (p.value) {
            try {
                const val = p.value(field);
                if (val !== undefined && val !== null) return String(val);
            } catch (e) { /* ignore */ }
        }
        if (p[field] !== undefined && p[field] !== null) {
            return String(p[field]);
        }
        return "";
    };

    // Helper to check categories
    const hasCategory = (p, category) => {
        const cats = p.value ? p.value("categories") : p.categories;
        const catsStr = cats ? String(cats) : "";
        return catsStr.includes(category);
    };

    // Helper to extract file info from datacore page
    const getFileInfo = (p) => {
        let path = p.$path || p.file?.path || p.path || "";
        let name = p.file?.name?.replace(".md", "") || p.name || "";
        if (!name && path) {
            name = path.split("/").pop()?.replace(".md", "") || "";
        }
        return { path, name };
    };

    // Helper to get class link value from a page (handles link objects)
    const getClassLink = (p) => {
        const rawClass = p.value ? p.value("class") : p.class;
        if (!rawClass) return { path: "", name: "" };

        if (typeof rawClass === "object") {
            return {
                path: rawClass.path || "",
                name: rawClass.display || rawClass.path?.split("/").pop()?.replace(".md", "") || ""
            };
        }
        const str = String(rawClass).replace(/[\[\]]/g, "").trim();
        return { path: str, name: str };
    };

    // Find the class page
    const classInfo = dc.useMemo(() => {
        if (!linkedClassPath && !linkedClassName) return null;

        // Try to find the class page by path or name
        const classPage = pages.find(p => {
            const fileInfo = getFileInfo(p);
            const cats = getPageField(p, "categories");

            // Must be a class
            if (!cats.includes("Class")) return false;

            // Match by exact path
            if (linkedClassPath && fileInfo.path === linkedClassPath) return true;

            // Match by file name
            if (linkedClassName && fileInfo.name === linkedClassName) return true;

            // Match by course code
            const pageCode = getPageField(p, "course-code");
            if (pageCode && linkedClassName && linkedClassName.includes(pageCode)) return true;

            return false;
        });

        if (classPage) {
            const fileInfo = getFileInfo(classPage);
            return {
                path: fileInfo.path,
                name: fileInfo.name,
                code: getPageField(classPage, "course-code")
            };
        }

        // Fallback - use provided info
        return {
            path: linkedClassPath || null,
            name: linkedClassName || null,
            code: null
        };
    }, [linkedClassPath, linkedClassName, pages]);

    // Get all coursework for this class, grouped by type
    const coursework = dc.useMemo(() => {
        if (!classInfo?.path && !classInfo?.name) {
            return { assignments: [], exams: [], lectures: [] };
        }

        const classItems = pages.filter(p => {
            const cats = getPageField(p, "categories");
            if (!cats.includes("Coursework") && !hasCategory(p, "Lecture")) return false;

            // Get the class link from this coursework item
            const itemClass = getClassLink(p);

            // Match by path (most reliable)
            if (classInfo.path && itemClass.path) {
                if (itemClass.path === classInfo.path) return true;
                if (itemClass.path.includes(classInfo.path) || classInfo.path.includes(itemClass.path)) return true;
            }

            // Match by name
            if (classInfo.name && itemClass.name) {
                if (itemClass.name === classInfo.name) return true;
                if (itemClass.name.includes(classInfo.name) || classInfo.name.includes(itemClass.name)) return true;
            }

            // Match by course code
            if (classInfo.code && itemClass.name) {
                if (itemClass.name.includes(classInfo.code)) return true;
            }

            return false;
        }).map(p => {
            const fileInfo = getFileInfo(p);
            return {
                path: fileInfo.path,
                name: fileInfo.name,
                type: getPageField(p, "type").toLowerCase(),
                isCurrent: fileInfo.path === currentPath
            };
        });

        const assignments = classItems.filter(p =>
            ["assignment", "project", "essay", "quiz", "reading"].includes(p.type)
        );
        const exams = classItems.filter(p => p.type === "exam");
        const lectures = classItems.filter(p =>
            p.type === "note" || p.type === "lecture"
        );

        return { assignments, exams, lectures };
    }, [pages, classInfo, currentPath]);

    const [activeSection, setActiveSection] = dc.useState(null);

    const openFile = (path) => {
        if (path) app.workspace.openLinkText(path, "", false);
    };

    const openDashboard = () => {
        app.workspace.openLinkText("System/Dashboards/Academic Dashboard.md", "", false);
    };

    const openClass = () => {
        if (classInfo?.path) app.workspace.openLinkText(classInfo.path, "", false);
        else new Notice("No class linked");
    };

    const navItems = [
        { id: "dashboard", icon: "🏠", label: "Dashboard", action: openDashboard },
        { id: "class", icon: "📚", label: classInfo?.code || classInfo?.name || "Class", action: openClass, highlight: true },
        { id: "assignments", icon: "📝", label: `Assignments (${coursework.assignments.length})`, items: coursework.assignments },
        { id: "exams", icon: "⚡", label: `Exams (${coursework.exams.length})`, items: coursework.exams },
        { id: "lectures", icon: "🎙️", label: `Lectures (${coursework.lectures.length})`, items: coursework.lectures },
    ];

    return (
        <div style={{ marginBottom: 16 }}>
            {/* Nav Bar */}
            <div style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                padding: "8px 12px",
                background: hexToRgba(primary, 0.08),
                borderRadius: 10,
                border: `1px solid ${primary}22`
            }}>
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => item.action ? item.action() : setActiveSection(activeSection === item.id ? null : item.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            background: activeSection === item.id ? primary : item.highlight ? hexToRgba(primary, 0.15) : "transparent",
                            border: "none",
                            borderRadius: 6,
                            color: activeSection === item.id ? "#fff" : item.highlight ? primary : textMuted,
                            fontSize: 12,
                            fontWeight: item.highlight ? 600 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                        }}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Dropdown Panel */}
            {activeSection && !["dashboard", "class"].includes(activeSection) && (
                <div style={{
                    marginTop: 8,
                    padding: 12,
                    background: hexToRgba(primary, 0.05),
                    borderRadius: 10,
                    border: `1px dashed ${primary}33`,
                    maxHeight: 200,
                    overflowY: "auto"
                }}>
                    {navItems.find(n => n.id === activeSection)?.items?.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {navItems.find(n => n.id === activeSection).items.map((item, i) => (
                                <div
                                    key={item.path || i}
                                    onClick={() => openFile(item.path)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 12px",
                                        background: item.isCurrent ? hexToRgba(primary, 0.2) : "rgba(255,255,255,0.03)",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        borderLeft: item.isCurrent ? `3px solid ${primary}` : "3px solid transparent"
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>{item.name}</span>
                                    {item.isCurrent && <span style={{ fontSize: 10, color: primary }}>Current</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", color: textMuted, fontSize: 12, padding: 20 }}>
                            No items found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA HOOK (Uses dc.useCurrentFile for embedded context)
// ─────────────────────────────────────────────────────────────────────────────
function useCourseworkData() {
    const [revision, setRevision] = dc.useState(0);

    // Use Datacore's current file context (works correctly in embeds)
    const currentFile = dc.useCurrentFile();
    const currentPath = currentFile?.$path || currentFile?.path || "";

    // Get frontmatter from Datacore current file or fallback to metadata cache
    const liveFm = dc.useMemo(() => {
        // First try to get values from Datacore's current file
        if (currentFile?.value) {
            return {
                class: currentFile.value("class"),
                type: currentFile.value("type"),
                status: currentFile.value("status"),
                priority: currentFile.value("priority"),
                due: currentFile.value("due"),
                grade: currentFile.value("grade"),
                categories: currentFile.value("categories")
            };
        }

        // Fallback to metadata cache
        if (!currentPath) return {};
        const file = app.vault.getAbstractFileByPath(currentPath);
        if (!file) return {};
        const cache = app.metadataCache.getFileCache(file);
        return cache?.frontmatter || {};
    }, [currentFile, currentPath, revision]);

    // Listen for metadata changes
    dc.useEffect(() => {
        if (!currentPath) return;

        const handleChange = (file) => {
            if (file.path === currentPath) {
                setRevision(r => r + 1);
            }
        };

        const eventRef = app.metadataCache.on("changed", handleChange);

        // Initial bump to ensure we read cache
        const timer = setTimeout(() => setRevision(r => r + 1), 100);

        return () => {
            app.metadataCache.offref(eventRef);
            clearTimeout(timer);
        };
    }, [currentPath]);

    return { currentPath, liveFm };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Edit Field (Improved value sync)
// ─────────────────────────────────────────────────────────────────────────────
function EditField({ label, value, fieldKey, targetPath, type = "text", options = [], theme }) {
    const formatValue = (val, fieldType) => {
        if (val === undefined || val === null) return "";

        // Handle arrays
        if (Array.isArray(val)) val = val[0] || "";

        // Handle wiki links
        if (typeof val === "string" && val.startsWith("[[") && val.endsWith("]]")) {
            return val.slice(2, -2);
        }

        // Handle date objects or date strings for date inputs
        if (fieldType === "date") {
            // Handle JavaScript Date objects
            if (val instanceof Date) {
                return val.toISOString().split("T")[0];
            }
            // Handle Luxon DateTime objects (datacore uses these)
            if (val && typeof val === "object" && typeof val.toISODate === "function") {
                return val.toISODate();
            }
            // Handle objects with toISO method
            if (val && typeof val === "object" && typeof val.toISO === "function") {
                return val.toISO().split("T")[0];
            }
            // Handle string with T (ISO format)
            if (typeof val === "string" && val.includes("T")) {
                return val.split("T")[0];
            }
            // Already YYYY-MM-DD format
            if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                return val;
            }
            // Try to parse other date formats
            if (typeof val === "string" && val.trim()) {
                try {
                    const parsed = new Date(val);
                    if (!isNaN(parsed.getTime())) {
                        return parsed.toISOString().split("T")[0];
                    }
                } catch (e) { /* ignore */ }
            }
        }

        return String(val);
    };

    const safeValue = formatValue(value, type);
    const [localValue, setLocalValue] = dc.useState(safeValue);

    // Always sync when external value changes
    dc.useEffect(() => {
        const newVal = formatValue(value, type);
        setLocalValue(newVal);
    }, [value, type]);

    const handleSave = async (val) => {
        const file = app.vault.getAbstractFileByPath(targetPath);
        if (!file) { new Notice("File not found"); return; }
        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm[fieldKey] = val;
            });
        } catch (e) { console.error(e); }
    };

    const style = {
        background: "rgba(0,0,0,0.2)",
        border: `1px solid ${theme?.["color-primary"] || "#7c3aed"}33`,
        borderRadius: 4,
        color: theme?.["color-text"] || "#fff",
        padding: "4px 8px",
        width: "100%",
        fontSize: "13px",
        outline: "none"
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: "120px" }}>
            <label style={{ fontSize: "11px", color: theme?.["color-text-muted"], textTransform: "uppercase", fontWeight: 600 }}>{label}</label>
            {type === "select" ? (
                <select
                    value={localValue}
                    onChange={(e) => { setLocalValue(e.target.value); handleSave(e.target.value); }}
                    style={{ ...style, cursor: "pointer" }}
                >
                    <option value="">—</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input
                    type={type}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => handleSave(localValue)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }}
                    style={style}
                    placeholder="—"
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Status Badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, due, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const success = theme?.["color-success"] || "#10b981";
    const warning = theme?.["color-orange"] || "#f59e0b";
    const error = theme?.["color-red"] || "#ef4444";

    let color = primary;
    let label = status || "—";

    if (status === "done" || status === "completed" || status === "graded") {
        color = success;
    } else if (status === "submitted") {
        color = "#3b82f6";
    } else if (status === "in-progress") {
        color = warning;
    } else if (status === "todo") {
        // Check if overdue
        if (due) {
            const dueDate = new Date(due);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dueDate < today) {
                color = error;
                label = "Overdue";
            }
        }
    }

    return (
        <span style={{
            padding: "4px 10px",
            background: hexToRgba(color, 0.15),
            color: color,
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase"
        }}>
            {label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Header & Controls
// ─────────────────────────────────────────────────────────────────────────────
function CourseworkControls({ liveFm, targetPath, theme }) {
    const fm = liveFm || {};
    const primary = theme?.["color-primary"] || "#7c3aed";

    const getTypeIcon = (type) => {
        switch(type) {
            case "exam": return "⚡";
            case "note": case "lecture": return "🎙️";
            case "project": return "🚀";
            case "quiz": return "❓";
            case "reading": return "📖";
            case "essay": return "✍️";
            default: return "📝";
        }
    };

    return (
        <div style={{ marginBottom: 20 }}>
            {/* Header / Banner */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: hexToRgba(primary, 0.1),
                borderRadius: "12px 12px 0 0", border: `1px solid ${primary}44`, borderBottom: "none"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "20px" }}>{getTypeIcon(fm.type)}</span>
                    <span style={{ fontWeight: "bold", color: primary, textTransform: "uppercase", fontSize: "12px" }}>
                        {fm.type || "Coursework"}
                    </span>
                    <StatusBadge status={fm.status} due={fm.due} theme={theme} />
                </div>
                {fm.grade && (
                    <div style={{
                        padding: "6px 14px",
                        background: hexToRgba(theme?.["color-success"] || "#10b981", 0.2),
                        color: theme?.["color-success"] || "#10b981",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 16
                    }}>
                        {fm.grade}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{
                display: "flex", flexWrap: "wrap", gap: 12, padding: 16,
                background: "rgba(255,255,255,0.03)", borderRadius: "0 0 12px 12px",
                border: `1px solid ${primary}44`
            }}>
                <EditField label="Due Date" value={fm.due} fieldKey="due" targetPath={targetPath} type="date" theme={theme} />
                <EditField label="Status" value={fm.status} fieldKey="status" targetPath={targetPath} type="select" options={["none", "todo", "in-progress", "submitted", "graded", "done"]} theme={theme} />
                <EditField label="Priority" value={fm.priority} fieldKey="priority" targetPath={targetPath} type="select" options={["low", "normal", "high"]} theme={theme} />
                <EditField label="Grade" value={fm.grade} fieldKey="grade" targetPath={targetPath} theme={theme} />
                <EditField label="Type" value={fm.type} fieldKey="type" targetPath={targetPath} type="select" options={["assignment", "exam", "project", "quiz", "reading", "essay"]} theme={theme} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function CourseworkView() {
    const { theme } = useTheme();
    const { currentPath, liveFm } = useCourseworkData();
    useComponentCSS();

    // Handle class field - could be wiki link string "[[Class Name]]", plain text, or datacore link object
    const rawClass = liveFm?.class;
    let linkedClassPath = "";
    let linkedClassName = "";

    if (rawClass) {
        if (typeof rawClass === "object") {
            // Datacore link object
            linkedClassPath = rawClass.path || "";
            linkedClassName = rawClass.display || rawClass.path?.split("/").pop()?.replace(".md", "") || "";
        } else {
            // String - could be wiki link or plain text
            const str = String(rawClass);
            linkedClassName = str.replace(/[\[\]]/g, "").trim();
            linkedClassPath = linkedClassName; // Will be resolved in QuickNav
        }
    }

    return (
        <div style={{ padding: "10px 0" }}>
            <QuickNav
                currentPath={currentPath}
                linkedClassPath={linkedClassPath}
                linkedClassName={linkedClassName}
                theme={theme}
            />
            <CourseworkControls
                liveFm={liveFm}
                targetPath={currentPath}
                theme={theme}
            />
        </div>
    );
}

return { CourseworkView, Func: CourseworkView };
