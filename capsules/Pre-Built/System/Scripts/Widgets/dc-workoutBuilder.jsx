// System/Scripts/Widgets/dc-workoutBuilder.jsx

const { useTheme } = await dc.require(dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx"));
const { GloButton, useComponentCSS } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloButton.jsx"));
const { GloCard } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloCard.jsx"));
const { ExercisePicker } = await dc.require(dc.fileLink("System/Scripts/Components/dc-exercisePicker.jsx"));

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Link Resolvers (Fixes the "|" display issue)
// ─────────────────────────────────────────────────────────────────────────────

const toText = (val) => {
    if (val === null || val === undefined) return "";
    return String(val);
};

// Returns the clean visual name: [[Note|Alias]] -> "Alias"
const resolveDisplayName = (raw) => {
    if (!raw) return "Untitled";
    const str = String(raw);
    // Regex matches [[Target|Alias]] and captures Alias, or just captures Target inside [[ ]]
    // If pipe exists: uses text after pipe. If no pipe: uses text inside brackets.
    return str.replace(/\[\[(?:.*\|)?(.*?)\]\]/g, "$1").replace(/[\[\]]/g, "");
};

// Returns the clean file path: [[Note|Alias]] -> "Note"
const resolveLinkTarget = (raw) => {
    if (!raw) return "";
    const str = String(raw);
    // Captures text BEFORE the pipe (if pipe exists)
    return str.replace(/\[\[(.*?)(?:\|.*)?\]\]/g, "$1").replace(/[\[\]]/g, "");
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Stat Input
// ─────────────────────────────────────────────────────────────────────────────
const StatInput = ({ value, label, onUpdate, width = "100%" }) => {
    const [localVal, setLocalVal] = dc.useState(toText(value));
    dc.useEffect(() => { setLocalVal(toText(value)); }, [value]);

    const handleBlur = () => { if (localVal !== toText(value)) onUpdate(localVal); };

    return (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', flex: 1}}>
            <label style={{fontSize:'0.65em', textTransform:'uppercase', opacity: 0.6, fontWeight:'700', marginBottom:'2px'}}>{label}</label>
            <input 
                type="text"
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => { if(e.key==='Enter') e.target.blur() }}
                style={{
                    width: width,
                    background: 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--background-modifier-border)',
                    borderRadius: '6px',
                    padding: '8px',
                    textAlign: 'center',
                    color: 'var(--text-normal)',
                    fontWeight: 'bold',
                    fontSize: '1em'
                }}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function WorkoutBuilder() {
    const { theme } = useTheme();
    useComponentCSS(); 

    // 1. DATA SETUP
    const ctx = dc.useCurrentFile();
    const targetPath = ctx?.path || app.workspace.getActiveFile()?.path;
    const file = targetPath ? app.vault.getAbstractFileByPath(targetPath) : null;
    const cache = file ? app.metadataCache.getFileCache(file) : null;
    const fm = ctx?.frontmatter || cache?.frontmatter || {};

    const warmups = fm.warmup || [];
    const exercises = fm.exercises || [];
    const cooldowns = fm.cooldown || [];

    // 2. UI STATE
    const [addingType, setAddingType] = dc.useState(null); 
    const [inputName, setInputName] = dc.useState("");
    const [isDeleting, setIsDeleting] = dc.useState(false); 

    // 3. ACTIONS
    const performAdd = async () => {
        if (!inputName || !addingType || !file) return;
        
        const newLink = inputName.startsWith("[[") ? inputName : `[[${inputName}]]`;
        
        await app.fileManager.processFrontMatter(file, (f) => {
            if (!f[addingType]) f[addingType] = [];
            
            if (addingType === "exercises") {
                f[addingType].push({ link: newLink, sets: 3, reps: "10", weight: "0" });
            } else {
                f[addingType].push({ link: newLink, info: "5 mins" });
            }
        });

        setAddingType(null);
        setInputName("");
    };

    const updateItem = async (listType, index, field, value) => {
        if (!file) return;
        await app.fileManager.processFrontMatter(file, (f) => {
             if (f[listType] && f[listType][index]) {
                 f[listType][index][field] = value;
             }
        });
    };

    const deleteItem = async (listType, index) => {
        if (!file) return;
        await app.fileManager.processFrontMatter(file, (f) => {
            if (f[listType]) f[listType].splice(index, 1);
        });
    };

    // 4. HANDLERS
    const handleLinkClick = (e, rawLink) => {
        if (e && e.stopPropagation) e.stopPropagation();
        
        const target = resolveLinkTarget(rawLink);
        if (target) {
            app.workspace.openLinkText(target, "", false);
        } else {
            new Notice("Could not resolve link path");
        }
    };

    // 5. SUB-RENDERERS
    const DeleteBadge = ({ onClick }) => (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
                position: 'absolute', top: '6px', right: '6px',
                background: 'rgba(255, 0, 0, 0.15)', border: '1px solid rgba(255, 0, 0, 0.3)',
                borderRadius: '4px', cursor: 'pointer', padding: '2px 6px',
                fontSize: '0.9em', lineHeight: '1', zIndex: 10, color: 'var(--text-normal)'
            }}
            title="Delete Item"
        >
            ✕
        </button>
    );

    const renderHeader = (title, listType, icon) => (
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'24px', marginBottom:'12px', paddingBottom:'8px', borderBottom:`1px solid ${theme?.["color-base-30"]}`}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'1.1em', fontWeight:'bold', color: theme?.["color-accent"]}}>
                <span>{icon}</span> {title}
            </div>
            <GloButton 
                icon="plus" 
                size="small" 
                variant="ghost" 
                onClick={() => { setAddingType(listType); setInputName(""); }} 
            />
        </div>
    );

    const renderSimpleList = (list, listType) => (
        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {list.length === 0 && <div style={{opacity:0.4, fontSize:'0.8em', fontStyle:'italic'}}>No items added.</div>}
            {list.map((item, i) => {
                const rawLink = item.link || "Untitled";
                const displayName = resolveDisplayName(rawLink);

                return (
                    <GloCard key={i} variant="subtle" style={{
                        padding:'8px 12px', display:'flex', alignItems:'center', gap:'12px',
                        position: 'relative', paddingRight: isDeleting ? '35px' : '12px'
                    }}>
                        
                        {/* NAME (Clickable) */}
                        <div 
                            onClick={(e) => handleLinkClick(e, rawLink)}
                            style={{
                                flex:1, fontWeight:'600', cursor:'pointer',
                                textDecoration: 'underline', textDecorationColor: 'transparent',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecorationColor = theme?.["color-accent"]}
                            onMouseLeave={(e) => e.target.style.textDecorationColor = 'transparent'}
                        >
                            {displayName}
                        </div>

                        {/* INFO INPUT */}
                        <div style={{width:'80px'}}>
                            <StatInput 
                                value={item.info} 
                                label="" 
                                onUpdate={(v) => updateItem(listType, i, "info", v)} 
                            />
                        </div>

                        {isDeleting && <DeleteBadge onClick={() => deleteItem(listType, i)} />}
                    </GloCard>
                );
            })}
        </div>
    );

    const renderExerciseList = () => (
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            {exercises.length === 0 && <div style={{opacity:0.4, fontSize:'0.8em', fontStyle:'italic'}}>No exercises added.</div>}
            {exercises.map((ex, i) => {
                const rawLink = ex.link || "Untitled";
                const displayName = resolveDisplayName(rawLink);

                return (
                    <GloCard key={i} variant="elevated" style={{
                        position:'relative', paddingRight: isDeleting ? '35px' : '16px'
                    }}>
                        {/* TOP ROW */}
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                            <div style={{fontWeight:'700', fontSize:'1.1em'}}>
                                <span style={{opacity:0.4, marginRight:'8px'}}>#{i+1}</span>
                                {/* CLICKABLE NAME */}
                                <span 
                                    onClick={(e) => handleLinkClick(e, rawLink)}
                                    style={{
                                        cursor:'pointer', borderBottom: '1px dotted transparent',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.borderBottom = `1px dotted ${theme?.["color-accent"]}`}
                                    onMouseLeave={(e) => e.target.style.borderBottom = '1px dotted transparent'}
                                >
                                    {displayName}
                                </span>
                            </div>
                        </div>

                        {/* STATS GRID */}
                        <div style={{display:'flex', gap:'10px'}}>
                            <StatInput label="Sets" value={ex.sets} onUpdate={(v) => updateItem("exercises", i, "sets", v)} />
                            <StatInput label="Reps" value={ex.reps} onUpdate={(v) => updateItem("exercises", i, "reps", v)} />
                            <StatInput label="Weight" value={ex.weight} onUpdate={(v) => updateItem("exercises", i, "weight", v)} />
                        </div>

                        {isDeleting && <DeleteBadge onClick={() => deleteItem("exercises", i)} />}
                    </GloCard>
                );
            })}
        </div>
    );

    // 6. MAIN RENDER
    return (
        <div style={{
            maxWidth:'800px', 
            margin:'0 auto',
            padding: '16px', 
            background: 'var(--background-secondary)', 
            border: '1px solid var(--background-modifier-border)', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            
            {/* TOP CONTROLS */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{margin:0}}>🏋️ Workout Builder</h2>
                <GloButton 
                    label={isDeleting ? "Done" : "Edit"} 
                    variant={isDeleting ? "primary" : "ghost"}
                    size="small"
                    onClick={() => setIsDeleting(!isDeleting)} 
                />
            </div>

            {/* ADD ITEM MODAL */}
            {addingType && (
                <div style={{
                    marginBottom:'20px', padding:'16px', background:'var(--background-primary)',
                    border:'1px dashed var(--interactive-accent)', borderRadius:'8px',
                }}>
                    <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px'}}>
                        <strong style={{textTransform:'capitalize'}}>Add {addingType}:</strong>
                        <div style={{marginLeft:'auto', display:'flex', gap:'8px'}}>
                            <GloButton icon="check" variant="primary" onClick={performAdd} disabled={!inputName} />
                            <GloButton icon="x" variant="secondary" onClick={() => setAddingType(null)} />
                        </div>
                    </div>
                    <ExercisePicker
                        value={inputName}
                        onChange={(name) => setInputName(name)}
                        onSelect={(exercise) => setInputName(exercise.name)}
                        placeholder="Search exercises..."
                        autoFocus={true}
                        width="100%"
                    />
                    <div style={{marginTop:'8px', fontSize:'0.75em', color:'var(--text-muted)'}}>
                        Type to search existing exercises or enter a new name
                    </div>
                </div>
            )}

            {/* WARMUP */}
            {renderHeader("Warm Up", "warmup", "🔥")}
            {renderSimpleList(warmups, "warmup")}

            {/* EXERCISES */}
            {renderHeader("Main Lifts", "exercises", "💪")}
            {renderExerciseList()}

            {/* COOLDOWN */}
            {renderHeader("Cool Down", "cooldown", "🧊")}
            {renderSimpleList(cooldowns, "cooldown")}
            
            <div style={{height:'20px'}}></div>
        </div>
    );
}

return { Func: WorkoutBuilder };