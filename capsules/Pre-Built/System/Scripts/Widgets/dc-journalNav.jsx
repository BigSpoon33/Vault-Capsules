/* ==================================================================
   JOURNAL BROWSER (Navigation + In-Place Preview)
   - Usage: Reads past files under "### 📔" header
   - Stop Condition: Stops reading at the next "---" horizontal rule
   ================================================================== */

function JournalBrowser() {
    // 1. AUTO-LOAD CSS
    dc.useEffect(() => {
        const loadStyles = async () => {
            const cssPath = "System/Scripts/Styles/dc-journal.css";
            const id = "dc-journal-styles";
            if (document.getElementById(id)) return;
            if (await app.vault.adapter.exists(cssPath)) {
                const css = await app.vault.adapter.read(cssPath);
                const style = document.createElement("style");
                style.id = id;
                style.textContent = css;
                document.head.appendChild(style);
            }
        };
        loadStyles();
    }, []);

    // 2. SETUP DATES
    const currentFile = app.workspace.getActiveFile();
    if (!currentFile) return null;
    
    // Parse Today's Date
    const match = currentFile.basename.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return <div style={{opacity:0.5, fontSize:'0.8em'}}>⚠️ Open a Daily Note (YYYY-MM-DD) to enable browsing.</div>;

    const todayDateObj = new Date(+match[1], +match[2] - 1, +match[3]);

    const [browsingDate, setBrowsingDate] = dc.useState(todayDateObj);
    const [previewContent, setPreviewContent] = dc.useState(null);
    const [isLoading, setIsLoading] = dc.useState(false);

    // 3. FETCH CONTENT EFFECT (Updated Logic Here)
    dc.useEffect(() => {
        async function fetchJournal() {
            if (browsingDate.getTime() === todayDateObj.getTime()) {
                setPreviewContent(null);
                return;
            }

            setIsLoading(true);
            const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const targetName = toIso(browsingDate);
            
            const file = app.metadataCache.getFirstLinkpathDest(targetName, "");
            
            if (!file) {
                setPreviewContent("(No note exists for this day)");
                setIsLoading(false);
                return;
            }

            const text = await app.vault.read(file);
            
            // --- PARSING LOGIC START ---
            // 1. Split by the Journal Header (multiline aware)
            const parts = text.split(/^###\s+📔.*$/m);
            
            if (parts.length > 1) {
                let rawContent = parts[1];
                
                // 2. STOP at the next Horizontal Rule (---)
                // We split by a line starting with ---
                const contentSegments = rawContent.split(/^\s*---/m);
                
                // Take the first chunk and trim whitespace
                setPreviewContent(contentSegments[0].trim());
            } else {
                setPreviewContent("(Note exists, but no '### 📔' journal section found)");
            }
            // --- PARSING LOGIC END ---
            
            setIsLoading(false);
        }
        fetchJournal();
    }, [browsingDate]);

    // 4. HELPERS
    const shiftDate = (days) => {
        const newDate = new Date(browsingDate);
        newDate.setDate(browsingDate.getDate() + days);
        setBrowsingDate(newDate);
    };

    const goHome = () => setBrowsingDate(todayDateObj);
    
    const renderMarkdown = (text) => {
        if (!text) return "";
        let html = text
            .replace(/\n/g, "<br/>") 
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") 
            .replace(/\[\[(.*?)\]\]/g, "<span class='internal-link'>$1</span>");
        return <div dangerouslySetInnerHTML={{__html: html}} />;
    };

    // 5. STYLES
    const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontFamily: 'sans-serif', fontSize: '0.9em', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom:'10px' };
    const btnStyle = { background: 'rgba(255,255,255,0.5)', border: '1px solid #d3ccb4', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', color: '#7a6a62', select: 'none' };
    const dateStyle = { fontWeight: 'bold', color: '#5a4a42', cursor: 'pointer' };
    
    const previewStyle = {
        background: 'rgba(255,255,255,0.4)',
        border: '1px dashed #d3ccb4',
        padding: '15px',
        borderRadius: '4px',
        marginTop: '10px',
        marginBottom: '20px',
        minHeight: '60px',
        fontStyle: previewContent ? 'normal' : 'italic',
        opacity: previewContent ? 1 : 0.7
    };

    const isToday = browsingDate.getTime() === todayDateObj.getTime();

    return (
        <div>
            <div className="dc-journal-nav" style={navStyle}>
                <button style={btnStyle} onClick={() => shiftDate(-1)}>← Prev</button>
                <span style={dateStyle} onClick={goHome} title="Return to Today">
                    {browsingDate.toLocaleDateString(undefined, {weekday:'long', month:'short', day:'numeric'})}
                    {!isToday && <span style={{fontSize:'0.8em', opacity:0.6, marginLeft:'5px'}}>(Viewing)</span>}
                </span>
                <button style={btnStyle} onClick={() => shiftDate(1)}>Next →</button>
            </div>

            {!isToday && (
                <div style={previewStyle}>
                    {isLoading ? "⏳ Loading..." : renderMarkdown(previewContent)}
                    {previewContent && !previewContent.includes("(No note") && (
                        <div style={{marginTop:'10px', textAlign:'right', fontSize:'0.8em'}}>
                             <a onClick={() => app.workspace.openLinkText(toIso(browsingDate), "", false)} style={{cursor:'pointer', opacity:0.6}}>
                                ↗ Open File
                             </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

return { Func: JournalBrowser };