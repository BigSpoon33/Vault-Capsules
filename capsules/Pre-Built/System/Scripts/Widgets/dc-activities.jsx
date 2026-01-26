/* ==================================================================
    ANALYTICS DASHBOARD (Aligned to CSS)
    - Fixes layout misalignment
    - Fixes Bar Chart Crash
    - Matches "Memories" Gist visuals
 ================================================================== */

function AnalyticsBoard() {
    // 1. CONFIG
    const getFm = (path) => {
        const f = app.metadataCache.getFirstLinkpathDest(path, "");
        return f ? app.metadataCache.getFileCache(f)?.frontmatter || {} : {};
    };
    const settings = getFm("System/Settings.md");
    const mealPlan = getFm("Meal Planner.md");

    const METRICS = {
        "journal": { label: "Journal", type: "count", color: "#2089FF" },
        "mood": { label: "Mood", type: "value", field: "mood", max: 5, color: "#A29BFE" },
        "energy": { label: "Energy", type: "value", field: "energy", max: 5, color: "#FDCB6E" },
        "sleep": { label: "Sleep", type: "value", field: "sleep-hours", goal: Number(settings["sleep-goal-hours"])||8, color: "#00B894" },
        "water": { label: "Water", type: "value", field: "water-ml", goal: Number(settings["water-goal-ml"])||3000, color: "#0984E3" },
        "nutrition": { label: "Calories", type: "value", field: "consumed-calories", goal: Number(mealPlan["goal-calories"])||2000, color: "#FF7675" },
        "exercise": { label: "Exercise", type: "value", field: "exercise-minutes", goal: Number(settings["exercise-goal-minutes"])||30, color: "#E17055" }
    };

    const [view, setView] = dc.useState("journal");
    const [chartType, setChartType] = dc.useState("area");
    const [chartPeriod, setChartPeriod] = dc.useState("week");
    const [tooltip, setTooltip] = dc.useState(null);

    const config = METRICS[view];
    const CELL = 11; const GAP = 3;

    // 2. DATA
    const useData = () => {
        const pages = dc.useQuery("@page");
        return dc.useMemo(() => {
            const map = new Map();
            const today = dc.coerce.date(new Date().toISOString()).startOf('day');
            const start = today.minus({ weeks: 26 }).startOf('week');

            for (const p of pages) {
                const path = p.file ? p.file.path : (p.$path || p.path);
                const name = p.file ? p.file.name : (p.$name || p.name);
                if (!path) continue;

                const tfile = app.vault.getAbstractFileByPath(path);
                const cache = tfile ? app.metadataCache.getFileCache(tfile) : null;
                const fm = (cache && cache.frontmatter) ? cache.frontmatter : {}; 

                let date = dc.coerce.date(name); 
                if (!date || !date.isValid) {
                    if (fm["creation date"]) date = dc.coerce.date(fm["creation date"]);
                    else if (fm.date) date = dc.coerce.date(fm.date);
                    else if (p.file?.cday) date = p.file.cday;
                }
                if (!date || !date.isValid) continue;
                date = date.startOf('day');
                if (date < start || date > today) continue;

                let val = 0;
                if (config.type === "count") {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(name)) val = 1;
                } else {
                    let raw = fm[config.field];
                    if (raw !== undefined && raw !== null && raw !== "") {
                        const num = Number(String(raw).replace(/[^\d.]/g, ""));
                        if (!isNaN(num)) val = num;
                    }
                }

                if (val > 0) {
                    const iso = date.toISODate();
                    const existing = map.get(iso);
                    if (!existing || val > existing.val) map.set(iso, { val, file: path, date });
                }
            }

            const list = [];
            let c = start;
            while (c <= today.endOf('week')) { list.push(c); c = c.plus({ days: 1 }); }

            const values = Array.from(map.values()).map(x => x.val);
            const total = values.length;
            const avg = total ? (values.reduce((a,b)=>a+b,0)/total).toFixed(1) : 0;
            const max = Math.max(...values, 0);

            return { map, list, avg, max, total, start, today };
        }, [pages, view]);
    };

    const { map, list, avg, max, total, start, today } = useData();

    // 3. BUCKETS
    const buckets = dc.useMemo(() => {
        const res = [];
        const groups = new Map();
        let iter = start;
        while(iter <= today) {
            const iso = iter.toISODate();
            const entry = map.get(iso);
            const val = entry ? entry.val : 0;
            
            let key = "";
            if (chartPeriod === 'week') key = iter.startOf('week').toISODate();
            else key = iter.toFormat('yyyy-MM'); 

            if(!groups.has(key)) groups.set(key, { sum: 0, count: 0 });
            const g = groups.get(key);
            g.sum += val;
            if(entry) g.count += 1;
            iter = iter.plus({ days: 1 });
        }
        for (const [key, g] of groups) {
            let finalVal = 0;
            if (config.type === 'count') finalVal = g.sum;
            else finalVal = g.count > 0 ? (g.sum / g.count) : 0; 
            res.push({ val: finalVal });
        }
        return res;
    }, [map, start, today, chartPeriod, config]);

    // 4. CHART PATHS
    const CHART_H = 60;
    const CHART_W = 600; 
    const chartMax = Math.max(...buckets.map(b=>b.val), 1);
    const stepX = CHART_W / (buckets.length - 1 || 1);
    
    const getSmoothPath = (points) => {
        if (points.length < 2) return "";
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

    const pts = buckets.map((b,i) => [i*stepX, (CHART_H - (b.val/chartMax)*CHART_H)]);
    const curve = getSmoothPath(pts);
    const areaPath = `${curve} L ${CHART_W},${CHART_H} L 0,${CHART_H} Z`;

    const getOpacity = (val) => {
        if (!val) return 0.2; // Match CSS data-level="0"
        if (config.type === 'count') return 0.9;
        let pct = 0;
        if (config.goal) pct = val / config.goal;
        else if (config.max) pct = val / config.max;
        else pct = val / (max || 1);
        return Math.max(0.4, Math.min(pct, 1));
    };

    // Style Injector
    dc.useEffect(() => {
        const id = "dc-analytics-css";
        if(!document.getElementById(id)) {
            app.vault.adapter.read("System/Scripts/Styles/dc-activities.css").then(css => {
                const s = document.createElement("style");
                s.id = id;
                s.textContent = css;
                document.head.appendChild(s);
            });
        }
    }, []);

    const weeks = Math.ceil(list.length / 7);
    const width = (weeks * (CELL + GAP));
    const height = (7 * (CELL + GAP)) + 20;

    // --- RENDER ---
    return (
        <div className="ativ-heatmaps-container">
            {/* 1. HEADER + DROPDOWN */}
            <div className="ativ-dropdown">
                <select className="ativ-selector" value={view} onChange={e => setView(e.target.value)}>
                    {Object.entries(METRICS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>
            
            <div className="title-tabs">
                <span className="title-tab is-active">{config.label}</span>
            </div>

            {/* 2. HEATMAP */}
            <div className="ativ-heatmap-wrapper">
                <svg width={width} height={height} className="ativ-heatmap-svg">
                    {list.map((date, i) => {
                        const iso = date.toISODate();
                        const data = map.get(iso);
                        const col = Math.floor(i / 7);
                        const row = date.weekday - 1; 
                        const x = col * (CELL + GAP);
                        const y = row * (CELL + GAP) + 15; 
                        
                        let label = null;
                        if (row === 0 && date.day <= 7) {
                            label = <text x={x + (CELL/2)} y={10} className="ativ-heatmap-month-label">{date.toFormat("MMM")}</text>;
                        }

                        const level = data ? 1 : 0; 

                        return (
                            <g key={iso}>
                                {label}
                                <rect x={x} y={y} width={CELL} height={CELL} rx={2}
                                    data-level={level}
                                    className="ativ-heatmap-cell"
                                    fill={data ? config.color : undefined} 
                                    fillOpacity={data ? getOpacity(data.val) : undefined}
                                    onMouseEnter={e => setTooltip({x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, text: `${date.toFormat("MMM dd")}: ${data ? data.val : 0}`})}
                                    onMouseLeave={() => setTooltip(null)}
                                    onClick={() => data && app.workspace.openLinkText(data.file, "", false)}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* 3. STATS */}
            <div className="ativ-stats-grid">
                <div className="ativ-stat-col"><span className="ativ-stat-header">x̅</span><span className="ativ-stat-val">{avg}</span></div>
                <div className="ativ-stat-col"><span className="ativ-stat-header">σ</span><span className="ativ-stat-val">{max}</span></div>
                <div className="ativ-stat-col"><span className="ativ-stat-header">Mo</span><span className="ativ-stat-val">{today.toFormat("ccc")}</span></div>
                <div className="ativ-stat-col"><span className="ativ-stat-header">K</span><span className="ativ-stat-val">{total}</span></div>
                {config.goal && <div className="ativ-stat-col"><span className="ativ-stat-header">Goal</span><span className="ativ-stat-val" style={{color:config.color}}>{config.goal}</span></div>}
            </div>

            {/* 4. CHART */}
            <div className="ativ-trend-container">
                <svg viewBox={`0 -5 ${CHART_W} ${CHART_H + 5}`} preserveAspectRatio="none" className="ativ-trend-svg">
                    <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={config.color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={config.color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    
                    {chartType === 'area' ? (
                        <g>
                            <path d={areaPath} fill="url(#chartGrad)" className="ativ-trend-area-fill" />
                            <path d={curve} stroke={config.color} className="ativ-trend-area-line" />
                        </g>
                    ) : (
                        <g>
                            {/* FIX: Render Bar Chart Elements Safely */}
                            {buckets.map((b, i) => {
                                const h = (b.val / chartMax) * CHART_H;
                                return (
                                    <rect key={i} x={i * stepX} y={CHART_H - h} width={Math.max(2, stepX - 2)} height={h} fill={config.color} className="ativ-trend-bar" />
                                );
                            })}
                        </g>
                    )}
                </svg>
                
                <div className="ativ-trend-controls">
                    <div className="ativ-trend-group">
                        <span className={`ativ-toggle-btn ${chartPeriod==='week'?'is-active':''}`} onClick={()=>setChartPeriod('week')}>Week</span>
                        <span style={{opacity:0.3}}>/</span>
                        <span className={`ativ-toggle-btn ${chartPeriod==='month'?'is-active':''}`} onClick={()=>setChartPeriod('month')}>Month</span>
                    </div>
                    <span style={{color:'var(--ativ-text-muted)', margin:'0 10px', opacity:0.5}}>|</span>
                    <div className="ativ-trend-group">
                        <span className={`ativ-toggle-btn ${chartType==='area'?'is-active':''}`} onClick={()=>setChartType('area')}>Area</span>
                        <span style={{opacity:0.3}}>/</span>
                        <span className={`ativ-toggle-btn ${chartType==='bar'?'is-active':''}`} onClick={()=>setChartType('bar')}>Bar</span>
                    </div>
                </div>
            </div>

             {/* TOOLTIP */}
             {tooltip && (
                <div className="ativ-tooltip" style={{left: tooltip.x, top: tooltip.y - 30}}>
                    {tooltip.text}
                </div>
            )}
        </div>
    );
}

return { Func: AnalyticsBoard };