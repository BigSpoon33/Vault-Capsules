// System/Scripts/dc-randomQuote.jsx

function QuoteView() {
    // 1. QUERY
    const pages = dc.useQuery("@page");

    // 2. FILTER (Exclude Templates & Find Quotes)
    const quoteNotes = dc.useMemo(() => {
        if (!pages) return [];
        
        return pages.filter(p => {
            // A. Check Name: Exclude if it contains "Template"
            if (p.$name && p.$name.includes("Template")) return false;

            // B. Check Categories: Must have [[Quotes]]
            const cats = p.value("categories");
            if (!cats) return false;
            
            const catArray = Array.isArray(cats) ? cats : [cats];
            return catArray.some(c => c && c.toString().toLowerCase().includes("quote"));
        });
    }, [pages]);

    // 3. STATE
    const [quoteContent, setQuoteContent] = dc.useState(null);

    // 4. FILE READING
    dc.useEffect(() => {
        if (quoteNotes.length > 0 && !quoteContent) {
            const randomIndex = Math.floor(Math.random() * quoteNotes.length);
            const randomNote = quoteNotes[randomIndex];
            
            const rawAuthor = randomNote.value("attribution");
            const author = rawAuthor?.fileName ? rawAuthor.fileName() : (rawAuthor || "Unknown");
            const filePath = randomNote.$path; 
            
            const file = app.vault.getAbstractFileByPath(filePath);
            
            if (file) {
                app.vault.cachedRead(file).then(content => {
                    const cleanText = content.replace(/^---[\s\S]+?---/, '').trim();
                    setQuoteContent({
                        text: cleanText,
                        author: author,
                        noteName: randomNote.$name
                    });
                }).catch(err => {
                    console.error("Read error:", err);
                    setQuoteContent({ text: "Error reading file.", author: "System" });
                });
            } else {
                setQuoteContent({ text: "File path error.", author: "System" });
            }
        }
    }, [quoteNotes]); 

    // 5. RENDER
    if (!pages) return <div style={{opacity: 0.5}}>⏳ Datacore indexing...</div>;

    if (quoteNotes.length === 0) {
        return (
            <div style={{opacity: 0.7, padding: '10px', border: '1px dashed var(--text-muted)'}}>
                🚫 No quotes found. (Checked {pages.length} notes)
            </div>
        );
    }

    if (!quoteContent) {
        return <div style={{opacity: 0.5}}>📖 Reading random quote...</div>;
    }

    return (
        <div style={{
            marginTop: '10px',
            background: 'var(--background-secondary)',
            padding: '16px 20px',
            borderLeft: '4px solid var(--text-accent)',
            borderRadius: '0 8px 8px 0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                <span style={{fontSize: '1.2em'}}>💡</span>
                <span style={{fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75em', letterSpacing: '1px', opacity: 0.7}}>
                    Daily Insight
                </span>
            </div>
            
            <div style={{
                fontSize: '1.1em', 
                lineHeight: '1.6em', 
                fontStyle: 'italic',
                marginBottom: '16px',
                fontFamily: 'var(--font-text)'
            }}>
                "{quoteContent.text}"
            </div>
            
            <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.85em', 
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--background-modifier-border)',
                paddingTop: '8px'
            }}>
                <span>— {quoteContent.author}</span>
                <span style={{opacity: 0.4, fontSize: '0.8em'}} title="Source Note">
                    {quoteContent.noteName}
                </span>
            </div>
        </div>
    );
}

// EXPORT THE COMPONENT
return { Func: QuoteView };