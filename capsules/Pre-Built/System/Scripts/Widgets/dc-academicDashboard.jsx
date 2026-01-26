// System/Scripts/Widgets/dc-academicDashboard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC DASHBOARD (View Navigation Update)
// Features: TaskNotes Integration, "Active/Open" Logic, Bottom Bar Navigation
// ═══════════════════════════════════════════════════════════════════════════════

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { GloButton, useComponentCSS } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloButton.jsx"));
const { GloBar } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloBar.jsx"));
const { GloCard } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloCard.jsx"));

// ─────────────────────────────────────────────────────────────────────────────
// DATA HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useAcademicData() {
    const pages = dc.useQuery("@page");
    
    return dc.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const getValue = (p, key) => {
            if (typeof p.value === "function") {
                const val = p.value(key);
                if (val !== undefined && val !== null) return val;
            }
            if (p[key] !== undefined) return p[key];
            if (p.frontmatter && p.frontmatter[key] !== undefined) return p.frontmatter[key];
            return null;
        };

        const hasValue = (p, key, searchText) => {
            const val = getValue(p, key);
            if (!val) return false;
            const search = searchText.toLowerCase();
            const values = Array.isArray(val) ? val : [val];
            return values.some(v => {
                if (!v) return false;
                if (typeof v === 'object' && v.path) return v.path.toLowerCase().includes(search);
                return String(v).toLowerCase().includes(search);
            });
        };

        const getFileData = (p) => {
            let path = "";
            let name = "";
            let ctime = null;
            if (p.$path) path = p.$path;
            if (!path && p.file?.path) path = p.file.path;
            if (!path && p.path) path = p.path;
            if (p.file?.name) name = p.file.name;
            else if (p.name) name = p.name;
            else if (path) name = path.split("/").pop().replace(".md", "");
            else name = "Untitled";
            if (p.file?.ctime) ctime = p.file.ctime;
            else if (p.ctime) ctime = p.ctime;
            return { name, path, ctime };
        };

        // --- UPDATED CLASS LOGIC (Active/Open Filter) ---
        const classes = pages.filter(p =>
            hasValue(p, "categories", "Classes") ||
            hasValue(p, "tags", "class")
        ).map(c => {
            const file = getFileData(c);
            // Accepts 'active' OR 'open' as an active status
            const isActive = hasValue(c, "status", "active") || hasValue(c, "status", "open");
            const code = getValue(c, "course-code");
            return {
                file,
                isActive,
                courseCode: code || file.name,
                term: getValue(c, "term")
            };
        });

        // --- TERM MANAGEMENT ---
        const terms = pages.filter(p => hasValue(p, "tags", "term")).map(t => {
            const file = getFileData(t);
            const startVal = getValue(t, "start");
            const endVal = getValue(t, "end");
            let startDate = null, endDate = null;
            if (startVal) {
                startDate = startVal instanceof Date ? startVal :
                    startVal.toJSDate ? startVal.toJSDate() : new Date(startVal);
            }
            if (endVal) {
                endDate = endVal instanceof Date ? endVal :
                    endVal.toJSDate ? endVal.toJSDate() : new Date(endVal);
            }
            const isActive = hasValue(t, "status", "active") || hasValue(t, "status", "open");
            const isCurrent = startDate && endDate && today >= startDate && today <= endDate;
            return { file, startDate, endDate, isActive, isCurrent };
        });

        // Group classes by term
        const termClassMap = {};
        terms.forEach(term => {
            const termName = term.file.name.toLowerCase();
            termClassMap[term.file.path] = classes.filter(c => {
                const classTermVal = c.term;
                if (!classTermVal) return false;
                const termStr = typeof classTermVal === 'object' && classTermVal.path
                    ? classTermVal.path.toLowerCase()
                    : String(classTermVal).toLowerCase();
                return termStr.includes(termName) || termStr.includes(term.file.path.toLowerCase().replace(".md", ""));
            });
        });

        const activeTerms = terms.filter(t => t.isActive || t.isCurrent);

        const coursework = pages.filter(p => 
            hasValue(p, "categories", "Coursework")
        ).map(w => {
            const file = getFileData(w);
            const dueVal = getValue(w, "due");
            let dueDate = null;
            if (dueVal) {
                if (dueVal instanceof Date) dueDate = dueVal;
                else if (dueVal.toJSDate) dueDate = dueVal.toJSDate();
                else dueDate = new Date(dueVal);
            }
            const gradeVal = getValue(w, "grade");
            const isCompleted = ["graded", "completed", "submitted", "done"].some(s => hasValue(w, "status", s));
            const rawClassLink = getValue(w, "class");
            let classLinkStr = "";
            if (rawClassLink) {
                if (typeof rawClassLink === 'object' && rawClassLink.path) classLinkStr = rawClassLink.path;
                else classLinkStr = String(rawClassLink);
            }

            return {
                file,
                type: getValue(w, "type") || "Assignment",
                dueDate,
                isCompleted,
                isGraded: !!gradeVal && String(gradeVal).trim().length > 0,
                grade: gradeVal,
                isOverdue: !isCompleted && dueDate && dueDate < today,
                isDueSoon: !isCompleted && dueDate && dueDate >= today && dueDate <= nextWeek,
                classLinkStr: classLinkStr.toLowerCase()
            };
        });

        const activeClasses = classes.filter(c => c.isActive);
        const overdueItems = coursework.filter(w => w.isOverdue).sort((a, b) => a.dueDate - b.dueDate);
        
        // --- UPCOMING LOGIC (Limit 10) ---
        const upcomingItems = coursework
            .filter(w => w.isDueSoon)
            .sort((a, b) => a.dueDate - b.dueDate)
            .slice(0, 10);

        const recentGrades = coursework.filter(w => w.isGraded).sort((a, b) => (b.file.ctime || 0) - (a.file.ctime || 0)).slice(0, 5);

        const classProgress = activeClasses.map(c => {
            const code = (c.courseCode || "").toLowerCase();
            const path = (c.file.path || "").toLowerCase();
            const name = (c.file.name || "").toLowerCase();
            const classWork = coursework.filter(w => {
                if (!w.classLinkStr) return false;
                return w.classLinkStr.includes(code) || 
                       w.classLinkStr.includes(name) || 
                       (path && w.classLinkStr.includes(path.replace(".md", "")));
            });
            const total = classWork.length;
            const completed = classWork.filter(w => w.isCompleted).length;
            const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
            return { ...c, total, completed, percent };
        });

        return { classes, activeClasses, coursework, overdueItems, upcomingItems, recentGrades, classProgress, terms, activeTerms, termClassMap };
    }, [pages]);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ClockWidget({ theme }) {
    const [time, setTime] = dc.useState(new Date());
    dc.useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    return (
        <GloCard variant="glass" glow={true} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: "11px", color: theme?.["color-text-muted"], textTransform: "uppercase" }}>Academic HQ</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: theme?.["color-text"] }}>{time.getHours() < 12 ? "Good Morning" : "Welcome Back"}</div>
                </div>
                <div style={{ fontSize: "28px", fontFamily: "var(--font-monospace)", fontWeight: "bold", color: theme?.["color-primary"] }}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </GloCard>
    );
}

// --- UPDATED NAVIGATION BAR ---
function ClassNavigationBar({ classes, onToggle, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 30, paddingTop: 20, borderTop: `1px solid ${primary}33` }}>
            
            {/* GENERAL VIEWS */}
            <GloButton 
                label="Calendar" 
                icon="📅" 
                variant="secondary" 
                onClick={() => onToggle("![[calendar-default.base#Classes]]")}
                style={{ minWidth: "120px" }}
            />
            <GloButton 
                label="All Classes" 
                icon="🎓" 
                variant="secondary" 
                onClick={() => onToggle("![[Classes.base]]")}
                style={{ minWidth: "120px" }}
            />
            <GloButton 
                label="Kanban" 
                icon="📋" 
                variant="primary" 
                onClick={() => onToggle("![[kanban-default.base#Coursework]]")}
                style={{ minWidth: "120px" }}
            />
            
            {/* DIVIDER */}
            <div style={{ width: 1, background: `${primary}33`, margin: "0 10px" }}></div>

            {/* ACTIVE CLASSES */}
            {classes.length > 0 ? classes.map((c, i) => (
                <GloButton
                    key={i}
                    label={c.courseCode || c.file.name}
                    icon="📚"
                    variant="ghost"
                    onClick={() => onToggle(`![[${c.file.path}]]`)}
                    style={{ minWidth: "120px" }}
                />
            )) : (
                <div style={{ color: theme?.["color-text-muted"], fontStyle: "italic", alignSelf: "center" }}>No active classes.</div>
            )}
        </div>
    );
}

function TermSection({ terms, termClassMap, onItemClick, theme }) {
    const primary = theme?.["color-primary"] || "#7c3aed";
    const green = theme?.["color-success"] || "#10b981";

    const formatDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    if (!terms || terms.length === 0) {
        return (
            <div style={{ color: theme?.["color-text-muted"], fontSize: "13px", fontStyle: "italic" }}>
                No active terms. Click "New Term" to create one.
            </div>
        );
    }

    return (
        <div>
            {terms.map((term, i) => {
                const linkedClasses = termClassMap[term.file.path] || [];
                return (
                    <GloCard
                        key={i}
                        variant="ghost"
                        size="small"
                        clickable={true}
                        onClick={() => onItemClick(term.file.path)}
                        style={{ marginBottom: 12, background: "rgba(255,255,255,0.02)" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{term.file.name}</div>
                            {term.isCurrent && (
                                <span style={{
                                    background: green,
                                    color: "#fff",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    padding: "2px 8px",
                                    borderRadius: "10px"
                                }}>CURRENT</span>
                            )}
                        </div>
                        <div style={{ fontSize: "12px", color: theme?.["color-text-muted"], marginBottom: 8 }}>
                            {formatDate(term.startDate)} — {formatDate(term.endDate)}
                        </div>
                        {linkedClasses.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {linkedClasses.map((c, j) => (
                                    <span
                                        key={j}
                                        onClick={(e) => { e.stopPropagation(); onItemClick(c.file.path); }}
                                        style={{
                                            background: `${primary}22`,
                                            color: primary,
                                            fontSize: "11px",
                                            padding: "3px 8px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            transition: "background 0.2s"
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = `${primary}44`}
                                        onMouseLeave={(e) => e.target.style.background = `${primary}22`}
                                    >
                                        {c.courseCode || c.file.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </GloCard>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function AcademicDashboard() {
    const { theme } = useTheme();
    const data = useAcademicData();
    useComponentCSS();

    // TARGET FILE CONFIGURATION
    const TARGET_DASHBOARD_FILE = "System/Dashboards/Academic Dashboard.md";

    const primary = theme?.["color-primary"] || "#7c3aed";
    const red = theme?.["color-red"] || "#ef4444";
    const green = theme?.["color-success"] || "#10b981";
    const orange = theme?.["color-orange"] || "#f59e0b";

    // --- TaskNotes Toggle Helper ---
    const toggleTaskStatus = async (path, currentStatus) => {
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) return;

        const isCompleted = ["done", "completed", "graded"].some(s => String(currentStatus).toLowerCase().includes(s));
        const newStatus = isCompleted ? "open" : "done";

        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm.status = newStatus;
            });
            new Notice(`Task marked as ${newStatus}`);
        } catch (e) {
            console.error(e);
            new Notice("Failed to update task status");
        }
    };
    // -------------------------------

    const createNote = async (template, name) => {
        const templater = app.plugins.plugins["templater-obsidian"];
        if (templater) {
            try {
                const f = app.vault.getAbstractFileByPath(template);
                if (f) await templater.templater.create_new_note_from_template(f, app.vault.getRoot(), name.replace("{{DATE}}", window.moment().format("YYYY-MM-DD-HHmmss")), true);
            } catch(e) { console.error(e); }
        } else { new Notice("Templater plugin not found."); }
    };

    const toggleEmbed = async (embedLink) => {
        if (!embedLink || embedLink.includes("![[]]")) { new Notice("Invalid file path."); return; }
        const file = app.vault.getAbstractFileByPath(TARGET_DASHBOARD_FILE);
        if (!file) { new Notice(`Dashboard file not found at: ${TARGET_DASHBOARD_FILE}`); return; }
        
        try {
            const content = await app.vault.read(file);
            const lines = content.split("\n");
            let blockEndIndex = -1;
            let insideBlock = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith("```")) {
                    if (insideBlock) { blockEndIndex = i; break; } 
                    else { insideBlock = true; }
                }
            }
            if (blockEndIndex === -1) blockEndIndex = lines.length - 1;

            let existingEmbedIndex = -1;
            for (let i = blockEndIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith("![[") && line.endsWith("]]")) { existingEmbedIndex = i; break; }
            }

            if (existingEmbedIndex !== -1) {
                const currentEmbed = lines[existingEmbedIndex].trim();
                if (currentEmbed === embedLink) { lines.splice(existingEmbedIndex, 1); } 
                else { lines[existingEmbedIndex] = embedLink; }
            } else {
                if (lines[blockEndIndex + 1] !== "") { lines.splice(blockEndIndex + 1, 0, "", embedLink); } 
                else { lines.splice(blockEndIndex + 1, 0, embedLink); }
            }
            await app.vault.modify(file, lines.join("\n"));
        } catch (e) { console.error(e); new Notice("Error updating dashboard embed."); }
    };

    const handleItemClick = (path) => { if (path) toggleEmbed(`![[${path}]]`); };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "10px" }}>
            <ClockWidget theme={theme} />

            {/* STATS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "30px" }}>
                <GloCard variant="elevated" title="Active Classes" icon="📚" size="small">
                    <div style={{ fontSize: "32px", fontWeight: "800", color: primary, textAlign: "center" }}>{data.activeClasses.length}</div>
                </GloCard>
                <GloCard variant="elevated" title="Due This Week" icon="📅" size="small">
                    <div style={{ fontSize: "32px", fontWeight: "800", color: orange, textAlign: "center" }}>{data.upcomingItems.length}</div>
                </GloCard>
                <GloCard variant="elevated" title="Overdue" icon="🚨" size="small">
                    <div style={{ fontSize: "32px", fontWeight: "800", color: red, textAlign: "center" }}>{data.overdueItems.length}</div>
                </GloCard>
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <GloButton icon="book-plus" label="New Class" variant="primary" onClick={() => createNote("System/Templates/Class Template.md", "NewClass-{{DATE}}")} />
                <GloButton icon="calendar-plus" label="New Term" variant="secondary" onClick={() => createNote("System/Templates/Term Template.md", "Term-{{DATE}}")} />
                <GloButton icon="file-edit" label="Lecture Note" variant="secondary" onClick={() => createNote("System/Templates/Lecture Notes Template.md", "Lecture-{{DATE}}")} />
                <GloButton icon="pencil" label="Assignment" variant="secondary" onClick={() => createNote("System/Templates/Coursework Template.md", "Assignment-{{DATE}}")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
                {/* LEFT COL */}
                <div>
                    <h3 style={{ borderBottom: `2px solid ${primary}44`, paddingBottom: "10px", marginBottom: "15px" }}>🔥 Deadlines</h3>
                    
                    {/* OVERDUE MAPPING */}
                    {data.overdueItems.map(item => (
                        <div key={item.file.path} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <input 
                                type="checkbox" 
                                style={{ transform: "scale(1.2)", cursor: "pointer" }}
                                onChange={() => toggleTaskStatus(item.file.path, "open")}
                            />
                            <GloCard variant="outlined" size="small" borderColor={`${red}66`} clickable={true} onClick={() => handleItemClick(item.file.path)} style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontWeight: 600 }}>{item.file.name}</div>
                                    <div style={{ color: red, fontSize: "12px", fontWeight: "bold" }}>OVERDUE</div>
                                </div>
                                <div style={{ fontSize: "12px", color: theme?.["color-text-muted"] }}>{item.type} • {item.dueDate ? item.dueDate.toLocaleDateString() : ""}</div>
                            </GloCard>
                        </div>
                    ))}

                    {/* UPCOMING MAPPING */}
                    {data.upcomingItems.map(item => (
                        <div key={item.file.path} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <input 
                                type="checkbox" 
                                style={{ transform: "scale(1.2)", cursor: "pointer" }}
                                onChange={() => toggleTaskStatus(item.file.path, "open")} 
                            />
                            <GloCard variant="ghost" size="small" clickable={true} onClick={() => handleItemClick(item.file.path)} style={{ flex: 1, background: "rgba(255,255,255,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontWeight: 600 }}>{item.file.name}</div>
                                    <div style={{ color: green, fontSize: "12px", fontWeight: "bold" }}>{Math.ceil((item.dueDate - new Date()) / (1000 * 60 * 60 * 24))} days</div>
                                </div>
                                <div style={{ fontSize: "12px", color: theme?.["color-text-muted"] }}>{item.type} • {item.dueDate ? item.dueDate.toLocaleDateString() : ""}</div>
                            </GloCard>
                        </div>
                    ))}

                    {data.overdueItems.length === 0 && data.upcomingItems.length === 0 && (
                        <GloCard variant="ghost" size="small" style={{ textAlign: "center", fontStyle: "italic", opacity: 0.7 }}>No deadlines this week. Time for Qi Gong? 🧘</GloCard>
                    )}
                </div>

                {/* RIGHT COL - Semester Progress & Grades */}
                <div>
                    <h3 style={{ borderBottom: `2px solid ${primary}44`, paddingBottom: "10px", marginBottom: "15px" }}>📊 Semester Progress</h3>
                    {data.classProgress.map((c, i) => (
                        <div key={i} style={{ marginBottom: "12px", cursor: "pointer" }} onClick={() => handleItemClick(c.file.path)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                                <span style={{ fontWeight: 600 }}>{c.courseCode}</span>
                                <span style={{ color: theme?.["color-text-muted"] }}>{c.completed}/{c.total}</span>
                            </div>
                            <GloBar value={c.percent} max={100} height="8px" fillGradient={`linear-gradient(90deg, ${primary}, ${primary}88)`} showSprite={false} borderRadius="4px" />
                        </div>
                    ))}
                    <h3 style={{ borderBottom: `2px solid ${primary}44`, paddingBottom: "10px", marginBottom: "15px", marginTop: "30px" }}>📈 Recent Grades</h3>
                     {data.recentGrades.length > 0 ? data.recentGrades.map(g => (
                        <GloCard key={g.file.path} variant="ghost" size="small" clickable={true} onClick={() => handleItemClick(g.file.path)} style={{ marginBottom: 8, background: "rgba(255,255,255,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>{g.file.name}</span>
                                <span style={{ fontWeight: "bold", color: green }}>{g.grade}</span>
                            </div>
                        </GloCard>
                     )) : (
                         <div style={{ color: theme?.["color-text-muted"], fontSize: "13px" }}>No grades yet.</div>
                     )}

                    <h3 style={{ borderBottom: `2px solid ${primary}44`, paddingBottom: "10px", marginBottom: "15px", marginTop: "30px" }}>🗓️ Active Terms</h3>
                    <TermSection terms={data.activeTerms} termClassMap={data.termClassMap} onItemClick={handleItemClick} theme={theme} />
                </div>
            </div>

            <ClassNavigationBar classes={data.activeClasses} onToggle={toggleEmbed} theme={theme} />
        </div>
    );
}

return { AcademicDashboard };