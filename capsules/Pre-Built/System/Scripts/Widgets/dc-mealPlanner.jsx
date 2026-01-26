// ═══════════════════════════════════════════════════════════════════════════════
// MEAL PLANNER WIDGET (Focus Fix)
// Moved sub-components outside main function to prevent focus loss on typing.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const { GloSelect } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_PATH = "System/Settings.md";
const PLANNER_PATH = "System/Planners/Meal Planner.md";
const SAVE_FOLDER = "System/Meal Plans"; 
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const MEAL_TYPES = ["break", "lunch", "dinner"];

const IGNORED_TAGS = ["recipe", "recipes", "meal", "food", "breakfast", "lunch", "dinner", "snack", "dessert"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const parseNum = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.]/g, '');
    return Number(str) || 0;
};

const parseServings = (val) => {
    if (!val) return 1;
    const str = String(val);
    const match = str.match(/(\d+)/);
    return match ? Number(match[1]) : 1;
};

const caps = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ensureFolderExists = async (path) => {
    if (path === "/" || path === "") return;
    const folder = app.vault.getAbstractFileByPath(path);
    if (folder) return;
    const parentPath = path.substring(0, path.lastIndexOf("/"));
    if (parentPath && parentPath !== path) await ensureFolderExists(parentPath);
    try { await app.vault.createFolder(path); } catch (e) {}
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL COMPONENTS (Prevents Re-Render Focus Loss)
// ─────────────────────────────────────────────────────────────────────────────

const ProgressBar = ({ current, max, color, height = "4px" }) => {
    const pct = Math.min((current / max) * 100, 100);
    return (
        <div style={{width: "100%", height, background: `${color}22`, borderRadius: 4, marginTop: 3, overflow: "hidden"}}>
            <div style={{width: `${pct}%`, height: "100%", background: color, transition: "width 0.3s ease", borderRadius: 4}} />
        </div>
    );
};

// Moved OUTSIDE to fix the typing bug
const GoalInput = ({ label, activityId, goalKey, val, onUpdate, colors }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 10, color: colors.muted, textTransform: "uppercase" }}>{label}</label>
        <input 
            type="number" 
            value={val} 
            onChange={(e) => onUpdate(activityId, goalKey, e.target.value)}
            min={0} 
            style={{ 
                width: 70, 
                padding: "6px 10px", 
                fontSize: 12, 
                color: colors.text, 
                background: `${colors.primary}22`, 
                border: `1px solid ${colors.primary}44`, 
                borderRadius: 6, 
                outline: "none" 
            }} 
        />
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function MealPlanner() {
    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const { theme, isLoading: themeLoading } = useTheme();
    const showBackgrounds = true; 
    useComponentCSS();
    
    const plannerFile = app.vault.getAbstractFileByPath(PLANNER_PATH);
    const cache = plannerFile ? app.metadataCache.getFileCache(plannerFile) : null;
    const fm = cache?.frontmatter || {};

    // ─────────────────────────────────────────────────────────────────────────
    // COLORS
    // ─────────────────────────────────────────────────────────────────────────
    
    const colors = {
        primary: theme?.["color-primary"] || "#7c3aed",
        accent: theme?.["color-accent"] || "#f59e0b",
        surface: theme?.["color-surface"] || "#2a2a3e",
        text: theme?.["color-text"] || "#ffffff",
        muted: theme?.["color-text-muted"] || "#a0a0b0",
        success: theme?.["color-success"] || "#10b981",
        warning: theme?.["color-warning"] || "#f59e0b",
        error: theme?.["color-error"] || "#ef4444",
        info: theme?.["color-info"] || "#3b82f6",
        
        cal: theme?.["color-info"] || "#3b82f6",
        pro: theme?.["color-success"] || "#10b981",
        carb: theme?.["color-warning"] || "#f59e0b",
        fat: "#e17055",
        
        btnIdle: theme?.["button-idle-bg"] || null,
        btnHover: theme?.["button-hover-bg"] || null,
        btnActive: theme?.["button-active-bg"] || null
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const [localChanges, setLocalChanges] = dc.useState({});
    const [selectedSavedPlan, setSelectedSavedPlan] = dc.useState("");
    const [showGoals, setShowGoals] = dc.useState(false);
    const [localGoals, setLocalGoals] = dc.useState(null);
    const [filterTag, setFilterTag] = dc.useState(""); 
    const [saveName, setSaveName] = dc.useState(""); 

    // ─────────────────────────────────────────────────────────────────────────
    // DATA
    // ─────────────────────────────────────────────────────────────────────────
    
    const getGoalsFromSettings = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return null;
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            return {
                cal: activities.find(a => a.id === 'calories')?.goal || 2000,
                pro: activities.find(a => a.id === 'protein')?.goal || 150,
                carb: activities.find(a => a.id === 'carbs')?.goal || 200,
                fat: activities.find(a => a.id === 'fat')?.goal || 65
            };
        } catch (e) { return null; }
    };

    const settingsGoals = getGoalsFromSettings();
    const goals = localGoals || settingsGoals || { cal: 2000, pro: 150, carb: 200, fat: 65 };
    
    const recipeMap = new Map();
    const recipeBuckets = { Breakfast: [], Lunch: [], Dinner: [] };
    const savedPlans = [];
    const availableTags = new Set();
    
    const allFiles = app.vault.getMarkdownFiles();

    allFiles.forEach(f => {
        const fCache = app.metadataCache.getFileCache(f);
        const fFm = fCache?.frontmatter;
        if (!fFm) return;

        const hasCat = (str) => fFm.categories && JSON.stringify(fFm.categories).includes(str);
        const hasTag = (str) => fFm.tags && (Array.isArray(fFm.tags) ? fFm.tags.some(t => t.includes(str)) : fFm.tags.includes(str));

        if (hasCat("Meal Plans")) {
            savedPlans.push(f);
            return;
        }

        if ((hasCat("Recipes") || hasTag("recipe")) && !f.path.includes("Template")) {
            const name = f.basename;
            const rawTags = fFm.tags ? (Array.isArray(fFm.tags) ? fFm.tags : [fFm.tags]) : [];
            const cleanTags = rawTags.map(t => String(t).replace('#', '').trim());
            
            cleanTags.forEach(t => {
                if (!IGNORED_TAGS.includes(t.toLowerCase())) {
                    availableTags.add(t);
                }
            });

            recipeMap.set(name, {
                cal: parseNum(fFm.calories),
                pro: parseNum(fFm.protein),
                carb: parseNum(fFm.carbs),
                fat: parseNum(fFm.fat),
                servings: parseServings(fFm.servings),
                tags: cleanTags
            });
            
            const typeStr = JSON.stringify(fFm.type || "").toLowerCase();
            if (typeStr.includes("breakfast")) recipeBuckets.Breakfast.push(name);
            if (typeStr.includes("lunch")) recipeBuckets.Lunch.push(name);
            if (typeStr.includes("dinner")) recipeBuckets.Dinner.push(name);
        }
    });

    Object.values(recipeBuckets).forEach(arr => arr.sort());
    savedPlans.sort((a, b) => a.basename.localeCompare(b.basename));
    const sortedTags = Array.from(availableTags).sort();

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIC
    // ─────────────────────────────────────────────────────────────────────────

    const getFilteredRecipes = (bucketName) => {
        const bucket = recipeBuckets[bucketName];
        if (!filterTag) return bucket;
        return bucket.filter(name => {
            const data = recipeMap.get(name);
            return data && data.tags.includes(filterTag);
        });
    };

    const buildOptions = (bucketName) => {
        const filtered = getFilteredRecipes(bucketName);
        return [
            { value: "", label: "— Select —" },
            ...filtered.map(name => ({ value: name, label: name }))
        ];
    };

    const filterOptions = [
        { value: "", label: "All Diets" },
        ...sortedTags.map(t => ({ value: t, label: t }))
    ];

    const getSelection = (key) => {
        const raw = localChanges[key] !== undefined ? localChanges[key] : fm[key];
        if (!raw) return "";
        let str = (typeof raw === 'object' && raw.path) ? raw.path : raw;
        return str.replace(/[\[\]"]/g, "").replace(".md", "").trim();
    };

    const updateMeal = async (key, val) => {
        if (!plannerFile) return;
        setLocalChanges(prev => ({ ...prev, [key]: val }));
        await app.fileManager.processFrontMatter(plannerFile, (f) => {
            if (!val) delete f[key];
            else f[key] = `[[${val}]]`;
        });
    };

    const updateGoal = async (activityId, goalKey, newValue) => {
        const numGoal = Number(newValue) || 0;
        setLocalGoals(prev => {
            const current = prev || goals;
            return { ...current, [goalKey]: numGoal };
        });
        
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (settingsFile) {
                await app.fileManager.processFrontMatter(settingsFile, (fm) => {
                    const activities = fm.activities || [];
                    const idx = activities.findIndex(a => a.id === activityId);
                    if (idx !== -1) {
                        activities[idx].goal = numGoal;
                        fm.activities = activities;
                    }
                });
            }
        } catch (e) {}
    };

    const randomizeWeek = async () => {
        if (!plannerFile) {
            new Notice(`❌ Error: ${PLANNER_PATH} not found.`);
            return;
        }

        const updates = {};
        const localUpdates = {};
        const poolBreak = getFilteredRecipes("Breakfast");
        const poolLunch = getFilteredRecipes("Lunch");
        const poolDinner = getFilteredRecipes("Dinner");

        if (poolBreak.length === 0 || poolLunch.length === 0 || poolDinner.length === 0) {
            new Notice(`Not enough recipes found for tag: "${filterTag}"`);
            return;
        }

        DAYS.forEach(day => {
            const pick = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : "";
            localUpdates[`${day}-break`] = pick(poolBreak);
            localUpdates[`${day}-lunch`] = pick(poolLunch);
            localUpdates[`${day}-dinner`] = pick(poolDinner);
            updates[`${day}-break`] = localUpdates[`${day}-break`];
            updates[`${day}-lunch`] = localUpdates[`${day}-lunch`];
            updates[`${day}-dinner`] = localUpdates[`${day}-dinner`];
        });

        setLocalChanges(prev => ({ ...prev, ...localUpdates }));
        await app.fileManager.processFrontMatter(plannerFile, (f) => {
            for (const [k, v] of Object.entries(updates)) {
                if (v) f[k] = `[[${v}]]`;
                else delete f[k];
            }
        });
        new Notice(`Week randomized (${filterTag || "All"})!`);
    };

    const savePlan = async () => {
        const rawName = saveName.trim();
        if (!rawName) { new Notice("⚠️ Please enter a name for the plan."); return; }
        
        try {
            const safeName = rawName.replace(/[^a-zA-Z0-9 -]/g, "").trim();
            await ensureFolderExists(SAVE_FOLDER);
            const filePath = `${SAVE_FOLDER}/${safeName}.md`;
            if (app.vault.getAbstractFileByPath(filePath)) { new Notice(`❌ File "${safeName}" exists!`); return; }

            let fmContent = `---\ncategories:\n  - "[[Meal Plans]]"\n`;
            fmContent += `goal-calories: ${goals.cal}\ngoal-protein: ${goals.pro}\ngoal-carbs: ${goals.carb}\ngoal-fat: ${goals.fat}\n`;

            DAYS.forEach(day => {
                MEAL_TYPES.forEach(type => {
                    const key = `${day}-${type}`;
                    const val = getSelection(key);
                    if (val) fmContent += `${key}: "[[${val}]]"\n`;
                });
            });
            fmContent += "---\n";

            const codeBlock = "```datacorejsx\n" +
                'const script = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-mealPlanner.jsx"));\n' +
                "return function View() { return script.Func(); }\n" +
                "```";

            const fullContent = `${fmContent}\n# 🗓️ ${safeName}\n\n${codeBlock}`;
            await app.vault.create(filePath, fullContent);
            new Notice(`✅ Plan saved: ${safeName}`);
            setSaveName("");
        } catch (e) {
            console.error(e);
            new Notice(`Save Error: ${e.message}`);
        }
    };

    const loadPlan = async (planFileBaseName) => {
        setSelectedSavedPlan(planFileBaseName);
        if (!planFileBaseName || !plannerFile) return;

        const targetFile = savedPlans.find(f => f.basename === planFileBaseName);
        if (!targetFile) return;

        const savedFm = app.metadataCache.getFileCache(targetFile)?.frontmatter;
        if (!savedFm) return;

        const updates = {};
        const localUpdates = {};

        DAYS.forEach(day => {
            MEAL_TYPES.forEach(type => {
                const key = `${day}-${type}`;
                const val = savedFm[key];
                let clean = "";
                if (val) clean = (typeof val === 'object' ? val.path : val).replace(/[\[\]"]/g, "").replace(".md", "");
                localUpdates[key] = clean;
                if (clean) updates[key] = `[[${clean}]]`;
                else updates[key] = null;
            });
        });

        setLocalChanges(prev => ({ ...prev, ...localUpdates }));
        await app.fileManager.processFrontMatter(plannerFile, (f) => {
            for (const [k, v] of Object.entries(updates)) {
                if (v !== null) f[k] = v;
                else delete f[k];
            }
        });
        new Notice(`Loaded: ${planFileBaseName}`);
        setSelectedSavedPlan("");
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER COMPONENTS
    // ─────────────────────────────────────────────────────────────────────────
    
    if (themeLoading) return <div>Loading...</div>;
    if (!plannerFile) return <div>Planner Not Found</div>;

    const getDailyStats = (day) => {
        const stats = { cal: 0, pro: 0, carb: 0, fat: 0 };
        MEAL_TYPES.forEach(type => {
            const name = getSelection(`${day}-${type}`);
            const data = recipeMap.get(name);
            if (data) {
                stats.cal += data.cal;
                stats.pro += data.pro;
                stats.carb += data.carb;
                stats.fat += data.fat;
            }
        });
        return stats;
    };

    const getWeeklyStats = () => {
        const total = { cal: 0, pro: 0, carb: 0, fat: 0 };
        DAYS.forEach(day => {
            const s = getDailyStats(day);
            total.cal += s.cal;
            total.pro += s.pro;
            total.carb += s.carb;
            total.fat += s.fat;
        });
        return total;
    };

    const DayCard = ({ day }) => {
        const stats = getDailyStats(day);
        const diff = Math.abs(stats.cal - goals.cal);
        let dayCalColor = colors.muted;
        if (stats.cal > 0) {
            if (diff < 200) dayCalColor = colors.cal;
            else if (stats.cal > goals.cal) dayCalColor = colors.error;
            else dayCalColor = colors.warning;
        }

        const mealConfig = [
            { type: "break", bucket: "Breakfast", label: "Breakfast", icon: "🍳" },
            { type: "lunch", bucket: "Lunch", label: "Lunch", icon: "🥗" },
            { type: "dinner", bucket: "Dinner", label: "Dinner", icon: "🥘" },
        ];

        return (
            <div style={{ background: showBackgrounds ? colors.surface : "transparent", borderRadius: 10, border: showBackgrounds ? `1px solid ${colors.primary}22` : "none", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "10px 12px", background: `${colors.primary}22`, fontWeight: 700, fontSize: 13, color: colors.primary, textTransform: "capitalize" }}>{caps(day)}</div>
                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {mealConfig.map(({ type, bucket, label, icon }) => (
                        <div key={type}>
                            <div style={{ fontSize: 10, color: colors.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                <span>{icon}</span><span>{label}</span>
                            </div>
                            <GloSelect
                                value={getSelection(`${day}-${type}`)}
                                options={buildOptions(bucket)}
                                onChange={(val) => updateMeal(`${day}-${type}`, val)}
                                size="small"
                                searchable={true}
                                searchPlaceholder="Type to search..."
                                position={type === "dinner" ? "top" : "bottom"}
                                style={{ width: "100%" }}
                            />
                        </div>
                    ))}
                </div>
                <div style={{ padding: 10, borderTop: `1px solid ${colors.muted}22`, fontSize: 11 }}>
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: dayCalColor }}>
                            <span>{stats.cal} kcal</span><span style={{ opacity: 0.5 }}>{goals.cal}</span>
                        </div>
                        <ProgressBar current={stats.cal} max={goals.cal} color={dayCalColor} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        <div><div style={{ color: colors.pro, display: "flex", justifyContent: "space-between" }}><span>P</span><span>{stats.pro}</span></div><ProgressBar current={stats.pro} max={goals.pro} color={colors.pro} height="3px" /></div>
                        <div><div style={{ color: colors.carb, display: "flex", justifyContent: "space-between" }}><span>C</span><span>{stats.carb}</span></div><ProgressBar current={stats.carb} max={goals.carb} color={colors.carb} height="3px" /></div>
                        <div><div style={{ color: colors.fat, display: "flex", justifyContent: "space-between" }}><span>F</span><span>{stats.fat}</span></div><ProgressBar current={stats.fat} max={goals.fat} color={colors.fat} height="3px" /></div>
                    </div>
                </div>
            </div>
        );
    };

    const WeeklySummary = () => {
        const weekly = getWeeklyStats();
        const pct = (val, goal) => Math.round((val / (goal * 7)) * 100);
        const StatPill = ({ label, val, goal, color }) => (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 120, background: showBackgrounds ? `${color}11` : "transparent", padding: 10, borderRadius: 8, border: showBackgrounds ? `1px solid ${color}33` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: colors.muted, marginBottom: 4 }}><span style={{ fontWeight: 700 }}>{label}</span><span>{pct(val, goal)}%</span></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{val} <span style={{ fontSize: 10, color: colors.muted, fontWeight: 400 }}>/ {goal * 7}</span></div>
                <ProgressBar current={val} max={goal * 7} color={color} height="6px" />
            </div>
        );
        return (
            <div style={{ display: "flex", gap: 10, width: "100%", marginBottom: 16, flexWrap: "wrap" }}>
                <StatPill label="Weekly Calories" val={weekly.cal} goal={goals.cal} color={colors.cal} />
                <StatPill label="Protein" val={weekly.pro} goal={goals.pro} color={colors.pro} />
                <StatPill label="Carbs" val={weekly.carb} goal={goals.carb} color={colors.carb} />
                <StatPill label="Fat" val={weekly.fat} goal={goals.fat} color={colors.fat} />
            </div>
        );
    };

    const savedPlanOptions = [ { value: "", label: "📂 Load Plan..." }, ...savedPlans.map(f => ({ value: f.basename, label: f.basename })) ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, background: showBackgrounds ? colors.surface : "transparent", borderRadius: 12, border: showBackgrounds ? `1px solid ${colors.primary}33` : "none", color: colors.text, overflow: "visible" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>🥦</span>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.primary }}>Weekly Menu</h2>
                        <GloBadge variant="soft" color={colors.muted} size="small">{recipeMap.size} recipes</GloBadge>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <GloSelect
                            value={filterTag}
                            options={filterOptions}
                            onChange={setFilterTag}
                            size="small"
                            searchable={true}
                            searchPlaceholder="Filter diet..."
                            style={{ minWidth: 100 }}
                        />
                        <GloButton label={showGoals ? "✕ Close" : "⚙️ Goals"} size="small" onClick={() => setShowGoals(!showGoals)} bg={showGoals ? colors.btnActive : colors.btnIdle} hoverBg={colors.btnHover} activeBg={colors.btnActive} style={{ fontSize: 11 }} />
                        <GloSelect value={selectedSavedPlan} options={savedPlanOptions} onChange={loadPlan} size="small" searchable={true} searchPlaceholder="Load plan..." style={{ maxWidth: 140 }} />
                        <GloButton label="🎲" size="small" onClick={randomizeWeek} bg={colors.btnIdle} hoverBg={colors.btnHover} activeBg={colors.btnActive} title="Randomize All" style={{ fontSize: 14, padding: "6px 10px" }} />
                    </div>
                </div>

                {/* SAVE ROW */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", background: `${colors.primary}11`, padding: "8px", borderRadius: "8px" }}>
                    <input 
                        type="text" 
                        placeholder="Plan Name..." 
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        style={{
                            padding: "4px 8px", 
                            fontSize: "12px", 
                            borderRadius: "4px", 
                            border: `1px solid ${colors.primary}44`,
                            background: colors.surface,
                            color: colors.text
                        }}
                    />
                    <GloButton label="💾 Save Plan" size="small" onClick={savePlan} variant="primary" style={{ fontSize: 11 }} />
                </div>

                {showGoals && (
                    <div style={{ display: "flex", gap: 16, padding: 14, background: `${colors.accent}15`, borderRadius: 8, border: `1px solid ${colors.accent}44`, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <GoalInput label="Daily Calories" activityId="calories" goalKey="cal" val={goals.cal} onUpdate={updateGoal} colors={colors} />
                        <GoalInput label="Protein (g)" activityId="protein" goalKey="pro" val={goals.pro} onUpdate={updateGoal} colors={colors} />
                        <GoalInput label="Carbs (g)" activityId="carbs" goalKey="carb" val={goals.carb} onUpdate={updateGoal} colors={colors} />
                        <GoalInput label="Fat (g)" activityId="fat" goalKey="fat" val={goals.fat} onUpdate={updateGoal} colors={colors} />
                        <div style={{ fontSize: 10, color: colors.muted, fontStyle: "italic", paddingBottom: 8 }}>Saves to Settings.md on blur</div>
                    </div>
                )}
                <WeeklySummary />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, overflow: "visible" }}>
                {DAYS.map(day => <DayCard key={day} day={day} />)}
            </div>
        </div>
    );
}

return { Func: MealPlanner };