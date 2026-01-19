// ═══════════════════════════════════════════════════════════════════════════════
// THEME PREVIEW CONTENT v1.0
// Shared component for displaying live preview of all Glo* components
// Used by both Theme Dashboard and Theme Editor
//
// Features:
//   - Comprehensive preview of all component variations
//   - Accepts theme object to display with custom colors/sprites
//   - Mobile-friendly layout
//   - All interactive demos work (draggable bars, clickable toggles, etc.)
//
// Usage:
//   const { ThemePreviewContent } = await dc.require(
//       dc.fileLink("System/Scripts/Components/dc-themePreviewContent.jsx")
//   );
//   <ThemePreviewContent theme={myThemeObject} />
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useComponentCSS } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);
const { GloButton } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);
const { GloBar } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBar.jsx")
);
const { GloToggle } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx")
);
const { GloBadge } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);
const { GloCard } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloCard.jsx")
);
const { GloInput } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloInput.jsx")
);
const { GloSelect } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx")
);
const { GloTabs } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloTabs.jsx")
);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Preview Section Wrapper
// ═══════════════════════════════════════════════════════════════════════════════

function PreviewSection({ title, color, children }) {
    return (
        <div style={styles.previewSection}>
            <h4 style={{ 
                ...styles.previewSectionTitle, 
                color: color,
                borderBottom: `1px solid ${color}33`
            }}>
                {title}
            </h4>
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: ThemePreviewContent
// ═══════════════════════════════════════════════════════════════════════════════

function ThemePreviewContent({ theme, compact = false }) {
    // Load shared CSS for animations
    useComponentCSS();
    
    // Local state for interactive previews
    const [barValue, setBarValue] = dc.useState(65);
    const [inputValue, setInputValue] = dc.useState("");
    const [selectValue, setSelectValue] = dc.useState("option1");
    
    // Extract colors from theme
    const primary = theme["color-primary"] || theme["color-accent"] || "#7c3aed";
    const accent = theme["color-accent"] || "#f59e0b";
    const surface = theme["color-surface"] || "#2a2a3e";
    const textMuted = theme["color-text-muted"] || "#a0a0b0";
    const textColor = theme["color-text"] || "#ffffff";
    const success = theme["color-success"] || "#10b981";
    const warning = theme["color-warning"] || "#f59e0b";
    const error = theme["color-error"] || "#ef4444";
    
    // Extract sprite/visual properties from theme for overrides
    const barSprite = theme["bar-sprite"] || null;
    const barSpriteWidth = theme["bar-sprite-width"] || 34;
    const barSpriteHeight = theme["bar-sprite-height"] || 21;
    const barTrackBg = theme["bar-track-bg"] || null;
    const barFillGradient = theme["bar-fill-gradient"] || `linear-gradient(90deg, ${primary}, ${accent})`;
    const barHeight = theme["bar-height"] || "14px";
    const barBorderRadius = theme["bar-border-radius"] || "6px";
    const barClickAnimation = theme["bar-sprite-click-animation"] || "squish";
    
    const toggleSprite = theme["toggle-sprite"] || theme["bar-sprite"] || null;
    const toggleSpriteWidth = theme["toggle-sprite-width"] || theme["bar-sprite-width"] || 34;
    const toggleSpriteHeight = theme["toggle-sprite-height"] || theme["bar-sprite-height"] || 21;
    const toggleIdleBg = theme["toggle-idle-bg"] || null;
    const toggleActiveBg = theme["toggle-active-bg"] || null;
    const toggleClickAnimation = theme["toggle-sprite-click-animation"] || "squish";
    
    const buttonSprite = theme["button-sprite"] || theme["bar-sprite"] || null;
    const buttonSpriteWidth = theme["button-sprite-width"] || theme["bar-sprite-width"] || 34;
    const buttonSpriteHeight = theme["button-sprite-height"] || theme["bar-sprite-height"] || 21;
    const buttonIdleBg = theme["button-idle-bg"] || null;
    const buttonHoverBg = theme["button-hover-bg"] || null;
    const buttonActiveBg = theme["button-active-bg"] || null;
    const buttonClickAnimation = theme["button-sprite-click-animation"] || "bounce";

    return (
        <div style={styles.previewContent}>
            
            {/* ─── COLOR PALETTE ─── */}
            <PreviewSection title="Color Palette" color={primary}>
                <div style={styles.colorPalette}>
                    {[
                        { name: "Primary", color: primary },
                        { name: "Accent", color: accent },
                        { name: "Success", color: success },
                        { name: "Warning", color: warning },
                        { name: "Error", color: error },
                        { name: "Surface", color: surface },
                    ].map(({ name, color }) => (
                        <div key={name} style={styles.paletteItem}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: color,
                                border: '1px solid rgba(255,255,255,0.1)'
                            }} />
                            <span style={{ fontSize: '10px', color: textMuted }}>{name}</span>
                        </div>
                    ))}
                </div>
            </PreviewSection>

            {/* ─── PROGRESS BAR ─── */}
            <PreviewSection title="Progress Bar (GloBar)" color={primary}>
                <GloBar
                    value={barValue}
                    max={100}
                    draggable={true}
                    onChange={setBarValue}
                    showValue={true}
                    label="Draggable Progress"
                    sprite={barSprite}
                    spriteWidth={barSpriteWidth}
                    spriteHeight={barSpriteHeight}
                    trackBg={barTrackBg}
                    fillGradient={barFillGradient}
                    height={barHeight}
                    borderRadius={barBorderRadius}
                    clickAnimation={barClickAnimation}
                    themeOverride={theme}
                />
            </PreviewSection>

            {/* ─── TOGGLES ─── */}
            <PreviewSection title="Toggle (GloToggle)" color={primary}>
                <div style={styles.toggleRow}>
                    <div style={styles.toggleDemo}>
                        <span style={{ fontSize: '12px', color: textMuted, marginBottom: '8px' }}>ON State</span>
                        <GloToggle
                            targetKey="__preview_toggle_on"
                            targetFile="System/Settings.md"
                            onLabel={theme["label-active"] || "Active"}
                            offLabel={theme["label-inactive"] || "Inactive"}
                            sprite={toggleSprite}
                            spriteWidth={toggleSpriteWidth}
                            spriteHeight={toggleSpriteHeight}
                            idleBg={toggleIdleBg}
                            activeBg={toggleActiveBg}
                            spriteAnimation={toggleClickAnimation}
                            themeOverride={theme}
                        />
                    </div>
                    <div style={styles.toggleDemo}>
                        <span style={{ fontSize: '12px', color: textMuted, marginBottom: '8px' }}>OFF State</span>
                        <GloToggle
                            targetKey="__preview_toggle_off"
                            targetFile="System/Settings.md"
                            onLabel={theme["label-active"] || "Active"}
                            offLabel={theme["label-inactive"] || "Inactive"}
                            sprite={toggleSprite}
                            spriteWidth={toggleSpriteWidth}
                            spriteHeight={toggleSpriteHeight}
                            idleBg={toggleIdleBg}
                            activeBg={toggleActiveBg}
                            spriteAnimation={toggleClickAnimation}
                            themeOverride={theme}
                        />
                    </div>
                </div>
            </PreviewSection>

            {/* ─── BUTTONS ─── */}
            <PreviewSection title="Buttons (GloButton)" color={primary}>
                <div style={styles.buttonGrid}>
                    <GloButton
                        label="Primary"
                        variant="primary"
                        size="small"
                        bg={buttonIdleBg}
                        hoverBg={buttonHoverBg}
                        activeBg={buttonActiveBg}
                        themeOverride={theme}
                    />
                    <GloButton label="Secondary" variant="secondary" size="small" themeOverride={theme} />
                    <GloButton label="Ghost" variant="ghost" size="small" themeOverride={theme} />
                    <GloButton label="Success" variant="success" size="small" themeOverride={theme} />
                    <GloButton label="Warning" variant="warning" size="small" themeOverride={theme} />
                    <GloButton label="Error" variant="error" size="small" themeOverride={theme} />
                </div>
                <div style={{ marginTop: '12px' }}>
                    <GloButton
                        label="With Sprite"
                        variant="primary"
                        showSprite={true}
                        sprite={buttonSprite}
                        spriteWidth={buttonSpriteWidth}
                        spriteHeight={buttonSpriteHeight}
                        spriteAnimation={buttonClickAnimation}
                        bg={buttonIdleBg}
                        hoverBg={buttonHoverBg}
                        activeBg={buttonActiveBg}
                        themeOverride={theme}
                    />
                </div>
            </PreviewSection>

            {/* ─── BADGES ─── */}
            <PreviewSection title="Badges (GloBadge)" color={primary}>
                <div style={styles.badgeRow}>
                    <GloBadge status="info">Info</GloBadge>
                    <GloBadge status="success">Success</GloBadge>
                    <GloBadge status="warning">Warning</GloBadge>
                    <GloBadge status="error">Error</GloBadge>
                    <GloBadge status="neutral">Neutral</GloBadge>
                    <GloBadge color={primary}>Primary</GloBadge>
                </div>
                <div style={{ ...styles.badgeRow, marginTop: '8px' }}>
                    <GloBadge variant="outlined" color={accent}>Outlined</GloBadge>
                    <GloBadge removable={true} onRemove={() => {}} color={primary}>Removable</GloBadge>
                    <GloBadge pulse={true} status="error">Pulse</GloBadge>
                </div>
            </PreviewSection>

            {/* ─── CARDS ─── */}
            <PreviewSection title="Cards (GloCard)" color={primary}>
                <div style={styles.cardGrid}>
                    <GloCard
                        title="Default Card"
                        variant="default"
                        size="small"
                        bg={theme["card-bg-color"] || surface}
                        accentColor={primary}
                        themeOverride={theme}
                    >
                        <p style={{ margin: 0, fontSize: '12px', color: textMuted }}>
                            Standard card with default styling.
                        </p>
                    </GloCard>
                    <GloCard
                        title="Elevated Card"
                        variant="elevated"
                        size="small"
                        bg={theme["card-bg-color"] || surface}
                        accentColor={primary}
                        themeOverride={theme}
                    >
                        <p style={{ margin: 0, fontSize: '12px', color: textMuted }}>
                            Card with elevated shadow.
                        </p>
                    </GloCard>
                    <GloCard
                        title="Outlined Card"
                        variant="outlined"
                        size="small"
                        bg={theme["card-bg-color"] || surface}
                        borderColor={primary}
                        accentColor={primary}
                        themeOverride={theme}
                    >
                        <p style={{ margin: 0, fontSize: '12px', color: textMuted }}>
                            Card with visible border.
                        </p>
                    </GloCard>
                </div>
            </PreviewSection>

            {/* ─── INPUTS ─── */}
            <PreviewSection title="Inputs (GloInput)" color={primary}>
                <div style={styles.inputGrid}>
                    <GloInput
                        type="text"
                        placeholder="Text input..."
                        label="Text"
                        value={inputValue}
                        onChange={setInputValue}
                        bgOverride={theme["input-bg"]}
                        borderOverride={theme["input-border"]}
                        borderFocusOverride={theme["input-border-focus"]}
                        accentColorOverride={primary}
                        themeOverride={theme}
                    />
                    <GloInput
                        type="number"
                        placeholder="0"
                        label="Number"
                        min={0}
                        max={100}
                        bgOverride={theme["input-bg"]}
                        borderOverride={theme["input-border"]}
                        borderFocusOverride={theme["input-border-focus"]}
                        accentColorOverride={primary}
                        themeOverride={theme}
                    />
                </div>
                <div style={{ marginTop: '12px' }}>
                    <GloInput
                        type="textarea"
                        placeholder="Multi-line text..."
                        label="Textarea"
                        rows={2}
                        bgOverride={theme["input-bg"]}
                        borderOverride={theme["input-border"]}
                        borderFocusOverride={theme["input-border-focus"]}
                        accentColorOverride={primary}
                        themeOverride={theme}
                    />
                </div>
            </PreviewSection>

            {/* ─── SELECT ─── */}
            <PreviewSection title="Select (GloSelect)" color={primary}>
                <div style={styles.selectGrid}>
                    <GloSelect
                        options={[
                            { value: "option1", label: "Option One" },
                            { value: "option2", label: "Option Two" },
                            { value: "option3", label: "Option Three" },
                        ]}
                        value={selectValue}
                        onChange={setSelectValue}
                        label="Dropdown"
                        placeholder="Select an option..."
                        bgOverride={theme["select-bg"] || theme["input-bg"]}
                        borderOverride={theme["select-border"] || theme["input-border"]}
                        accentColorOverride={primary}
                        themeOverride={theme}
                    />
                    <GloSelect
                        options={[
                            { value: "a", label: "Apple", icon: "🍎" },
                            { value: "b", label: "Banana", icon: "🍌" },
                            { value: "c", label: "Cherry", icon: "🍒" },
                        ]}
                        label="With Icons"
                        placeholder="Choose fruit..."
                        searchable={true}
                        bgOverride={theme["select-bg"] || theme["input-bg"]}
                        borderOverride={theme["select-border"] || theme["input-border"]}
                        accentColorOverride={primary}
                        themeOverride={theme}
                    />
                </div>
            </PreviewSection>

            {/* ─── TABS ─── */}
            <PreviewSection title="Tabs (GloTabs)" color={primary}>
                <div style={styles.tabsGrid}>
                    <div>
                        <span style={{ fontSize: '11px', color: textMuted, marginBottom: '8px', display: 'block' }}>Underline</span>
                        <GloTabs
                            tabs={[
                                { id: "t1", label: "Tab 1" },
                                { id: "t2", label: "Tab 2" },
                                { id: "t3", label: "Tab 3" },
                            ]}
                            variant="underline"
                            renderContent={false}
                            size="small"
                            accentColorOverride={primary}
                            surfaceColorOverride={surface}
                        />
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', color: textMuted, marginBottom: '8px', display: 'block' }}>Pills</span>
                        <GloTabs
                            tabs={[
                                { id: "t1", label: "Tab 1" },
                                { id: "t2", label: "Tab 2" },
                                { id: "t3", label: "Tab 3" },
                            ]}
                            variant="pills"
                            renderContent={false}
                            size="small"
                            accentColorOverride={primary}
                            surfaceColorOverride={surface}
                        />
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', color: textMuted, marginBottom: '8px', display: 'block' }}>Boxed</span>
                        <GloTabs
                            tabs={[
                                { id: "t1", label: "Tab 1" },
                                { id: "t2", label: "Tab 2" },
                                { id: "t3", label: "Tab 3" },
                            ]}
                            variant="boxed"
                            renderContent={false}
                            accentColorOverride={primary}
                            surfaceColorOverride={surface}
                            size="small"
                        />
                    </div>
                </div>
            </PreviewSection>

        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
    previewContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    previewSection: {
        marginBottom: '0',
    },
    previewSectionTitle: {
        fontSize: '12px',
        fontWeight: '600',
        margin: '0 0 12px 0',
        paddingBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    
    // Color palette
    colorPalette: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
    },
    paletteItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
    },
    
    // Toggle row
    toggleRow: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
    },
    toggleDemo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    
    // Button grid
    buttonGrid: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    
    // Badge row
    badgeRow: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    
    // Card grid
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
    },
    
    // Input grid
    inputGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
    },
    
    // Select grid
    selectGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
    },
    
    // Tabs grid
    tabsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const renderedView = (
    <div style={{ padding: '16px', background: '#1e1e2e', borderRadius: '12px' }}>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
            ThemePreviewContent Demo (using default theme)
        </p>
        <ThemePreviewContent theme={{}} />
    </div>
);

return { 
    renderedView, 
    ThemePreviewContent,
    PreviewSection,
};
