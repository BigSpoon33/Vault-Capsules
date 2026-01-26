// ═══════════════════════════════════════════════════════════════════════════════
// TODAY MENU / DAILY NUTRITION WIDGET (Final Commit Fix)
// Displays today's meals, tracks macros, and syncs with Meal Planner
// Fix: Toggling "Logged" now forcibly commits current meals/stats to the daily note
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloToggle } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx")
);

const { GloSelect } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx")
);

const { GloButton } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const {
    resolveDateStr,
    getFrontmatterForDate,
    saveFrontmatterForDate,
    getFileForDate,
} = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-dateContext.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_PATH = "System/Settings.md";
const PLANNER_PATH = "System/Planners/Meal Planner.md";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Parsing Logic
// ─────────────────────────────────────────────────────────────────────────────

const parseNum = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.]/g, '');
    return Number(str) || 0;
};


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function DailyNutrition({ targetDate } = {}) {
    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;

    // Resolve Date Context
    const dateStr = resolveDateStr(targetDate);
    const dayName = window.moment(dateStr).format('dddd').toLowerCase();
    const fm = getFrontmatterForDate(dateStr);
    const targetFileObj = getFileForDate(dateStr);

    // Colors
    const primary = theme?.["color-primary"] || "#7c3aed";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const border = theme?.["color-border"] || "rgba(255,255,255,0.1)";

    // ─────────────────────────────────────────────────────────────────────────
    // DATA FETCHING (Reactive via DataCore)
    // ─────────────────────────────────────────────────────────────────────────

    // Use DataCore's reactive query to get all pages - this auto-updates when files change
    const pages = dc.useQuery("@page");

    // Find the planner note reactively
    const plannerNote = pages?.find(p => p.$path === PLANNER_PATH || p.$path?.endsWith(PLANNER_PATH));

    const getGoalsFromSettings = () => {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(SETTINGS_PATH);
            if (!settingsFile) return { cal: 2000, pro: 150, carb: 200, fat: 65 };
            const settingsCache = app.metadataCache.getFileCache(settingsFile);
            const activities = settingsCache?.frontmatter?.activities || [];
            return {
                cal: activities.find(a => a.id === 'calories')?.goal || 2000,
                pro: activities.find(a => a.id === 'protein')?.goal || 150,
                carb: activities.find(a => a.id === 'carbs')?.goal || 200,
                fat: activities.find(a => a.id === 'fat')?.goal || 65
            };
        } catch (e) { return { cal: 2000, pro: 150, carb: 200, fat: 65 }; }
    };
    const goals = getGoalsFromSettings();

    // Legacy fallback for planner file check (for error display)
    const plannerFile = app.vault.getAbstractFileByPath(PLANNER_PATH);

    const recipeMap = new Map();
    const recipeOptions = [{ value: "", label: "— Skip / Fasting —" }];
    
    const allFiles = app.vault.getMarkdownFiles();
    allFiles.forEach(f => {
        const fFm = app.metadataCache.getFileCache(f)?.frontmatter;
        if (!fFm) return;
        
        const isRecipe = (fFm.tags && (Array.isArray(fFm.tags) ? fFm.tags.includes('recipe') : fFm.tags === 'recipe')) || 
                         (JSON.stringify(fFm.categories || "").includes("Recipes"));
        
        if (isRecipe && !f.path.includes("Template")) {
            const name = f.basename;
            recipeMap.set(name, {
                cal: parseNum(fFm.calories),
                pro: parseNum(fFm.protein),
                carb: parseNum(fFm.carbs),
                fat: parseNum(fFm.fat)
            });
            recipeOptions.push({ value: name, label: name });
        }
    });
    recipeOptions.sort((a, b) => a.label.localeCompare(b.label));

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const getInitialMeal = (type) => {
        // Handle both string values and Obsidian/DataCore link objects
        const clean = (val) => {
            if (!val) return "";
            // Handle DataCore link objects (have .path or .link property)
            if (typeof val === 'object') {
                if (val.path) return val.path.replace(".md", "").trim();
                if (val.link) return String(val.link).replace(/[\[\]"]/g, "").replace(".md", "").trim();
            }
            // Handle string values
            return String(val).replace(/[\[\]"]/g, "").replace(".md", "").trim();
        };

        // Priority 1: Daily note value (user's choice - auto-saved)
        if (fm && fm[type]) {
            return clean(fm[type]);
        }

        // Priority 2: Planner value (reactive fallback for unset meals)
        const plannerKey = `${dayName}-${type === 'breakfast' ? 'break' : type}`;
        if (plannerNote) {
            const plannerValue = plannerNote.value(plannerKey);
            if (plannerValue) return clean(plannerValue);
        }

        return "";
    };

    const getInitialSnacks = () => {
        // Load snacks from daily note (auto-saved)
        // Snacks aren't in the planner, so daily note is the only source
        if (fm && fm.snacks && Array.isArray(fm.snacks)) {
            return fm.snacks.map(s => {
                // Handle both string values and Obsidian link objects
                if (typeof s === 'object') {
                    if (s.path) return s.path.replace(".md", "").trim();
                    if (s.link) return String(s.link).replace(/[\[\]"]/g, "").replace(".md", "").trim();
                }
                return String(s).replace(/[\[\]"]/g, "").replace(".md", "").trim();
            }).filter(s => s !== ""); // Filter out empty strings
        }
        return [];
    };

    // Helper to clean any link value (used in multiple places)
    const cleanLinkValue = (val) => {
        if (!val) return "";
        // Handle DataCore link objects (have .path or .link property)
        if (typeof val === 'object') {
            if (val.path) return val.path.replace(".md", "").trim();
            if (val.link) return String(val.link).replace(/[\[\]"]/g, "").replace(".md", "").trim();
        }
        return String(val).replace(/[\[\]"]/g, "").replace(".md", "").trim();
    };

    // Helper to get planner value reactively
    const getPlannerValue = (key) => {
        if (!plannerNote) return "";
        const val = plannerNote.value(key);
        return cleanLinkValue(val);
    };

    const [meals, setMeals] = dc.useState({ breakfast: "", lunch: "", dinner: "" });
    const [snacks, setSnacks] = dc.useState([]);
    const [isNutritionComplete, setIsNutritionComplete] = dc.useState(false);

    dc.useEffect(() => {
        setMeals({
            breakfast: getInitialMeal("breakfast"),
            lunch: getInitialMeal("lunch"),
            dinner: getInitialMeal("dinner")
        });
        setSnacks(getInitialSnacks());
        setIsNutritionComplete(fm?.["nutrition-completed"] || false);
    }, [fm, plannerNote, dayName]);
    
    // ─────────────────────────────────────────────────────────────────────────
    // LOGIC
    // ─────────────────────────────────────────────────────────────────────────
    
    const calculateStats = (currentMeals, currentSnacks) => {
        const currentStats = { cal: 0, pro: 0, carb: 0, fat: 0 };
        const add = (name) => {
            if (!name) return;
            const data = recipeMap.get(name);
            if (data) {
                currentStats.cal += data.cal;
                currentStats.pro += data.pro;
                currentStats.carb += data.carb;
                currentStats.fat += data.fat;
            }
        };
        add(currentMeals.breakfast);
        add(currentMeals.lunch);
        add(currentMeals.dinner);
        currentSnacks.forEach(s => add(s));
        return currentStats;
    };

    const stats = calculateStats(meals, snacks);

    // Save logic for meals/stats (excluding the boolean, which GloToggle handles)
    const saveMeals = async (newMeals, newSnacks) => {
        const finalStats = calculateStats(newMeals, newSnacks);

        const update = {
            breakfast: newMeals.breakfast ? `[[${newMeals.breakfast}]]` : null,
            lunch: newMeals.lunch ? `[[${newMeals.lunch}]]` : null,
            dinner: newMeals.dinner ? `[[${newMeals.dinner}]]` : null,
            snacks: newSnacks.length > 0 ? newSnacks.map(s => `[[${s}]]`) : [],
            "consumed-calories": finalStats.cal,
            "consumed-protein": finalStats.pro,
            "consumed-carbs": finalStats.carb,
            "consumed-fat": finalStats.fat
        };

        // Note: This merges with existing frontmatter, so nutrition-completed is safe
        await saveFrontmatterForDate(dateStr, update);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS (Auto-save to daily note - planner is fallback for unset meals)
    // ─────────────────────────────────────────────────────────────────────────

    const handleMealChange = (type, val) => {
        const newMeals = { ...meals, [type]: val };
        setMeals(newMeals);
        // Auto-save: persist to daily note immediately
        saveMeals(newMeals, snacks);
    };

    const handleSnackAdd = () => {
        const newSnacks = [...snacks, ""];
        setSnacks(newSnacks);
        // Don't save empty snack - wait until user selects something
    };

    const handleSnackChange = (index, val) => {
        const newSnacks = [...snacks];
        newSnacks[index] = val;
        setSnacks(newSnacks);
        // Auto-save: persist to daily note immediately
        saveMeals(meals, newSnacks);
    };

    const handleSnackRemove = (index) => {
        const newSnacks = snacks.filter((_, i) => i !== index);
        setSnacks(newSnacks);
        // Auto-save: persist removal to daily note
        saveMeals(meals, newSnacks);
    };

    const handleToggleCallback = (newState) => {
        // Toggle just marks completion status - meals are already auto-saved
        setIsNutritionComplete(newState);
        new Notice(newState ? "Nutrition logged! 🍎" : "Nutrition marked incomplete");
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    if (themeLoading || !pages) return <div>Loading...</div>;

    if (!plannerFile || !plannerNote) {
        return (
             <div style={{
                padding: 16, border: `1px solid ${theme?.["color-red"]}`, borderRadius: 8, 
                background: `${theme?.["color-red"]}15`, color: theme?.["color-red"], textAlign: "center"
            }}>
                ⚠️ Planner Not Found: <br/><code>{PLANNER_PATH}</code>
            </div>
        );
    }

    const ProgressBar = ({ current, max, color, height = '4px' }) => {
        const pct = Math.min((current / max) * 100, 100);
        return (
            <div style={{width:'100%', height: height, background:'rgba(255,255,255,0.05)', borderRadius:'2px', marginTop:'3px', overflow:'hidden'}}>
                <div style={{width: `${pct}%`, height:'100%', background: color, transition:'width 0.3s ease'}}></div>
            </div>
        );
    };

    const MealRow = ({ label, type, currentVal, icon }) => {
        const plannerKey = `${dayName}-${type === 'breakfast' ? 'break' : type}`;
        const plannedName = getPlannerValue(plannerKey);
        const isPlannedMatch = currentVal === plannedName;
        const hasMeal = currentVal !== "";
        let statusText = "", statusColor = textMuted;

        if (hasMeal && plannedName) {
            if (isPlannedMatch) {
                statusText = "⭐ Plan Matched"; statusColor = theme?.["color-success"] || "#10b981";
            } else {
                statusText = "🔄 Swapped"; statusColor = theme?.["color-warning"] || "#f59e0b";
            }
        } else if (!hasMeal && plannedName) {
            statusText = `Plan: ${plannedName}`;
        }

        return (
            <div style={{display:'flex', flexDirection:'column', marginBottom:'12px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', color: textMuted, marginBottom:'4px', textTransform:'uppercase'}}>
                    <span style={{display:'flex', alignItems:'center', gap:'6px'}}>{icon} {label}</span>
                    {statusText && <span style={{color: statusColor, fontWeight: 'bold'}}>{statusText}</span>}
                </div>
                <GloSelect
                    value={currentVal}
                    options={recipeOptions}
                    onChange={(val) => handleMealChange(type, val)}
                    size="small"
                    searchable={true}
                    searchPlaceholder="Search recipes..."
                    style={{ width: "100%" }}
                />
            </div>
        );
    };

    return (
        <div style={{
            padding:'16px', 
            background: showBackgrounds ? surface : "transparent",
            borderRadius:'12px', 
            border: showBackgrounds ? `1px solid ${border}` : "none",
            color: theme?.["color-text"] || "var(--text-normal)"
        }}>
            {/* Header & Stats */}
            <div style={{marginBottom:'20px'}}>
                <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px',
                    position: 'relative', zIndex: 5 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{margin:0, fontSize:'14px', fontWeight:600, color:primary}}>🍎 Nutrition</h3>
                        <GloButton
                            label="📅"
                            size="small"
                            onClick={() => app.workspace.openLinkText(PLANNER_PATH, "", false)}
                            title="Open Meal Planner"
                            style={{ fontSize: '12px', padding: '4px 8px', minWidth: 'auto' }}
                        />
                    </div>
                    
                    <div style={{
                        display:'flex', alignItems:'center', gap:'12px',
                        position: 'relative', zIndex: 6
                    }}>
                        <span style={{fontSize:'12px', fontWeight:'bold', color: stats.cal > goals.cal ? theme?.["color-red"] : theme?.["color-info"]}}>
                            {stats.cal} / {goals.cal} kcal
                        </span>
                        
                        {targetFileObj ? (
                            <GloToggle
                                targetKey="nutrition-completed"
                                targetFile={targetFileObj.path}
                                onLabel="Logged"
                                offLabel="Log Done"
                                width="100px"
                                padding="4px 8px"
                                onChange={handleToggleCallback}
                            />
                        ) : (
                            <span style={{fontSize: 10, color: 'red'}}>Save File First</span>
                        )}
                    </div>
                </div>
                
                <ProgressBar current={stats.cal} max={goals.cal} color={stats.cal > goals.cal ? theme?.["color-red"] : theme?.["color-info"]} height="6px" />
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'10px', fontSize:'11px'}}>
                    <div><div style={{color: theme?.["color-success"], display:'flex', justifyContent:'space-between'}}><span>Pro</span> <span>{stats.pro}</span></div><ProgressBar current={stats.pro} max={goals.pro} color={theme?.["color-success"]} height="3px" /></div>
                    <div><div style={{color: theme?.["color-warning"], display:'flex', justifyContent:'space-between'}}><span>Carb</span> <span>{stats.carb}</span></div><ProgressBar current={stats.carb} max={goals.carb} color={theme?.["color-warning"]} height="3px" /></div>
                    <div><div style={{color: "#e17055", display:'flex', justifyContent:'space-between'}}><span>Fat</span> <span>{stats.fat}</span></div><ProgressBar current={stats.fat} max={goals.fat} color="#e17055" height="3px" /></div>
                </div>
            </div>

            {/* Meals */}
            <MealRow label="Breakfast" type="breakfast" icon="🍳" currentVal={meals.breakfast} />
            <MealRow label="Lunch" type="lunch" icon="🥗" currentVal={meals.lunch} />
            <MealRow label="Dinner" type="dinner" icon="🥘" currentVal={meals.dinner} />

            {/* Snacks */}
            <div style={{borderTop:`1px solid ${theme?.["color-border"] || "rgba(255,255,255,0.1)"}`, paddingTop:'12px', marginTop:'12px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                    <div style={{fontSize:'11px', color: textMuted, textTransform:'uppercase'}}>🍿 Snacks</div>
                    <button 
                        onClick={handleSnackAdd}
                        style={{
                            background: theme?.["color-accent"] || "var(--interactive-accent)", 
                            color: "var(--text-on-accent)", 
                            border:'none', borderRadius:'4px', width:'20px', height:'20px', 
                            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding: 0
                        }}
                    >
                        +
                    </button>
                </div>
                {snacks.map((snackName, index) => (
                    <div key={index} style={{marginBottom:'6px', display:'flex', alignItems:'center', gap:'8px'}}>
                        <GloSelect
                            value={snackName}
                            options={recipeOptions}
                            onChange={(val) => handleSnackChange(index, val)}
                            size="small"
                            searchable={true}
                            searchPlaceholder="Search snacks..."
                            style={{ flex: 1 }}
                        />
                        <button 
                            onClick={() => handleSnackRemove(index)} 
                            style={{
                                background:'transparent', border:`1px solid ${theme?.["color-border"]}`, 
                                color: textMuted, borderRadius:'4px', width:'24px', height:'24px', 
                                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'
                            }}
                        >✕</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

return { Func: DailyNutrition };