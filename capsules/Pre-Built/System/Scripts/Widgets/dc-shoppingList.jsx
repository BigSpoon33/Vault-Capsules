// ═══════════════════════════════════════════════════════════════════════════════
// SHOPPING LIST WIDGET (Wikilink Export Fix)
// Generates a shopping list from the weekly meal plan
// Fix: Exports recipe names as clickable [[wikilinks]] in the summary
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

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PLANNER_PATH = "System/Planners/Meal Planner.md";
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const MEAL_TYPES = ["break", "lunch", "dinner"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Parse servings from various formats (e.g., "4", '["4","4 bowls"]', "4 servings")
const parseServings = (val) => {
    if (!val) return 1;
    const str = String(val);
    const match = str.match(/(\d+)/);
    return match ? Number(match[1]) : 1;
};

// Normalize ingredient names for aggregation
const normalizeName = (rawName) => {
    let n = rawName.toLowerCase().trim();
    if (n.endsWith("s") && !n.endsWith("ss")) {
        n = n.slice(0, -1);
    }
    if (n.includes("onion")) return "onion";
    return n;
};

// Parse ingredient line into structured data
const parseIngredient = (line) => {
    let clean = line.replace(/^[-*]\s+(\[.?\])?\s*/, '').trim();
    const regex = /^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-zA-Z]+)?\s+(.*)$/;
    const match = clean.match(regex);

    if (match) {
        let qty = eval(match[1]); // "1/2" -> 0.5
        let unit = match[2] ? match[2].toLowerCase() : "count";
        let name = match[3];

        if (!name) {
            name = unit; 
            unit = "count";
        }

        return {
            qty: qty,
            unit: unit,
            name: normalizeName(name) 
        };
    }
    
    return { qty: 0, unit: "nm", name: normalizeName(clean) };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ShoppingList() {
    // ─────────────────────────────────────────────────────────────────────────
    // THEME & SETUP
    // ─────────────────────────────────────────────────────────────────────────
    
    const { theme, isLoading: themeLoading, settings } = useTheme();
    const showBackgrounds = settings?.widgetBackgrounds !== false;
    
    // Load CSS
    useComponentCSS();
    
    // Target the specific Meal Planner file
    const plannerAbstract = app.vault.getAbstractFileByPath(PLANNER_PATH);
    const plannerFile = dc.useFile(plannerAbstract); 
    const plannerCache = plannerAbstract ? app.metadataCache.getFileCache(plannerAbstract) : null;
    const fm = plannerFile?.frontmatter || plannerCache?.frontmatter || {};

    // ─────────────────────────────────────────────────────────────────────────
    // THEME COLORS
    // ─────────────────────────────────────────────────────────────────────────
    
    const primary = theme?.["color-primary"] || "#7c3aed";
    const accent = theme?.["color-accent"] || "#f59e0b";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    const warning = theme?.["color-warning"] || "#f59e0b";
    
    const buttonIdleBg = theme?.["button-idle-bg"] || null;
    const buttonHoverBg = theme?.["button-hover-bg"] || null;
    const buttonActiveBg = theme?.["button-active-bg"] || null;

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const [finalList, setFinalList] = dc.useState([]); 
    const [recipeStats, setRecipeStats] = dc.useState({}); 
    const [status, setStatus] = dc.useState("ready"); 
    const [checkedItems, setCheckedItems] = dc.useState({});
    const [showStats, setShowStats] = dc.useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // GENERATOR
    // ─────────────────────────────────────────────────────────────────────────
    
    const generateList = async () => {
        setStatus("scanning");
        
        const recipeUsage = {}; 
        
        DAYS.forEach(day => {
            MEAL_TYPES.forEach(type => {
                const key = `${day}-${type}`;
                let val = fm[key];
                
                if (!val) {
                    const lowerKey = key.toLowerCase();
                    const foundKey = Object.keys(fm).find(k => k.toLowerCase() === lowerKey);
                    if (foundKey) val = fm[foundKey];
                }

                if (val) {
                    const name = val.replace(/[\[\]"]/g, "").trim();
                    if (name) {
                        recipeUsage[name] = (recipeUsage[name] || 0) + 1;
                    }
                }
            });
        });

        if (Object.keys(recipeUsage).length === 0) {
            setStatus("error");
            new Notice("No meals found in the plan");
            return;
        }

        setStatus("scanning");

        const inventory = {}; 
        const stats = {};

        await Promise.all(Object.entries(recipeUsage).map(async ([recipeName, timesUsed]) => {
            const rFile = app.metadataCache.getFirstLinkpathDest(recipeName, "");
            if (!rFile) {
                console.warn("Could not find recipe file:", recipeName);
                return;
            }

            const rCache = app.metadataCache.getFileCache(rFile);
            const rFm = rCache?.frontmatter || {};
            const servingsPerBatch = parseServings(rFm.servings);
            
            const batchesNeeded = Math.ceil(timesUsed / servingsPerBatch);
            const totalServings = batchesNeeded * servingsPerBatch;
            const leftovers = totalServings - timesUsed;
            
            stats[recipeName] = {
                timesUsed,
                servings: servingsPerBatch,
                batches: batchesNeeded,
                totalServings,
                leftovers
            };

            const recipeText = await app.vault.read(rFile);
            const match = recipeText.match(/^#{1,6}\s+.*Ingredients/im);
            if (!match) return;

            const content = recipeText.slice(match.index + match[0].length);
            const endMatch = content.match(/^(#{1,6}\s|---)/m);
            const section = endMatch ? content.slice(0, endMatch.index) : content;

            const lines = section.split('\n');
            lines.forEach(rawLine => {
                if (!rawLine.trim().startsWith("-")) return; 

                const item = parseIngredient(rawLine);
                
                if (!inventory[item.name]) {
                    inventory[item.name] = { total: 0, units: {} };
                }
                
                if (item.qty > 0) {
                    const u = item.unit || "count"; 
                    const multipliedQty = item.qty * batchesNeeded;
                    
                    if (!inventory[item.name].units[u]) inventory[item.name].units[u] = 0;
                    inventory[item.name].units[u] += multipliedQty;
                    inventory[item.name].total += multipliedQty;
                } else {
                    if (!inventory[item.name].units["nm"]) inventory[item.name].units["nm"] = 0;
                    inventory[item.name].units["nm"] = 1; 
                }
            });
        }));

        const sortedNames = Object.keys(inventory).sort();
        
        const finalDisplay = sortedNames.map(name => {
            const data = inventory[name];
            let displayStr = name; 

            const unitParts = [];
            for (const [unit, qty] of Object.entries(data.units)) {
                const roundedQty = Math.round(qty * 100) / 100;
                if (unit === "count") unitParts.push(`${roundedQty}`);
                else if (unit !== "nm") unitParts.push(`${roundedQty} ${unit}`);
            }
            
            if (unitParts.length > 0) {
                displayStr = `${unitParts.join(" + ")} ${name}`; 
            }
            
            return displayStr.charAt(0).toUpperCase() + displayStr.slice(1);
        });

        setFinalList(finalDisplay);
        setRecipeStats(stats);
        setStatus("done");
        new Notice(`Generated ${finalDisplay.length} items from ${Object.keys(stats).length} recipes`);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const toggleCheck = (item) => {
        setCheckedItems(prev => ({...prev, [item]: !prev[item]}));
    };

    const clearChecked = () => {
        setCheckedItems({});
    };

    const exportToNote = async () => {
        if (finalList.length === 0) {
            new Notice("Generate a list first!");
            return;
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const fileName = `Shopping List ${dateStr}.md`;
        
        let content = `---\ncreated: ${dateStr}\ntype: shopping-list\n---\n\n# 🛒 Shopping List\n\n`;
        
        if (Object.keys(recipeStats).length > 0) {
            content += `## 📊 Recipe Summary\n\n`;
            for (const [recipe, stat] of Object.entries(recipeStats)) {
                const leftoverNote = stat.leftovers > 0 ? ` (${stat.leftovers} leftover)` : "";
                // ⚠️ FIX: Added [[wikilinks]] around recipe name
                content += `- **[[${recipe}]]**: ${stat.batches} batch${stat.batches > 1 ? "es" : ""} → ${stat.totalServings} servings${leftoverNote}\n`;
            }
            content += `\n`;
        }
        
        content += `## 🛍️ Items\n\n`;
        for (const item of finalList) {
            const checked = checkedItems[item] ? "x" : " ";
            content += `- [${checked}] ${item}\n`;
        }

        try {
            await app.vault.create(fileName, content);
            new Notice(`Created: ${fileName}`);
            const newFile = app.vault.getAbstractFileByPath(fileName);
            if (newFile) {
                await app.workspace.getLeaf().openFile(newFile);
            }
        } catch (e) {
            if (e.message.includes("already exists")) {
                new Notice(`File already exists: ${fileName}`);
            } else {
                console.error("Failed to create shopping list:", e);
                new Notice("Failed to create shopping list");
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // COMPUTED VALUES
    // ─────────────────────────────────────────────────────────────────────────
    
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const totalItems = finalList.length;
    const hasLeftovers = Object.values(recipeStats).some(s => s.leftovers > 0);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    if (themeLoading) {
        return <div style={{ padding: "20px", color: textMuted }}>Loading...</div>;
    }

    if (!plannerAbstract) {
        return (
            <div style={{
                padding: 16, border: `1px solid ${theme?.["color-red"]}`, borderRadius: 8, 
                background: `${theme?.["color-red"]}15`, color: theme?.["color-red"], textAlign: "center"
            }}>
                ⚠️ Planner Not Found: <br/><code>{PLANNER_PATH}</code>
            </div>
        );
    }

    return (
        <div style={{
            background: showBackgrounds ? surface : "transparent",
            border: showBackgrounds ? `1px solid ${primary}33` : "none",
            borderRadius: "12px",
            padding: showBackgrounds ? "16px" : "0",
            color: text,
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
            }}>
                <h3 style={{ 
                    margin: 0, 
                    color: text,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}>
                    🛒 Shopping List
                    {status === "done" && totalItems > 0 && (
                        <GloBadge 
                            label={`${checkedCount}/${totalItems}`}
                            color={checkedCount === totalItems ? success : primary}
                            size="small"
                        />
                    )}
                </h3>
                
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <GloButton
                        label={status === "scanning" ? "Scanning..." : "Generate"}
                        icon="📝"
                        onClick={generateList}
                        disabled={status === "scanning"}
                        size="small"
                        bg={buttonIdleBg}
                        hoverBg={buttonHoverBg}
                        activeBg={buttonActiveBg}
                    />
                    
                    {status === "done" && totalItems > 0 && (
                        <>
                            <GloButton
                                label="Export"
                                icon="📄"
                                onClick={exportToNote}
                                size="small"
                                variant="secondary"
                            />
                            
                            {checkedCount > 0 && (
                                <GloButton
                                    label="Clear"
                                    icon="✖"
                                    onClick={clearChecked}
                                    size="small"
                                    variant="ghost"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Recipe Stats (collapsible) */}
            {status === "done" && Object.keys(recipeStats).length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                    <div 
                        onClick={() => setShowStats(!showStats)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "8px",
                            background: showBackgrounds ? surfaceAlt : `${primary}11`,
                            borderRadius: "8px",
                            marginBottom: showStats ? "8px" : "0",
                        }}
                    >
                        <span style={{ 
                            transform: showStats ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}>▶</span>
                        <span style={{ color: textMuted, fontSize: "13px" }}>
                            {Object.keys(recipeStats).length} recipes
                            {hasLeftovers && (
                                <span style={{ color: warning, marginLeft: "8px" }}>
                                    • has leftovers
                                </span>
                            )}
                        </span>
                    </div>
                    
                    {showStats && (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            padding: "8px",
                            background: showBackgrounds ? surfaceAlt : `${primary}11`,
                            borderRadius: "8px",
                        }}>
                            {Object.entries(recipeStats).map(([recipe, stat]) => (
                                <div 
                                    key={recipe}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "13px",
                                        padding: "4px 8px",
                                        background: `${primary}22`,
                                        borderRadius: "6px",
                                    }}
                                >
                                    <span style={{ color: text }}>{recipe}</span>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <GloBadge 
                                            label={`${stat.batches} batch${stat.batches > 1 ? "es" : ""} (${stat.totalServings}srv)`}
                                            color={primary}
                                            size="small"
                                        />
                                        {stat.leftovers > 0 && (
                                            <GloBadge 
                                                label={`+${stat.leftovers} left`}
                                                color={warning}
                                                size="small"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Shopping List Items */}
            {status === "done" && totalItems > 0 ? (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    maxHeight: "400px",
                    overflowY: "auto",
                }}>
                    {finalList.map((item, i) => {
                        const isChecked = checkedItems[item];
                        return (
                            <div 
                                key={i} 
                                onClick={() => toggleCheck(item)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "8px 12px",
                                    background: isChecked 
                                        ? `${success}22` 
                                        : (showBackgrounds ? surfaceAlt : `${primary}11`),
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    border: `1px solid ${isChecked ? success : "transparent"}`,
                                    opacity: isChecked ? 0.7 : 1,
                                }}
                            >
                                <div style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: `2px solid ${isChecked ? success : textMuted}`,
                                    background: isChecked ? success : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    transition: "all 0.2s ease",
                                }}>
                                    {isChecked && (
                                        <span style={{ color: "#fff", fontSize: "12px" }}>✓</span>
                                    )}
                                </div>
                                
                                <span style={{
                                    color: text,
                                    textDecoration: isChecked ? "line-through" : "none",
                                    flex: 1,
                                }}>
                                    {item}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : status === "done" && totalItems === 0 ? (
                <div style={{
                    opacity: 0.5, 
                    fontStyle: 'italic', 
                    textAlign: 'center', 
                    padding: '20px',
                    color: textMuted,
                }}>
                    No ingredients found. Check your recipe formatting!
                    <br/>
                    <span style={{ fontSize: '0.85em' }}>Format: "- 2 cups Rice"</span>
                </div>
            ) : status === "error" ? (
                <div style={{
                    textAlign: 'center', 
                    padding: '20px',
                    color: warning,
                }}>
                    No meals found in the plan. Add some meals first!
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', 
                    padding: '20px',
                    color: textMuted,
                }}>
                    Click "Generate" to create your shopping list from the meal plan.
                </div>
            )}

            {/* Footer with progress */}
            {status === "done" && totalItems > 0 && checkedCount > 0 && (
                <div style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: showBackgrounds ? surfaceAlt : `${primary}11`,
                    borderRadius: "8px",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: "100%",
                        height: "6px",
                        background: `${primary}33`,
                        borderRadius: "3px",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            width: `${(checkedCount / totalItems) * 100}%`,
                            height: "100%",
                            background: checkedCount === totalItems 
                                ? `linear-gradient(90deg, ${success}, ${success}cc)`
                                : `linear-gradient(90deg, ${primary}, ${accent})`,
                            transition: "width 0.3s ease",
                        }} />
                    </div>
                    <div style={{ 
                        marginTop: "6px", 
                        fontSize: "12px", 
                        color: checkedCount === totalItems ? success : textMuted 
                    }}>
                        {checkedCount === totalItems 
                            ? "🎉 All items checked!" 
                            : `${totalItems - checkedCount} items remaining`
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

return { Func: ShoppingList };