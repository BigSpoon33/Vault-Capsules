// System/Scripts/Widgets/dc-recipeEditor.jsx

// 1. HELPERS
const normalize = (str) => {
    if (!str) return "";
    return String(str).replace(/[\[\]"#]/g, "").trim(); 
};

// 2. COMPONENT: InputStat (Smart Unit Handling)
const InputStat = ({ label, field, val, color, unit, onUpdate }) => {
    // PARSER: specific logic to extract number from "360 kcal"
    const extractNumber = (v) => {
        if (v === null || v === undefined) return "";
        const str = String(v);
        // If we have a unit, try to parse the float out of the string
        if (unit) {
            const num = parseFloat(str);
            return isNaN(num) ? "" : num;
        }
        return str;
    };

    // Initialize local state with JUST the number (e.g. "360" instead of "360 kcal")
    const [localVal, setLocalVal] = dc.useState(extractNumber(val));

    // Sync if file changes externally
    dc.useEffect(() => {
        setLocalVal(extractNumber(val));
    }, [val]);

    const handleBlur = () => {
        let finalVal = localVal;
        
        // If there is a unit and the user entered a number, append the unit
        if (unit && localVal !== "" && !isNaN(localVal)) {
            // Remove any existing unit text just in case user typed "25g" manually
            const cleanNum = parseFloat(localVal);
            finalVal = `${cleanNum} ${unit}`; 
        }

        // Only update if different
        if (String(finalVal) !== String(val)) {
            onUpdate(field, finalVal);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') e.target.blur();
    };

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'4px', flex:1, minWidth: '70px'}}>
            <label style={{fontSize:'0.65em', color: color, fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.5px'}}>{label}</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <input 
                    type="number" // Mobile: brings up number pad
                    value={localVal} 
                    onChange={(e) => setLocalVal(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        width:'100%', 
                        background:'rgba(0,0,0,0.1)', 
                        border:'1px solid var(--background-modifier-border)', 
                        padding:'8px 8px 8px 8px', // Extra right padding for unit
                        borderRadius:'8px',
                        textAlign:'center',
                        fontWeight:'bold',
                        fontSize: '1.2em',
                        color: 'var(--text-normal)'
                    }}
                />
                {/* Visual Unit Label (Overlay) */}
                {unit && localVal !== "" && (
                    <span style={{
                        position: 'absolute',
                        right: '8px',
                        fontSize: '0.7em',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none',
                        fontWeight: '600'
                    }}>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
};

// 3. COMPONENT: TypeChip
const TypeChip = ({ label, currentTypes, onToggle }) => {
    const isActive = currentTypes.some(t => normalize(t) === normalize(label));
    
    return (
        <button 
            onClick={() => onToggle(label)}
            style={{
                background: isActive ? 'var(--interactive-accent)' : 'var(--background-primary)',
                color: isActive ? 'var(--text-on-accent)' : 'var(--text-muted)',
                border: isActive ? '1px solid transparent' : '1px solid var(--background-modifier-border)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.85em',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                flexGrow: 1, 
                textAlign: 'center',
                whiteSpace: 'nowrap'
            }}
        >
            {label}
        </button>
    );
};

// 4. MAIN COMPONENT
function RecipeEditor() {
    // A. TRY TO GET FILE CONTEXT
    const ctx = dc.useCurrentFile();
    const targetPath = ctx?.path || app.workspace.getActiveFile()?.path;
    const file = targetPath ? app.vault.getAbstractFileByPath(targetPath) : null;
    const cache = file ? app.metadataCache.getFileCache(file) : null;
    const fm = ctx?.frontmatter || cache?.frontmatter || {};

    // B. UPDATE FUNCTION
    const update = async (key, value) => {
        if (!file) { new Notice("Error: No file found."); return; }
        
        try {
            await app.fileManager.processFrontMatter(file, (f) => {
                if (key === "rating") {
                    f[key] = Number(value);
                } else {
                    f[key] = value;
                }
            });
        } catch (e) { console.error(e); new Notice("Update failed."); }
    };

    // C. TOGGLE MEAL TYPE
    const toggleType = async (rawLabel) => {
        if (!file) { new Notice("Error: No file found."); return; }
        const linkLabel = `[[${rawLabel}]]`;

        try {
            await app.fileManager.processFrontMatter(file, (f) => {
                let current = f.type || [];
                if (!Array.isArray(current)) current = [current];

                const existsIndex = current.findIndex(t => normalize(t) === normalize(rawLabel));

                if (existsIndex >= 0) {
                    current.splice(existsIndex, 1);
                } else {
                    current.push(linkLabel);
                }
                f.type = current;
            });
        } catch (e) { console.error(e); new Notice("Toggle failed."); }
    };

    if (!file) return <div style={{padding: 20, color: 'red'}}>⚠️ Widget could not find the active file.</div>;

    const currentTypes = Array.isArray(fm.type) ? fm.type : (fm.type ? [fm.type] : []);

    // Local state for servings (TEXT based)
    const [servingsVal, setServingsVal] = dc.useState(fm.servings || "");
    dc.useEffect(() => { setServingsVal(fm.servings || ""); }, [fm.servings]);

    return (
        <div style={{
            padding: '16px', 
            background: 'var(--background-secondary)', 
            border: '1px solid var(--background-modifier-border)', 
            borderRadius: '12px',
            fontFamily: 'var(--font-ui)',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            {/* TOP ROW */}
            <div style={{
                display:'flex', 
                flexWrap: 'wrap', 
                gap:'12px', 
                justifyContent:'space-between', 
                alignItems:'center', 
                marginBottom:'20px', 
                borderBottom:'1px solid var(--background-modifier-border)', 
                paddingBottom:'16px'
            }}>
                <div style={{display:'flex', gap:'6px', flexWrap:'wrap', flex: 2}}>
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map(t => (
                        <TypeChip key={t} label={t} currentTypes={currentTypes} onToggle={toggleType} />
                    ))}
                </div>

                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', flex: 1, minWidth:'80px'}}>
                    <span style={{fontSize:'0.7em', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'bold'}}>Servings</span>
                    <input 
                        type="text" 
                        value={servingsVal} 
                        onChange={(e) => setServingsVal(e.target.value)}
                        onBlur={() => { if(servingsVal !== fm.servings) update("servings", servingsVal); }}
                        onKeyDown={(e) => {if(e.key==='Enter') e.target.blur()}}
                        style={{
                            width:'100%', 
                            padding:'6px', 
                            textAlign:'center', 
                            borderRadius:'6px', 
                            border:'1px solid var(--background-modifier-border)', 
                            background:'var(--background-primary)',
                            fontWeight: 'bold'
                        }}
                    />
                </div>
            </div>

            {/* NUTRITION GRID */}
            <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', 
                gap: '12px',
                marginBottom: '16px'
            }}>
                <InputStat label="Calories" field="calories" val={fm.calories} color="var(--text-normal)" unit="kcal" onUpdate={update} />
                <InputStat label="Protein" field="protein" val={fm.protein} color="var(--color-green)" unit="g" onUpdate={update} />
                <InputStat label="Carbs" field="carbs" val={fm.carbs} color="var(--color-orange)" unit="g" onUpdate={update} />
                <InputStat label="Fat" field="fat" val={fm.fat} color="var(--color-red)" unit="g" onUpdate={update} />
            </div>

             {/* RATING */}
             <div style={{
                 display:'flex', 
                 justifyContent:'center', 
                 gap:'8px',
                 background: 'rgba(0,0,0,0.1)',
                 padding: '8px',
                 borderRadius: '8px'
             }}>
                {[1,2,3,4,5].map(n => (
                    <span 
                        key={n}
                        onClick={() => update("rating", n)}
                        style={{
                            cursor:'pointer', 
                            fontSize:'1.4em', 
                            transition: 'transform 0.1s',
                            color: n <= (fm.rating || 0) ? '#ffd700' : 'var(--text-faint)'
                        }}
                    >
                        ★
                    </span>
                ))}
             </div>
        </div>
    );
}

return { Func: RecipeEditor };