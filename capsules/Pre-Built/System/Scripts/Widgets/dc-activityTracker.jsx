// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TRACKER v2.3 (Rice AF Edition - Scroll Fix)
//
// Changelog:
//   - Fixed Layers Dropdown: Added max-height and scrolling for long lists
//   - Container Logic: Removed strict overflow clipping to allow popups
//   - Mobile: Retained auto-scroll and touch physics from v2.2
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_PATH = "System/Settings.md";
const CHART_HEIGHT = 80;
const CHART_WIDTH = 600;

const PALETTE = [
    "#7c3aed", // Purple
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#ec4899", // Pink
    "#ef4444", // Red
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityTracker() {
    const { theme, isLoading: themeLoading } = useTheme();
    
    // Data State
    const [activities, setActivities] = dc.useState([]);
    const [activeIds, setActiveIds] = dc.useState([]); 
    const [focusedId, setFocusedId] = dc.useState(null);
    const [menuOpen, setMenuOpen] = dc.useState(false);
    
    // Visual State
    const [chartPeriod, setChartPeriod] = dc.useState("week");
    const [tooltip, setTooltip] = dc.useState(null);
    const [loading, setLoading] = dc.useState(true);
    const [showWidgetBg, setShowWidgetBg] = dc.useState(true);

    const scrollContainerRef = dc.useRef(null);

    useComponentCSS();

    // ─────────────────────────────────────────────────────────────────────────
    // DYNAMIC SCALING & SCROLL LOGIC
    // ─────────────────────────────────────────────────────────────────────────

    const cellSize = dc.useMemo(() => {
        const count = activeIds.length;
        if (count <= 1) return 13;
        if (count === 2) return 16;
        return 20;
    }, [activeIds.length]);

    const cellGap = 3;

    // Auto-Scroll Hook
    dc.useEffect(() => {
        if (scrollContainerRef.current) {
            setTimeout(() => {
                const el = scrollContainerRef.current;
                el.scrollLeft = el.scrollWidth; 
            }, 50);
        }
    }, [activities, activeIds, cellSize]);

    // ─────────────────────────────────────────────────────────────────────────
    // DATA LOADING
    // ─────────────────────────────────────────────────────────────────────────

    dc.useEffect(() => {
        const loadSettings = () => {
            try {
                const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
                if (file) {
                    const cache = app.metadataCache.getFileCache(file);
                    const fm = cache?.frontmatter || {};
                    
                    const acts = fm.activities || [];
                    const styledActs = acts.map((a, i) => ({
                        ...a,
                        color: a.color || PALETTE[i % PALETTE.length]
                    }));
                    
                    setActivities(styledActs);
                    setShowWidgetBg(fm["widget-backgrounds"] !== false);
                    
                    if (styledActs.length > 0 && activeIds.length === 0) {
                        const firstId = styledActs[0].id;
                        setActiveIds([firstId]);
                        setFocusedId(firstId);
                    }
                }
            } catch (e) {
                console.error("Failed to load settings:", e);
            }
            setLoading(false);
        };
        loadSettings();
    }, []);

    const toggleActivity = (id) => {
        if (activeIds.includes(id)) {
            if (activeIds.length > 1) {
                const newIds = activeIds.filter(x => x !== id);
                setActiveIds(newIds);
                if (focusedId === id) setFocusedId(newIds[0]);
            }
        } else {
            if (activeIds.length < 4) {
                const newIds = [...activeIds, id];
                setActiveIds(newIds);
                setFocusedId(id);
            } else {
                new Notice("Max 4 concurrent trackers allowed.");
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DATA PROCESSING
    // ─────────────────────────────────────────────────────────────────────────

    const useMultiData = (allActivities, currentIds) => {
        const pages = dc.useQuery("@page");
        
        return dc.useMemo(() => {
            if (!pages || currentIds.length === 0) return { grid: [], stats: {} };

            const today = dc.luxon.DateTime.now().startOf('day');
            const start = today.minus({ weeks: 26 }).startOf('week');

            // 1. Build Map
            const dateMap = new Map();
            let cursor = start;
            while (cursor <= today.endOf('week')) {
                dateMap.set(cursor.toISODate(), { date: cursor, values: {} });
                cursor = cursor.plus({ days: 1 });
            }

            // 2. Scan Pages
            for (const p of pages) {
                const path = p.$path || p.path;
                const name = p.$name || p.name;
                if (!path) continue;

                const tfile = app.vault.getAbstractFileByPath(path);
                const cache = tfile ? app.metadataCache.getFileCache(tfile) : null;
                const fm = cache?.frontmatter || {};

                let date = dc.luxon.DateTime.fromISO(name);
                if (!date.isValid && fm["creation date"]) date = dc.luxon.DateTime.fromISO(fm["creation date"]);
                else if (!date.isValid && fm.date) date = dc.luxon.DateTime.fromISO(fm.date);
                
                if (!date.isValid) continue;
                date = date.startOf('day');
                const iso = date.toISODate();

                if (dateMap.has(iso)) {
                    const entry = dateMap.get(iso);
                    currentIds.forEach(id => {
                        const act = allActivities.find(a => a.id === id);
                        if (!act) return;

                        const raw = fm[act.field];
                        let val = 0;
                        if (raw !== undefined && raw !== null && raw !== "") {
                             if (act.type === "boolean") val = raw ? 1 : 0;
                             else {
                                 const num = Number(String(raw).replace(/[^\d.]/g, ""));
                                 if (!isNaN(num)) val = num;
                             }
                        }
                        
                        if (val > 0) {
                            entry.values[id] = Math.max(entry.values[id] || 0, val);
                            entry.file = path;
                        }
                    });
                }
            }

            const grid = Array.from(dateMap.values()).sort((a,b) => a.date - b.date);

            // 3. Calculate Stats
            const stats = {};
            currentIds.forEach(id => {
                const act = allActivities.find(a => a.id === id);
                const vals = grid.map(d => d.values[id] || 0);
                const nonZeroVals = vals.filter(v => v > 0);
                
                const max = Math.max(...vals);
                const total = nonZeroVals.length;
                const avg = total > 0 ? (nonZeroVals.reduce((a,b)=>a+b,0) / total).toFixed(1) : 0;
                
                // Calculate Streak
                let streak = 0;
                let checkDate = today;
                while (true) {
                    const d = dateMap.get(checkDate.toISODate());
                    if (d && d.values[id] > 0) {
                        streak++;
                        checkDate = checkDate.minus({ days: 1 });
                    } else {
                        break;
                    }
                }

                const buckets = [];
                const groups = new Map();
                
                grid.forEach(d => {
                    let key = chartPeriod === 'week' ? d.date.startOf('week').toISODate() : d.date.toFormat('yyyy-MM');
                    if (!groups.has(key)) groups.set(key, { sum: 0, count: 0 });
                    const g = groups.get(key);
                    const v = d.values[id] || 0;
                    g.sum += v;
                    if (v > 0) g.count++;
                });

                for (const [k, g] of groups) {
                    let final = (act.type === 'count' || act.type === 'boolean') ? g.sum : (g.count ? g.sum/g.count : 0);
                    buckets.push({ val: final });
                }

                stats[id] = { max, total, avg, streak, buckets, color: act.color, goal: act.goal };
            });

            return { grid, stats };
        }, [pages, allActivities, currentIds, chartPeriod]);
    };

    const { grid, stats } = useMultiData(activities, activeIds);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    const getChartPath = (buckets, maxVal) => {
        if (!buckets || buckets.length < 2) return "";
        const stepX = CHART_WIDTH / (buckets.length - 1 || 1);
        const getY = (val) => CHART_HEIGHT - ((val / (maxVal || 1)) * (CHART_HEIGHT - 10));
        
        const points = buckets.map((b, i) => [i * stepX, getY(b.val)]);
        let d = `M ${points[0][0]},${points[0][1]}`;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;
            const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
            const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
            const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
            const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
        }
        return d;
    };

    const renderDayCell = (dayData, x, y) => {
        const count = activeIds.length;
        const subRects = [];
        
        activeIds.forEach((id, index) => {
            const act = activities.find(a => a.id === id);
            const val = dayData.values[id] || 0;
            const actStats = stats[id] || { max: 1 };
            
            let opacity = 0.1;
            if (val > 0) {
                const pct = val / (act.goal || actStats.max || 1);
                opacity = Math.max(0.4, Math.min(pct, 1));
            }

            let rX = x, rY = y, rW = cellSize, rH = cellSize;

            if (count === 2) {
                rW = cellSize / 2 - 0.5;
                if (index === 1) rX = x + cellSize / 2 + 0.5;
            } else if (count === 3) {
                rW = cellSize / 2 - 0.5;
                rH = cellSize / 2 - 0.5;
                if (index === 1) rX = x + cellSize / 2 + 0.5;
                if (index === 2) rY = y + cellSize / 2 + 0.5;
            } else if (count >= 4) {
                rW = cellSize / 2 - 0.5;
                rH = cellSize / 2 - 0.5;
                if (index === 1) rX = x + cellSize / 2 + 0.5;
                if (index === 2) rY = y + cellSize / 2 + 0.5;
                if (index === 3) {
                    rX = x + cellSize / 2 + 0.5;
                    rY = y + cellSize / 2 + 0.5;
                }
            }

            subRects.push(
                <rect 
                    key={`${dayData.date}-${id}`}
                    x={rX} y={rY} width={rW} height={rH}
                    rx={2}
                    fill={val > 0 ? act.color : textMuted}
                    fillOpacity={opacity}
                />
            );
        });

        return (
            <g 
                onMouseEnter={(e) => {
                    const items = activeIds.map(id => {
                        const act = activities.find(a => a.id === id);
                        const v = dayData.values[id] || 0;
                        return { label: act.label, val: v, unit: act.unit, color: act.color };
                    });
                    setTooltip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, date: dayData.date, items });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => dayData.file && app.workspace.openLinkText(dayData.file, "", false)}
                style={{ cursor: dayData.file ? 'pointer' : 'default' }}
            >
                {subRects}
            </g>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STYLE VARIABLES
    // ─────────────────────────────────────────────────────────────────────────

    const primary = theme?.["color-primary"] || "#7c3aed";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const bg = theme?.["color-background"] || "#1e1e2e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";

    if (loading) return <div style={{padding: 40, textAlign:'center'}}>Loading...</div>;

    const focusStats = stats[focusedId] || { avg: 0, max: 0, streak: 0, total: 0 };
    const focusActivity = activities.find(a => a.id === focusedId);

    const weeks = Math.ceil(grid.length / 7);
    const heatmapWidth = weeks * (cellSize + cellGap);
    const heatmapHeight = 7 * (cellSize + cellGap) + 20;

    return (
        <div style={{
            ...styles.container,
            background: showWidgetBg ? surface : "transparent",
            border: showWidgetBg ? `1px solid ${primary}22` : "none",
            boxShadow: showWidgetBg ? `0 4px 20px ${primary}08` : "none",
            backdropFilter: showWidgetBg ? "blur(12px)" : "none",
            color: text,
        }}>
            
            {/* === HEADER === */}
            <div style={styles.header}>
                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: menuOpen ? primary : `${bg}88`,
                            color: menuOpen ? '#fff' : text,
                            border: `1px solid ${primary}44`,
                            borderRadius: 8,
                            padding: "6px 10px",
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>LAYERS ({activeIds.length})</span>
                    </button>

                    {menuOpen && (
                        <div style={styles.dropdown}>
                            <div style={{fontSize: 10, color: textMuted, marginBottom: 6, paddingLeft: 4}}>TOGGLE VISIBILITY</div>
                            {activities.map(act => {
                                const isActive = activeIds.includes(act.id);
                                return (
                                    <div 
                                        key={act.id}
                                        onClick={() => toggleActivity(act.id)}
                                        style={{
                                            ...styles.dropdownItem,
                                            background: isActive ? `${act.color}22` : 'transparent',
                                        }}
                                    >
                                        <div style={{
                                            width: 12, height: 12, borderRadius: 3,
                                            border: `1px solid ${isActive ? act.color : textMuted}`,
                                            background: isActive ? act.color : 'transparent',
                                            display: 'grid', placeItems: 'center',
                                            flexShrink: 0 // Prevent checkbox squash
                                        }}>
                                            {isActive && <div style={{width: 6, height: 6, background: '#fff', borderRadius: 1}}/>}
                                        </div>
                                        <span style={{fontSize: 12, color: isActive ? text : textMuted}}>{act.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div style={styles.legend}>
                    {activeIds.map(id => {
                        const act = activities.find(a => a.id === id);
                        const isFocused = focusedId === id;
                        return (
                            <div 
                                key={id} 
                                onClick={() => setFocusedId(id)}
                                style={{
                                    opacity: isFocused ? 1 : 0.5,
                                    transform: isFocused ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                <GloBadge variant={isFocused ? "solid" : "outline"} color={act.color} size="small">
                                    {act.icon} {act.label}
                                </GloBadge>
                            </div>
                        );
                    })}
                </div>

                 <div style={styles.chartControls}>
                    <span onClick={() => setChartPeriod("week")} style={{opacity: chartPeriod==="week"?1:0.4}}>WK</span>
                    <span style={{opacity:0.2}}>/</span>
                    <span onClick={() => setChartPeriod("month")} style={{opacity: chartPeriod==="month"?1:0.4}}>MO</span>
                </div>
            </div>

            {/* === HEATMAP === */}
            <div 
                ref={scrollContainerRef}
                style={styles.heatmapWrapper}
            >
                <svg width={heatmapWidth} height={heatmapHeight} style={{overflow:'visible', minWidth: heatmapWidth}}>
                    {grid.map((day, i) => {
                        const col = Math.floor(i / 7);
                        const row = day.date.weekday - 1;
                        const x = col * (cellSize + cellGap);
                        const y = row * (cellSize + cellGap) + 15;
                        
                        let monthLabel = null;
                        if (row === 0 && day.date.day <= 7) {
                            monthLabel = <text x={x+cellSize/2} y={10} style={styles.monthLabel}>{day.date.toFormat("MMM")}</text>;
                        }
                        
                        return (
                            <g key={day.date.toISODate()}>
                                {monthLabel}
                                {renderDayCell(day, x, y)}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* === STATS ROW === */}
            <div style={{
                ...styles.statsGrid,
                borderTop: `1px solid ${textMuted}22`,
                borderBottom: `1px solid ${textMuted}22`,
                padding: "12px 0",
                background: showWidgetBg ? `${focusActivity?.color}05` : "transparent"
            }}>
                <div style={styles.statCol}>
                    <span style={{ ...styles.statHeader, color: textMuted }}>AVG</span>
                    <span style={{ ...styles.statVal, color: text }}>{focusStats.avg}</span>
                </div>
                <div style={styles.statCol}>
                    <span style={{ ...styles.statHeader, color: textMuted }}>PEAK</span>
                    <span style={{ ...styles.statVal, color: text }}>{focusStats.max}</span>
                </div>
                <div style={styles.statCol}>
                    <span style={{ ...styles.statHeader, color: textMuted }}>STREAK</span>
                    <span style={{ ...styles.statVal, color: focusActivity?.color }}>{focusStats.streak}</span>
                </div>
                 <div style={styles.statCol}>
                    <span style={{ ...styles.statHeader, color: textMuted }}>TOTAL</span>
                    <span style={{ ...styles.statVal, color: text }}>{focusStats.total}</span>
                </div>
                {focusStats.goal && (
                    <div style={styles.statCol}>
                         <span style={{ ...styles.statHeader, color: textMuted }}>GOAL</span>
                         <span style={{ ...styles.statVal, color: focusActivity?.color }}>{focusStats.goal}</span>
                    </div>
                )}
            </div>

            {/* === CHART === */}
            <div style={styles.chartContainer}>
                <svg viewBox={`0 -5 ${CHART_WIDTH} ${CHART_HEIGHT+5}`} preserveAspectRatio="none" style={styles.chartSvg}>
                    {activeIds.map(id => {
                        const act = activities.find(a => a.id === id);
                        const stat = stats[id];
                        const isFocused = focusedId === id;
                        const opacity = isFocused ? 1 : 0.15;
                        const width = isFocused ? 2.5 : 1.5;
                        
                        const path = getChartPath(stat?.buckets, stat?.max);
                        
                        return (
                            <path 
                                key={id}
                                d={path}
                                fill="none"
                                stroke={act.color}
                                strokeWidth={width}
                                strokeOpacity={opacity}
                                style={{ transition: 'all 0.3s ease' }}
                            />
                        )
                    })}
                </svg>
            </div>

            {/* === TOOLTIP === */}
            {tooltip && (
                <div style={{
                    ...styles.tooltip,
                    left: Math.min(Math.max(tooltip.x, 80), window.innerWidth - 80),
                    top: tooltip.y - (tooltip.items.length * 20) - 20,
                    background: bg,
                    border: `1px solid ${primary}44`
                }}>
                    <div style={{borderBottom: `1px solid ${textMuted}33`, paddingBottom: 4, marginBottom: 4, fontWeight: 'bold'}}>
                        {tooltip.date.toFormat("ccc, MMM dd")}
                    </div>
                    {tooltip.items.map((item, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', gap: 12, fontSize: 11}}>
                            <span style={{color: item.color}}>{item.label}:</span>
                            <span>{item.val > 0 ? `${item.val} ${item.unit||''}` : '-'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
    container: {
        padding: 20,
        borderRadius: 16,
        fontFamily: "'JetBrains Mono', monospace",
        position: "relative",
        transition: 'all 0.3s ease',
        // Removed global overflow: hidden to allow dropdowns to pop out if needed
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        height: 32,
    },
    legend: {
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        maxWidth: '55%',
        scrollbarWidth: 'none',
        alignItems: 'center',
        maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)'
    },
    dropdown: {
        position: 'absolute', top: '110%', left: 0,
        borderRadius: 8, padding: 4, minWidth: 180,
        zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        background: '#1e1e2e', border: '1px solid #7c3aed44',
        // SCROLL FIXES
        maxHeight: '250px',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)', // Glassmorphism
    },
    dropdownItem: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: "6px 8px", borderRadius: 4,
        cursor: 'pointer',
        marginBottom: 2
    },
    heatmapWrapper: {
        display: "flex",
        justifyContent: "center", 
        width: "100%",
        marginBottom: 20,
        overflowX: "auto",
        paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
    },
    monthLabel: {
        fill: "currentColor",
        opacity: 0.5,
        fontSize: 9,
        textAnchor: "middle",
        fontWeight: "bold"
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
        gap: 10,
        marginBottom: 24,
    },
    statCol: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
    },
    statHeader: {
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        opacity: 0.8,
    },
    statVal: {
        fontWeight: "700",
        fontSize: 18,
        lineHeight: 1,
    },
    chartContainer: {
        borderTop: "1px dashed rgba(127,127,127,0.2)",
        paddingTop: 15,
        position: 'relative'
    },
    chartSvg: {
        width: '100%',
        height: CHART_HEIGHT,
        overflow: 'visible'
    },
    chartControls: {
        display: 'flex',
        gap: 6,
        fontSize: 10,
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    tooltip: {
        position: "absolute",
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 11,
        pointerEvents: "none",
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        transform: "translateX(-50%)",
        minWidth: 120
    },
};

return { Func: ActivityTracker };