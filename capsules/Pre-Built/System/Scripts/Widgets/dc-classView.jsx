// System/Scripts/Widgets/dc-classView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC CLASS VIEW
// Features: QuickNav, Frontmatter Editor, GPA Calculator, Coursework Lists
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { GloButton, GloBar, useComponentCSS, hexToRgba } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloButton.jsx"));

// ─────────────────────────────────────────────────────────────────────────────
// QUICK NAV COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function QuickNav({ currentPath, courseCode, fileName, courseworkData, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const pages = dc.useQuery("@page");

    // Helper to check categories
    const hasCategory = (p, category) => {
        const cats = p.value ? p.value("categories") : p.categories;
        const catsStr = cats ? String(cats) : "";
        return catsStr.includes(category);
    };

    // Helper to get field value (handles both raw pages and pre-processed objects)
    const getField = (p, field) => {
        // For pre-processed items, prefer direct properties first
        if (p[field] !== undefined && p[field] !== null) {
            return String(p[field]);
        }
        // Fall back to value() method for raw page objects
        if (p.value) {
            try {
                const val = p.value(field);
                if (val !== undefined && val !== null) {
                    return String(val);
                }
            } catch (e) { /* ignore */ }
        }
        return "";
    };

    // Helper to extract file info from datacore page
    const getFileInfo = (p) => {
        let path = p.$path || p.file?.path || p.path || "";
        let name = p.file?.name?.replace(".md", "") || p.name || "";
        if (!name && path) {
            name = path.split("/").pop()?.replace(".md", "") || "Untitled";
        }
        return { path, name: name || "Untitled" };
    };

    // Get all classes
    const classes = dc.useMemo(() => {
        return pages.filter(p => hasCategory(p, "Class")).map(p => {
            const code = getField(p, "course-code");
            const fileInfo = getFileInfo(p);
            return {
                path: fileInfo.path,
                name: fileInfo.name,
                code: code || fileInfo.name,
                isCurrent: fileInfo.path === currentPath
            };
        });
    }, [pages, currentPath]);

    // Use coursework data passed from parent (already filtered)
    const coursework = dc.useMemo(() => {
        const items = courseworkData || [];

        const assignments = items.filter(p => {
            const type = getField(p, "type").toLowerCase();
            return ["assignment", "project", "essay", "quiz", "reading"].includes(type);
        });

        const exams = items.filter(p => {
            const type = getField(p, "type").toLowerCase();
            return type === "exam";
        });

        const lectures = items.filter(p => {
            const type = getField(p, "type").toLowerCase();
            return hasCategory(p, "Lecture") || type === "note" || type === "lecture";
        });

        return { assignments, exams, lectures };
    }, [courseworkData]);

    const [activeSection, setActiveSection] = dc.useState(null);

    const openFile = (path) => {
        if (path) app.workspace.openLinkText(path, "", false);
    };

    const openDashboard = () => {
        const dashboardPath = "System/Dashboards/Academic Dashboard.md";
        app.workspace.openLinkText(dashboardPath, "", false);
    };

    const navItems = [
        { id: "dashboard", icon: "🏠", label: "Dashboard", action: openDashboard },
        { id: "classes", icon: "📚", label: `Classes (${classes.length})`, items: classes },
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
                            background: activeSection === item.id ? primary : "transparent",
                            border: "none",
                            borderRadius: 6,
                            color: activeSection === item.id ? "#fff" : textMuted,
                            fontSize: 12,
                            fontWeight: 500,
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
            {activeSection && activeSection !== "dashboard" && (
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
                            {navItems.find(n => n.id === activeSection).items.map((item, i) => {
                                // Handle both class items (path/name) and coursework items (filePath/fileName)
                                const itemPath = item.path || item.filePath || "";
                                const itemName = item.name || item.fileName || "Untitled";

                                return (
                                    <div
                                        key={itemPath || i}
                                        onClick={() => openFile(itemPath)}
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
                                        <span style={{ fontSize: 13 }}>
                                            {itemName}
                                        </span>
                                        {item.code && <span style={{ fontSize: 11, color: textMuted }}>{item.code}</span>}
                                        {item.due && <span style={{ fontSize: 11, color: textMuted }}>{item.due}</span>}
                                    </div>
                                );
                            })}
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
function useClassData() {
    const pages = dc.useQuery("@page");
    const [revision, setRevision] = dc.useState(0);

    // Use Datacore's current file context (works correctly in embeds)
    const currentFile = dc.useCurrentFile();
    const currentPath = currentFile?.$path || currentFile?.path || "";

    // Get frontmatter from Datacore current file or fallback to metadata cache
    const liveFm = dc.useMemo(() => {
        // First try to get values from Datacore's current file
        if (currentFile?.value) {
            return {
                "course-code": currentFile.value("course-code"),
                "course-name": currentFile.value("course-name"),
                instructor: currentFile.value("instructor"),
                semester: currentFile.value("semester"),
                credits: currentFile.value("credits"),
                status: currentFile.value("status"),
                grade: currentFile.value("grade"),
                term: currentFile.value("term")
            };
        }

        // Fallback to metadata cache
        if (!currentPath) return {};
        const file = app.vault.getAbstractFileByPath(currentPath);
        if (!file) return {};
        const cache = app.metadataCache.getFileCache(file);
        return cache?.frontmatter || {};
    }, [currentFile, currentPath, revision]);

    const courseCode = liveFm["course-code"] || "";
    const fileName = currentPath.split("/").pop()?.replace(".md", "") || "";

    // Listen for metadata changes to trigger re-render
    dc.useEffect(() => {
        if (!currentPath) return;

        const handleChange = (f) => {
            if (f.path === currentPath) {
                setRevision(r => r + 1);
            }
        };

        const eventRef = app.metadataCache.on("changed", handleChange);

        // Initial trigger to ensure we read cached data on mount
        const timer = setTimeout(() => setRevision(r => r + 1), 50);

        return () => {
            app.metadataCache.offref(eventRef);
            clearTimeout(timer);
        };
    }, [currentPath]);

    // Force re-computation when revision changes
    const _ = revision;

    // Helper to check if a string contains a value (handles wiki links)
    const containsValue = (field, searchValue) => {
        if (!field || !searchValue) return false;
        const str = String(field);
        // Check for wiki link format [[value]] or plain value
        return str.includes(searchValue) || str.includes(`[[${searchValue}]]`);
    };

    // Filter coursework linked to this class
    const coursework = pages.filter(p => {
        // Check categories contains Coursework
        const cats = p.value ? p.value("categories") : p.categories;
        const catsStr = cats ? String(cats) : "";
        if (!catsStr.includes("Coursework")) return false;

        // Check class link matches this class
        const classField = p.value ? p.value("class") : p.class;
        const classStr = classField ? String(classField) : "";

        // Match by course code, file name, or path
        const matchesCourseCode = courseCode && containsValue(classStr, courseCode);
        const matchesFileName = fileName && containsValue(classStr, fileName);
        const matchesPath = currentPath && classStr.includes(currentPath);

        return matchesCourseCode || matchesFileName || matchesPath;
    }).map(w => {
        const dueVal = w.value ? w.value("due") : w.due;
        const statusVal = w.value ? w.value("status") : w.status;
        const gradeVal = w.value ? w.value("grade") : w.grade;
        const typeVal = w.value ? w.value("type") : w.type;

        // Handle Luxon DateTime for due date
        let dueDate = null;
        if (dueVal) {
            if (dueVal instanceof Date) {
                dueDate = dueVal;
            } else if (typeof dueVal === "object" && typeof dueVal.toJSDate === "function") {
                dueDate = dueVal.toJSDate();
            } else if (typeof dueVal === "string") {
                dueDate = new Date(dueVal);
            }
        }

        const isCompleted = ["graded", "completed", "submitted", "done"].some(s =>
            statusVal && String(statusVal).toLowerCase().includes(s)
        );

        // Explicitly extract file info (spread doesn't preserve datacore getters)
        const filePath = w.$path || w.file?.path || w.path || "";
        let fileName = w.file?.name?.replace(".md", "") || w.name || "";
        if (!fileName && filePath) {
            fileName = filePath.split("/").pop()?.replace(".md", "") || "Untitled";
        }

        return {
            filePath,
            fileName: fileName || "Untitled",
            dueDate,
            isCompleted,
            due: dueVal,
            status: statusVal,
            grade: gradeVal,
            type: typeVal
        };
    });

    const upcoming = coursework.filter(w => !w.isCompleted && w.dueDate).sort((a, b) => a.dueDate - b.dueDate);
    const graded = coursework.filter(w => w.grade).sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0));

    const gradeMap = { "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D": 1.0, "F": 0.0 };
    let count = 0; let totalPoints = 0;
    graded.forEach(w => {
        const g = String(w.grade).trim().toUpperCase();
        if (gradeMap[g] !== undefined) { totalPoints += gradeMap[g]; count++; }
    });
    const gpa = count > 0 ? (totalPoints / count).toFixed(2) : "—";

    return { currentPath, liveFm, courseCode, fileName, upcoming, graded, gpa, gradeCount: count, coursework };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Frontmatter Editor
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
        if (!file) { new Notice("File not found to save"); return; }
        try {
            await app.fileManager.processFrontMatter(file, (fm) => { fm[fieldKey] = val; });
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

function CourseInfoEditor({ liveFm, targetPath, theme }) {
    const fm = liveFm || {};
    const primary = theme?.["color-primary"] || "#7c3aed";

    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            marginBottom: 20,
            border: `1px dashed ${primary}44`
        }}>
            <EditField label="Course Code" value={fm["course-code"]} fieldKey="course-code" targetPath={targetPath} theme={theme} />
            <EditField label="Instructor" value={fm.instructor} fieldKey="instructor" targetPath={targetPath} theme={theme} />
            <EditField label="Semester" value={fm.semester} fieldKey="semester" targetPath={targetPath} theme={theme} />
            <EditField label="Credits" value={fm.credits} fieldKey="credits" type="number" targetPath={targetPath} theme={theme} />
            <EditField label="Status" value={fm.status} fieldKey="status" type="select" options={["open", "active", "in-progress", "completed", "dropped"]} targetPath={targetPath} theme={theme} />
            <EditField label="Final Grade" value={fm.grade} fieldKey="grade" targetPath={targetPath} theme={theme} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function QuickActions({ courseCode, theme }) {
    const getClassFolder = () => {
        if (!courseCode) return app.vault.getRoot();
        const files = app.vault.getMarkdownFiles();
        const classFile = files.find(f => {
            const cache = app.metadataCache.getFileCache(f);
            return cache?.frontmatter?.["course-code"] === courseCode;
        });
        if (classFile && classFile.parent) return classFile.parent;
        return app.vault.getRoot();
    };

    const createNote = async (templateName, suffix) => {
        const templater = app.plugins.plugins["templater-obsidian"];
        if (!templater) { new Notice("Templater not found"); return; }

        const templateFile = app.vault.getAbstractFileByPath(`System/Templates/${templateName}`);
        if (!templateFile) { new Notice("Template missing"); return; }

        const targetFolder = getClassFolder();
        const finalName = `${courseCode} ${suffix} ${window.moment().format("MM-DD")}`;

        try {
            await templater.templater.create_new_note_from_template(templateFile, targetFolder, finalName, true);
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <GloButton label="Assignment" icon="📝" variant="primary" onClick={() => createNote("Coursework Template.md", "Assignment")} />
            <GloButton label="Exam" icon="⚡" variant="secondary" onClick={() => createNote("Coursework Template.md", "Exam")} />
            <GloButton label="Project" icon="🚀" variant="secondary" onClick={() => createNote("Coursework Template.md", "Project")} />
            <GloButton label="Lecture Note" icon="🎙️" variant="ghost" onClick={() => createNote("Lecture Notes Template.md", "Lecture")} />
        </div>
    );
}

function DeadlineRow({ item, theme, onEmbed }) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = item.dueDate ? Math.ceil((item.dueDate - today) / (1000 * 60 * 60 * 24)) : 999;
    let color = theme?.["color-text-muted"];
    let statusText = "Upcoming";
    if (diffDays < 0) { color = theme?.["color-red"] || "#ef4444"; statusText = "Overdue"; }
    else if (diffDays === 0) { color = theme?.["color-orange"] || "#f59e0b"; statusText = "Today"; }
    else if (diffDays <= 3) { color = theme?.["color-orange"] || "#f59e0b"; statusText = `${diffDays} days`; }
    else { color = theme?.["color-success"] || "#10b981"; statusText = `${diffDays} days`; }

    const handleCheck = async (e) => {
        e.stopPropagation();
        const file = app.vault.getAbstractFileByPath(item.filePath);
        if(!file) return;
        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm.status = "done";
            });
            new Notice("Task Completed!");
        } catch(e) { console.error(e); }
    };

    return (
        <div
            onClick={() => onEmbed(item.filePath)}
            style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "rgba(255,255,255,0.03)",
                borderRadius: 6, marginBottom: 6, cursor: "pointer",
                borderLeft: `3px solid ${color}`
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                    type="checkbox"
                    onClick={handleCheck}
                    style={{ cursor: "pointer", transform: "scale(1.1)" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{item.type === 'exam' ? '⚡' : '📄'}</span>
                    <span style={{ fontSize: "13px" }}>{item.fileName}</span>
                </div>
            </div>
            <span style={{ fontSize: "11px", color: color, fontWeight: 600 }}>{statusText}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ClassView() {
    const { theme } = useTheme();
    const data = useClassData();
    useComponentCSS();

    const primary = theme?.["color-primary"] || "#7c3aed";

    const toggleEmbed = async (embedPath) => {
        if (!embedPath) return;
        const embedLink = `![[${embedPath}]]`;
        const file = app.vault.getAbstractFileByPath(data.currentPath);
        if (!file) return;

        try {
            const content = await app.vault.read(file);
            const lines = content.split("\n");

            let blockEndIndex = -1;
            let insideBlock = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith("```")) {
                    if (insideBlock) { blockEndIndex = i; break; }
                    else insideBlock = true;
                }
            }
            if (blockEndIndex === -1) blockEndIndex = lines.length - 1;

            let existingEmbedIndex = -1;
            for (let i = blockEndIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith("![[") && line.endsWith("]]")) {
                    existingEmbedIndex = i;
                    break;
                }
            }

            if (existingEmbedIndex !== -1) {
                const currentEmbed = lines[existingEmbedIndex].trim();
                if (currentEmbed === embedLink) lines.splice(existingEmbedIndex, 1);
                else lines[existingEmbedIndex] = embedLink;
            } else {
                if (lines[blockEndIndex + 1] !== "") lines.splice(blockEndIndex + 1, 0, "", embedLink);
                else lines.splice(blockEndIndex + 1, 0, embedLink);
            }

            await app.vault.modify(file, lines.join("\n"));
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ padding: "10px" }}>
            <QuickNav currentPath={data.currentPath} courseCode={data.courseCode} fileName={data.fileName} courseworkData={data.coursework} theme={theme} />

            <CourseInfoEditor liveFm={data.liveFm} targetPath={data.currentPath} theme={theme} />

            <div style={{ display: "flex", gap: 20, marginBottom: 20, padding: 15, background: hexToRgba(primary, 0.1), borderRadius: 12, border: `1px solid ${primary}33` }}>
                <div>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: primary, fontWeight: 700 }}>Current GPA</div>
                    <div style={{ fontSize: "24px", fontWeight: 800 }}>{data.gpa}</div>
                </div>
                <div style={{ borderLeft: `1px solid ${primary}33`, paddingLeft: 20 }}>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: theme?.["color-text-muted"], fontWeight: 700 }}>Graded</div>
                    <div style={{ fontSize: "24px", fontWeight: 800 }}>{data.gradeCount}</div>
                </div>
                <div style={{ borderLeft: `1px solid ${primary}33`, paddingLeft: 20 }}>
                     <div style={{ fontSize: "11px", textTransform: "uppercase", color: theme?.["color-text-muted"], fontWeight: 700 }}>Pending</div>
                    <div style={{ fontSize: "24px", fontWeight: 800 }}>{data.upcoming.length}</div>
                </div>
            </div>

            <QuickActions courseCode={data.courseCode} theme={theme} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {/* Upcoming */}
                <div>
                    <h4 style={{ borderBottom: `1px solid ${primary}44`, paddingBottom: 8, marginBottom: 12 }}>🔥 Upcoming</h4>
                    {data.upcoming.length > 0 ? (
                        data.upcoming.map(item => <DeadlineRow key={item.filePath} item={item} theme={theme} onEmbed={toggleEmbed} />)
                    ) : (
                        <div style={{ fontStyle: "italic", color: theme?.["color-text-muted"], fontSize: 13 }}>No pending assignments.</div>
                    )}
                </div>

                {/* Grades */}
                <div>
                    <h4 style={{ borderBottom: `1px solid ${primary}44`, paddingBottom: 8, marginBottom: 12 }}>📊 Graded</h4>
                    {data.graded.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {data.graded.map(item => (
                                <div key={item.filePath} onClick={() => toggleEmbed(item.filePath)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, cursor: "pointer" }}>
                                    <span>{item.fileName}</span>
                                    <span style={{ fontWeight: "bold", color: theme?.["color-success"] }}>{item.grade}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontStyle: "italic", color: theme?.["color-text-muted"], fontSize: 13 }}>No grades yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

return { ClassView, Func: ClassView };
