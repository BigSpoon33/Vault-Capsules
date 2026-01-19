---
tags:
  - showcase
  - components
  - dashboards
cssclasses:
  - dashboard
demo_toggle: false
night_mode: true
feature_enabled: false
progress_value: 59
water_intake: 2200
---

<a href='https://ko-fi.com/M4M11S2NNW' target='_blank'><img height='36' width ='108' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

# Glo* Component Library Showcase

Complete demonstration of the themed component library for Obsidian DatacoreJS. All components are **mobile-friendly** with proper touch targets and responsive layouts.

---

## Theme Studio

The Theme Studio provides complete theme management - browse, apply, and edit themes.
# Theme Studio

```datacorejsx
const scriptPath = "System/Scripts/Widgets/dc-themeStudio.jsx";
const target = dc.fileLink(scriptPath);
const result = await dc.require(target);
const view = result?.renderedView ?? result?.View ?? result;  
const Func = result?.Func ?? null;

return function View() {
    const currentFile = dc.useCurrentFile();
    if (Func) {
        return Func({ currentFile, scriptPath });
    }
    return view ?? <p>Failed to render</p>;
}
```
---

## Mobile Compatibility

All Glo* components have been optimized for mobile/touch devices:

| Component | Touch Features |
|-----------|----------------|
| **GloButton** | Touch feedback on press, `touchAction: manipulation` |
| **GloBar** | Expanded sprite touch target (min 44x44px), touch drag support |
| **GloToggle** | Responsive width (`maxWidth` instead of fixed), touch feedback |
| **GloCard** | `touchAction: manipulation` when clickable |
| **GloInput** | Larger clear button (44x44px touch target) |
| **GloSelect** | Auto-positioning dropdown, 44px min-height options |
| **GloTabs** | Horizontal scroll with snap, 44px min touch targets |
| **GloBadge** | Larger touch targets when interactive, enhanced remove button |
| **GloDial** | Full touch drag support, expanded knob touch target, `touchAction: none` |

---

## GloButton

```datacorejsx
const { GloButton } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloButton.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem'}}>

        {/* Variants */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Variants</h4>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <GloButton label="Primary" onClick={() => new Notice('Primary clicked!')} />
                <GloButton label="Secondary" variant="secondary" onClick={() => new Notice('Secondary!')} />
                <GloButton label="Ghost" variant="ghost" onClick={() => new Notice('Ghost!')} />
            </div>
        </div>

        {/* Sizes */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Sizes</h4>
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap'}}>
                <GloButton label="Small" size="small" onClick={() => {}} />
                <GloButton label="Medium" size="medium" onClick={() => {}} />
                <GloButton label="Large" size="large" onClick={() => {}} />
            </div>
        </div>

        {/* Effects */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Effects (hover to see)</h4>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <GloButton label="Rainbow!" rainbow={true} onClick={() => {}} />
                <GloButton label="Glow Only" lift={false} press={false} onClick={() => {}} />
                <GloButton label="Lift Only" glow={false} press={false} onClick={() => {}} />
                <GloButton label="No Effects" glow={false} lift={false} press={false} onClick={() => {}} />
            </div>
        </div>

        {/* Icons */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>With Icons</h4>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <GloButton label="Rocket" icon="🚀" onClick={() => {}} />
                <GloButton label="Next" iconRight="→" onClick={() => {}} />
                <GloButton label="Both" icon="⭐" iconRight="✨" onClick={() => {}} />
                <GloButton label="Cat" icon="🐱" rainbow={true} onClick={() => {}} />
            </div>
        </div>

        {/* Sprite Buttons (click to animate!) */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>With Sprite (click to animate!)</h4>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <GloButton label="Sprite!" showSprite={true} onClick={() => {}} />
                <GloButton label="Right Side" showSprite={true} spritePosition="right" onClick={() => {}} />
                <GloButton label="Rainbow Sprite" showSprite={true} rainbow={true} onClick={() => {}} />
            </div>
        </div>

        {/* States */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>States</h4>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <GloButton label="Normal" onClick={() => {}} />
                <GloButton label="Active" active={true} onClick={() => {}} />
                <GloButton label="Disabled" disabled={true} onClick={() => {}} />
                <GloButton label="Loading" loading={true} onClick={() => {}} />
            </div>
        </div>

        {/* Mixed */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Combinations</h4>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <GloButton
                    label="Rainbow Ghost"
                    variant="ghost"
                    rainbow={true}
                    icon="🌈"
                    onClick={() => new Notice('Rainbow Ghost!')}
                />
                <GloButton
                    label="Large Secondary"
                    variant="secondary"
                    size="large"
                    icon="💫"
                    onClick={() => {}}
                />
                <GloButton
                    label="Small Active"
                    size="small"
                    active={true}
                    onClick={() => {}}
                />
            </div>
        </div>

    </div>
);
```

### GloButton Usage

```javascript
const { GloButton } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

<GloButton
    label="Click Me"
    icon="🎉"
    rainbow={true}
    onClick={() => new Notice('Clicked!')}
/>
```

### GloButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | required | Button text |
| `onClick` | function | `() => {}` | Click handler |
| `variant` | string | `"primary"` | `"primary"`, `"secondary"`, `"ghost"` |
| `size` | string | `"medium"` | `"small"`, `"medium"`, `"large"` |
| `bg` | string | theme | Custom background (base64/gradient/color) |
| `hoverBg` | string | theme | Custom hover background |
| `activeBg` | string | theme | Custom active background |
| `glow` | boolean | `true` | Enable glow on hover |
| `lift` | boolean | `true` | Enable lift on hover |
| `press` | boolean | `true` | Enable press on click |
| `rainbow` | boolean | `false` | Rainbow text on hover |
| `icon` | string | `null` | Left icon/emoji |
| `iconRight` | string | `null` | Right icon/emoji |
| `showSprite` | boolean | `false` | Show theme sprite |
| `spritePosition` | string | `"left"` | `"left"` or `"right"` |
| `disabled` | boolean | `false` | Disable button |
| `loading` | boolean | `false` | Show loading spinner |
| `active` | boolean | `false` | Force active state |

---

## GloToggle

```datacorejsx
const { GloToggle } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem'}}>

        {/* Basic Toggle */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Basic Toggle (uses theme labels)</h4>
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <GloToggle targetKey="night_mode" />
            </div>
        </div>

        {/* Custom Labels */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Custom Labels</h4>
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <GloToggle
                    targetKey="feature_enabled"
                    onLabel="Feature ON"
                    offLabel="Feature OFF"
                    onSub="All systems go!"
                    offSub="Click to enable"
                />
            </div>
        </div>

        {/* Without Sprite */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Without Sprite</h4>
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <GloToggle
                    targetKey="demo_toggle"
                    showSprite={false}
                    onLabel="Enabled"
                    offLabel="Disabled"
                    width="150px"
                />
            </div>
        </div>

        {/* Effects Variations */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Effect Variations</h4>
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <GloToggle
                    targetKey="demo_toggle"
                    rainbow={false}
                    onLabel="No Rainbow"
                    offLabel="No Rainbow"
                />
                <GloToggle
                    targetKey="demo_toggle"
                    glow={false}
                    onLabel="No Glow"
                    offLabel="No Glow"
                />
            </div>
        </div>

    </div>
);
```

### GloToggle Usage

```javascript
const { GloToggle } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloToggle.jsx")
);

<GloToggle
    targetKey="night_mode"
    onLabel="Night Mode ON"
    offLabel="Night Mode OFF"
    onChange={(value) => console.log('Toggled to:', value)}
/>
```

### GloToggle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetKey` | string | required | Frontmatter key to toggle |
| `targetFile` | string | `null` | File path (null = current file) |
| `onLabel` | string | theme | Label when ON |
| `offLabel` | string | theme | Label when OFF |
| `onSub` | string | theme | Sub-label when ON |
| `offSub` | string | theme | Sub-label when OFF |
| `showSprite` | boolean | `true` | Show theme sprite |
| `sprite` | string | theme | Custom sprite base64 |
| `idleBg` | string | theme | Background when OFF |
| `hoverBg` | string | theme | Background on hover |
| `activeBg` | string | theme | Background when ON |
| `glow` | boolean | `true` | Enable glow effects |
| `rainbow` | boolean | `true` | Rainbow text on hover/active |
| `width` | string | `"100%"` | Container width (maxWidth: 220px) |
| `onChange` | function | `null` | Callback with new value |

---

## GloBar

```datacorejsx
const { GloBar } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloBar.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', maxWidth: '450px'}}>

        {/* Basic Progress */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Basic Progress Bar</h4>
            <GloBar
                value={65}
                label="Project Progress"
            />
        </div>

        {/* Frontmatter-bound draggable */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Draggable (Bound to Frontmatter)</h4>
            <GloBar
                targetKey="progress_value"
                label="Drag to set value"
                draggable={true}
            />
            <div style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>
                Click the sprite for animation! Drag to change value.
            </div>
        </div>

        {/* Custom max value */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Custom Max (Water Tracker)</h4>
            <GloBar
                targetKey="water_intake"
                max={3500}
                label="Water Intake (ml)"
                draggable={true}
                step={100}
                valueFormat={(v, m) => `${v}ml / ${m}ml`}
            />
        </div>

        {/* Different animations - all draggable */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Animation Variations (click sprite to animate!)</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <GloBar value={50} label="Squish" clickAnimation="squish" draggable={true} />
                <GloBar value={50} label="Spin" clickAnimation="spin" draggable={true} />
                <GloBar value={50} label="Jiggle" clickAnimation="jiggle" draggable={true} />
                <GloBar value={50} label="Bounce" clickAnimation="bounce" draggable={true} />
                <GloBar value={50} label="Twist" clickAnimation="twist" draggable={true} />
                <GloBar value={50} label="Pulse" clickAnimation="pulse" draggable={true} />
                <GloBar value={50} label="Wiggle" clickAnimation="wiggle" draggable={true} />
                <GloBar value={50} label="Flip" clickAnimation="flip" draggable={true} />
            </div>
        </div>

        {/* Without sprite */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Without Sprite</h4>
            <GloBar
                value={80}
                label="Simple Progress"
                showSprite={false}
                showPercentage={true}
            />
        </div>

    </div>
);
```

### GloBar Usage

```javascript
const { GloBar } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBar.jsx")
);

// Simple progress
<GloBar value={75} label="Progress" />

// Frontmatter-bound draggable
<GloBar
    targetKey="water_intake"
    max={3500}
    label="Water (ml)"
    draggable={true}
    step={100}
/>

// Custom animation
<GloBar
    value={50}
    clickAnimation="spin"
/>
```

### GloBar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | number | `null` | Controlled value |
| `max` | number | `100` | Maximum value |
| `targetKey` | string | `null` | Frontmatter key to bind |
| `targetFile` | string | `null` | File path (null = current) |
| `label` | string | `null` | Label text above bar |
| `showValue` | boolean | `true` | Show value text |
| `valueFormat` | function | `null` | Custom format: `(value, max) => string` |
| `showPercentage` | boolean | `false` | Show as percentage |
| `showSprite` | boolean | `true` | Show theme sprite |
| `sprite` | string | theme | Custom sprite base64 |
| `clickAnimation` | string | theme | squish, spin, twist, jiggle, bounce, pulse, wiggle, flip, none |
| `draggable` | boolean | `false` | Enable drag to set value |
| `step` | number | `1` | Step size when dragging |
| `trackBg` | string | theme | Track background |
| `fillGradient` | string | theme | Fill gradient |
| `height` | string | theme | Bar height |
| `vertical` | boolean | `false` | Enable vertical mode |
| `length` | string | `"150px"` | Bar length (vertical mode) |
| `onChange` | function | `null` | Callback with new value |

---

## GloSelect

```datacorejsx
const { GloSelect } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', maxWidth: '350px'}}>

        {/* Basic select with icons */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Basic Select</h4>
            <GloSelect
                label="Meal Category"
                options={[
                    { value: "breakfast", label: "Breakfast", icon: "🍳" },
                    { value: "lunch", label: "Lunch", icon: "🥗" },
                    { value: "dinner", label: "Dinner", icon: "🍝" },
                    { value: "snack", label: "Snack", icon: "🍿" },
                ]}
                placeholder="Choose a meal..."
                onChange={(v) => new Notice('Selected: ' + v)}
            />
        </div>

        {/* Searchable */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Searchable</h4>
            <GloSelect
                label="Search Fruits"
                options={["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape", "Honeydew"]}
                searchable={true}
                placeholder="Type to search..."
            />
        </div>

        {/* Multiple selection */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Multiple Selection</h4>
            <GloSelect
                label="Workout Types"
                options={[
                    { value: "strength", label: "Strength", icon: "💪" },
                    { value: "cardio", label: "Cardio", icon: "🏃" },
                    { value: "flexibility", label: "Flexibility", icon: "🧘" },
                    { value: "balance", label: "Balance", icon: "⚖️" },
                ]}
                multiple={true}
                placeholder="Select types..."
            />
        </div>

        {/* Sizes */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Sizes</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <GloSelect options={["Small option"]} size="small" placeholder="Small" />
                <GloSelect options={["Medium option"]} size="medium" placeholder="Medium" />
                <GloSelect options={["Large option"]} size="large" placeholder="Large" />
            </div>
        </div>

    </div>
);
```

### GloSelect Usage

```javascript
const { GloSelect } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx")
);

<GloSelect
    label="Category"
    options={[
        { value: "a", label: "Option A", icon: "🅰️" },
        { value: "b", label: "Option B", icon: "🅱️" },
    ]}
    searchable={true}
    multiple={false}
    position="auto"
    onChange={(value) => console.log(value)}
/>
```

---

## GloCard

```datacorejsx
const { GloCard } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloCard.jsx"));
const { GloButton } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloButton.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', maxWidth: '400px'}}>

        {/* Basic card */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Basic Card</h4>
            <GloCard
                title="Project Update"
                subtitle="Last updated today"
                icon="📋"
            >
                <p style={{margin: 0}}>This is the card body. Cards are great for grouping related content together.</p>
            </GloCard>
        </div>

        {/* With footer and actions */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>With Footer & Actions</h4>
            <GloCard
                title="Task Card"
                icon="✅"
                actions={<GloButton label="Edit" size="small" variant="ghost" onClick={() => {}} />}
                footer={<span>Due: Tomorrow</span>}
            >
                <p style={{margin: 0}}>Complete the component library.</p>
            </GloCard>
        </div>

        {/* Collapsible */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Collapsible</h4>
            <GloCard
                title="Click to Collapse"
                icon="📁"
                collapsible={true}
            >
                <p style={{margin: 0}}>This content can be collapsed by clicking the header!</p>
            </GloCard>
        </div>

        {/* Variants */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Variants</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <GloCard variant="default" title="Default" size="small">
                    <span>Standard card</span>
                </GloCard>
                <GloCard variant="glass" title="Glass" size="small" glow={true}>
                    <span>Glass morphism effect</span>
                </GloCard>
                <GloCard variant="elevated" title="Elevated" size="small">
                    <span>Elevated shadow</span>
                </GloCard>
                <GloCard variant="outlined" title="Outlined" size="small">
                    <span>Border only</span>
                </GloCard>
            </div>
        </div>

    </div>
);
```

### GloCard Usage

```javascript
const { GloCard } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloCard.jsx")
);

<GloCard
    title="My Card"
    subtitle="Description"
    icon="📦"
    variant="glass"
    collapsible={true}
    footer={<span>Footer text</span>}
>
    Card content here
</GloCard>
```

---

## GloTabs

```datacorejsx
const { GloTabs } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloTabs.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', maxWidth: '500px'}}>

        {/* Underline (default) */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Underline Tabs</h4>
            <GloTabs
                tabs={[
                    { id: "today", label: "Today", icon: "📅", content: <p>Today's tasks and events appear here.</p> },
                    { id: "week", label: "This Week", icon: "📆", content: <p>Weekly overview with all scheduled items.</p> },
                    { id: "month", label: "Month", icon: "🗓️", content: <p>Monthly summary and statistics.</p> },
                ]}
            />
        </div>

        {/* Pills */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Pills Tabs</h4>
            <GloTabs
                variant="pills"
                tabs={[
                    { id: "all", label: "All", content: <p>All items displayed here.</p> },
                    { id: "active", label: "Active", content: <p>Active items only.</p> },
                    { id: "completed", label: "Completed", content: <p>Completed items.</p> },
                ]}
            />
        </div>

        {/* Boxed */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Boxed Tabs</h4>
            <GloTabs
                variant="boxed"
                tabs={[
                    { id: "overview", label: "Overview", icon: "📊" },
                    { id: "details", label: "Details", icon: "📝" },
                    { id: "settings", label: "Settings", icon: "⚙️", disabled: true },
                ]}
                renderContent={false}
            />
        </div>

        {/* Stretch alignment */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Stretched Pills</h4>
            <GloTabs
                variant="pills"
                align="stretch"
                size="small"
                tabs={[
                    { id: "1", label: "Tab One" },
                    { id: "2", label: "Tab Two" },
                    { id: "3", label: "Tab Three" },
                ]}
                renderContent={false}
            />
        </div>

    </div>
);
```

### GloTabs Usage

```javascript
const { GloTabs } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloTabs.jsx")
);

<GloTabs
    variant="pills"
    tabs={[
        { id: "tab1", label: "Tab 1", icon: "📋", content: <p>Content 1</p> },
        { id: "tab2", label: "Tab 2", icon: "📊", content: <p>Content 2</p> },
    ]}
/>
```

---

## GloBadge

```datacorejsx
const { GloBadge, GloBadgeGroup } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', maxWidth: '450px'}}>

        {/* Status badges */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Status Badges</h4>
            <GloBadgeGroup>
                <GloBadge status="success">Complete</GloBadge>
                <GloBadge status="warning">Pending</GloBadge>
                <GloBadge status="error">Overdue</GloBadge>
                <GloBadge status="info">New</GloBadge>
                <GloBadge status="neutral">Draft</GloBadge>
            </GloBadgeGroup>
        </div>

        {/* Variants */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Variants</h4>
            <GloBadgeGroup>
                <GloBadge variant="filled">Filled</GloBadge>
                <GloBadge variant="soft">Soft</GloBadge>
                <GloBadge variant="outlined">Outlined</GloBadge>
                <GloBadge variant="dot">With Dot</GloBadge>
            </GloBadgeGroup>
        </div>

        {/* With icons */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>With Icons</h4>
            <GloBadgeGroup>
                <GloBadge icon="🏷️" variant="soft">Tag</GloBadge>
                <GloBadge icon="⭐" status="warning" variant="soft">Featured</GloBadge>
                <GloBadge icon="🔥" color="#ff4500" variant="soft">Hot</GloBadge>
            </GloBadgeGroup>
        </div>

        {/* Removable */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Removable Tags</h4>
            <GloBadgeGroup>
                <GloBadge removable onRemove={() => new Notice('Remove 1')}>Breakfast</GloBadge>
                <GloBadge removable onRemove={() => new Notice('Remove 2')} status="info">Lunch</GloBadge>
                <GloBadge removable onRemove={() => new Notice('Remove 3')} color="#9333ea">Dinner</GloBadge>
            </GloBadgeGroup>
        </div>

        {/* Effects */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Effects</h4>
            <GloBadgeGroup>
                <GloBadge glow={true}>Glow</GloBadge>
                <GloBadge pulse={true} status="error">Pulse</GloBadge>
                <GloBadge glow={true} status="success" variant="soft">Success Glow</GloBadge>
            </GloBadgeGroup>
        </div>

        {/* Sizes */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Sizes</h4>
            <GloBadgeGroup>
                <GloBadge size="small" variant="soft">Small</GloBadge>
                <GloBadge size="medium" variant="soft">Medium</GloBadge>
                <GloBadge size="large" variant="soft">Large</GloBadge>
            </GloBadgeGroup>
        </div>

    </div>
);
```

### GloBadge Usage

```javascript
const { GloBadge, GloBadgeGroup } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloBadge.jsx")
);

<GloBadgeGroup>
    <GloBadge status="success" icon="✓">Done</GloBadge>
    <GloBadge status="warning" variant="soft">Pending</GloBadge>
    <GloBadge removable onRemove={() => {}}>Tag</GloBadge>
</GloBadgeGroup>
```

---

## GloInput

```datacorejsx
const { GloInput } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloInput.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', maxWidth: '350px'}}>

        {/* Basic inputs */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Basic Inputs</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <GloInput
                    label="Name"
                    placeholder="Enter your name..."
                    helperText="Your display name"
                />
                <GloInput
                    label="Search"
                    placeholder="Search notes..."
                    iconLeft="🔍"
                    clearable={true}
                />
            </div>
        </div>

        {/* Validation */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>With Validation</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <GloInput
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required={true}
                    iconLeft="✉️"
                />
                <GloInput
                    label="Quantity"
                    type="number"
                    placeholder="0"
                    min={0}
                    max={100}
                    helperText="Enter a number between 0-100"
                />
            </div>
        </div>

        {/* Textarea */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Textarea</h4>
            <GloInput
                label="Notes"
                type="textarea"
                placeholder="Write your notes here..."
                rows={4}
            />
        </div>

        {/* Variants */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Variants</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <GloInput variant="default" placeholder="Default variant" />
                <GloInput variant="filled" placeholder="Filled variant" />
                <GloInput variant="ghost" placeholder="Ghost variant" />
            </div>
        </div>

        {/* Sizes */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Sizes</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <GloInput size="small" placeholder="Small input" />
                <GloInput size="medium" placeholder="Medium input" />
                <GloInput size="large" placeholder="Large input" />
            </div>
        </div>

    </div>
);
```

### GloInput Usage

```javascript
const { GloInput } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloInput.jsx")
);

<GloInput
    label="Email"
    type="email"
    placeholder="Enter email..."
    required={true}
    iconLeft="✉️"
    clearable={true}
    onChange={(value) => console.log(value)}
/>
```

---

## GloDial

A mobile-optimized circular dial for time, angle, or percentage input.

```datacorejsx
const { GloDial } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloDial.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem'}}>

        {/* Time inputs */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Time Input</h4>
            <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center'}}>
                <GloDial
                    label="Bedtime"
                    value="23:00"
                    mode="time"
                    snapMinutes={15}
                    onChange={(v) => new Notice('Bedtime: ' + v)}
                />
                <GloDial
                    label="Wake Up"
                    value="07:30"
                    mode="time"
                    snapMinutes={15}
                    onChange={(v) => new Notice('Wake up: ' + v)}
                />
            </div>
        </div>

        {/* Sizes */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Sizes</h4>
            <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center'}}>
                <GloDial value="09:00" mode="time" size="small" label="Small" />
                <GloDial value="12:00" mode="time" size="medium" label="Medium" />
                <GloDial value="15:00" mode="time" size="large" label="Large" />
            </div>
        </div>

        {/* Other modes */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Other Modes</h4>
            <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center'}}>
                <GloDial
                    label="Angle"
                    value={45}
                    mode="angle"
                    showAmPm={false}
                />
                <GloDial
                    label="Percentage"
                    value={75}
                    mode="percentage"
                    showAmPm={false}
                />
            </div>
        </div>

        {/* Without sprite */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Without Sprite</h4>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <GloDial
                    label="Simple Knob"
                    value="10:30"
                    mode="time"
                    showSprite={false}
                />
            </div>
        </div>

    </div>
);
```

### GloDial Usage

```javascript
const { GloDial } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloDial.jsx")
);

// Time input (24h)
<GloDial
    label="Alarm"
    value="07:30"
    mode="time"
    snapMinutes={15}
    onChange={(time) => console.log(time)}
/>

// Angle selector
<GloDial
    label="Direction"
    value={90}
    mode="angle"
    showAmPm={false}
    onChange={(angle) => console.log(angle)}
/>

// Percentage dial
<GloDial
    label="Volume"
    value={75}
    mode="percentage"
    showAmPm={false}
    onChange={(pct) => console.log(pct)}
/>
```

### GloDial Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string/number | `"12:00"` | Time string "HH:MM" or number for angle/percentage |
| `mode` | string | `"time"` | `"time"`, `"time12"`, `"angle"`, `"percentage"` |
| `snapMinutes` | number | `15` | Snap interval for time (5, 10, 15, 30, 60) |
| `showAmPm` | boolean | `true` | Show AM/PM toggle for time modes |
| `size` | string/number | `"medium"` | `"small"` (130px), `"medium"` (160px), `"large"` (200px) |
| `label` | string | `null` | Label above dial |
| `showValue` | boolean | `true` | Show value in center |
| `showTicks` | boolean | `true` | Show tick marks at 12/3/6/9 |
| `showTrail` | boolean | `true` | Show drag trail effect |
| `showSprite` | boolean | `true` | Use theme sprite as knob |
| `disabled` | boolean | `false` | Disable interaction |
| `onChange` | function | `null` | Called with new value |

---

## Gradient Utilities

```datacorejsx
const { GloBar } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloBar.jsx"));
const {
    getPreset,
    createLinear,
    createStripes,
    createFromPalette,
    createSimple,
    GRADIENT_PRESETS
} = await dc.require(dc.fileLink("System/Scripts/Core/dc-gradientUtils.jsx"));

return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', maxWidth: '500px'}}>

        {/* Preset gradients */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Preset Gradients (getPreset)</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {["rainbow", "sunset", "ocean", "neonPink", "cyberpunk", "fire", "forest", "synthwave"].map(name => (
                    <div key={name} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{
                            width: '150px',
                            height: '20px',
                            background: getPreset(name),
                            borderRadius: '4px',
                        }} />
                        <span style={{fontSize: '12px', color: '#aaa', fontFamily: 'monospace'}}>{name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Created with helpers */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>Created with Helper Functions</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                        width: '150px',
                        height: '20px',
                        background: createSimple("#ff69b4", "#6633ff"),
                        borderRadius: '4px',
                    }} />
                    <span style={{fontSize: '11px', color: '#666', fontFamily: 'monospace'}}>createSimple("#ff69b4", "#6633ff")</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                        width: '150px',
                        height: '20px',
                        background: createLinear(["#ff0000", "#00ff00", "#0000ff"], { hard: true }),
                        borderRadius: '4px',
                    }} />
                    <span style={{fontSize: '11px', color: '#666', fontFamily: 'monospace'}}>createLinear([...], {`{hard: true}`})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                        width: '150px',
                        height: '20px',
                        background: createStripes(["#ff69b4", "#1a1a2e"], { stripeWidth: 8, direction: "diagonal" }),
                        borderRadius: '4px',
                    }} />
                    <span style={{fontSize: '11px', color: '#666', fontFamily: 'monospace'}}>createStripes([...], {`{stripeWidth: 8}`})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                        width: '150px',
                        height: '20px',
                        background: createFromPalette("sunset"),
                        borderRadius: '4px',
                    }} />
                    <span style={{fontSize: '11px', color: '#666', fontFamily: 'monospace'}}>createFromPalette("sunset")</span>
                </div>
            </div>
        </div>

        {/* Progress bars with custom gradients */}
        <div>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#888'}}>GloBar with Custom Gradients</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <GloBar
                    value={75}
                    label="Preset: Ocean"
                    fillGradient={getPreset("ocean")}
                    showSprite={false}
                />
                <GloBar
                    value={60}
                    label="Custom: Pink to Purple"
                    fillGradient={createSimple("#ff69b4", "#6633ff")}
                    showSprite={false}
                />
                <GloBar
                    value={85}
                    label="Hard Rainbow"
                    fillGradient={createFromPalette("rainbow", { hard: true, direction: "horizontal" })}
                    showSprite={false}
                />
                <GloBar
                    value={50}
                    label="Fire Gradient"
                    fillGradient={getPreset("fire")}
                    showSprite={false}
                />
            </div>
        </div>

    </div>
);
```

### Gradient Utilities Usage

```javascript
const {
    getPreset,
    createLinear,
    createStripes,
    createFromPalette,
    createSimple,
    GRADIENT_PRESETS
} = await dc.require(dc.fileLink("System/Scripts/Core/dc-gradientUtils.jsx"));

// Use a preset
const gradient = getPreset("ocean");

// Create a simple two-color gradient
const simple = createSimple("#ff69b4", "#6633ff");

// Create a multi-stop gradient
const custom = createLinear(["#ff0000", "#00ff00", "#0000ff"], { hard: true });

// Create striped pattern
const stripes = createStripes(["#ff69b4", "#1a1a2e"], { stripeWidth: 8 });
```

---

## Shared Preview Components

Two components for building dashboards with live previews:

### ThemePreviewContent

A comprehensive preview of all Glo* components, used by Theme Studio.

```javascript
const { ThemePreviewContent } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-themePreviewContent.jsx")
);

<ThemePreviewContent />
```

### StickyPreview

A collapsible, sticky preview wrapper for mobile-friendly dashboards.

```javascript
const { StickyPreview } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-stickyPreview.jsx")
);

<StickyPreview title="Live Preview" defaultCollapsed={false}>
    <ThemePreviewContent />
</StickyPreview>
```

---

## Render Component Demos Directly

You can render the built-in demos for each component:

```datacorejsx
// Choose any component to see its demo
const script = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloSelect.jsx"));
return script.renderedView;
```

```datacorejsx
// See all gradient presets
const script = await dc.require(dc.fileLink("System/Scripts/Core/dc-gradientUtils.jsx"));
return script.renderedView;
```

---

## GloBar Vertical Mode

GloBar supports vertical orientation for sliders and meters:

```datacorejsx
const { GloBar } = await dc.require(dc.fileLink("System/Scripts/Components/dc-gloBar.jsx"));

return (
    <div style={{display: 'flex', gap: '2rem', padding: '1rem', height: '200px'}}>
        <GloBar
            value={75}
            vertical={true}
            length="180px"
            height="20px"
            label="Volume"
            draggable={true}
        />
        <GloBar
            value={50}
            vertical={true}
            length="180px"
            height="16px"
            label="Bass"
            draggable={true}
            showSprite={false}
        />
    </div>
);
```

---

## Installation

This component library requires the **Datacore** plugin for Obsidian.

1. Install the Datacore plugin
2. Copy this vault or the `System/Scripts` folder to your vault
3. Open the Component-Showcase.md to see the demos
4. Create themes in `System/Themes/` using `_themeTemplate.md`

For detailed installation instructions, see `INSTALLATION.md`.
