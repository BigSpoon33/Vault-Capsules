# Inkscape Setup and Usage Guide for Muscle Mapping

## What is Inkscape?

Inkscape is a free, open-source vector graphics editor (like Adobe Illustrator). It's perfect for working with SVG files because it shows you the structure of the file, lets you select individual paths, and displays their IDs.

## Installation

### Linux (Your System)
```bash
# Install via package manager
sudo pacman -S inkscape

# Or if you prefer flatpak
flatpak install flathub org.inkscape.Inkscape
```

### Verify Installation
```bash
inkscape --version
```

## Opening Your SVG in Inkscape

1. **Launch Inkscape** from your applications menu or run `inkscape` in terminal

2. **Open your SVG file:**
   - File → Open
   - Navigate to: `~/Documents/Vaults/Rice AF/System/Assets/Anatomy/Muscles_front_and_back.svg`
   - Click "Open"

3. **Initial view:** You should see your anatomical diagram with front and back muscle views

## Understanding the Inkscape Interface

```
┌──────────────────────────────────────────────────────┐
│  File  Edit  View  Object  Path  Text  ...          │ ← Menu Bar
├──────────────────────────────────────────────────────┤
│  [Icons for tools]                                   │ ← Tool Bar
├─────┬────────────────────────────────────────┬──────┤
│     │                                        │      │
│  T  │         Main Canvas                    │   O  │
│  o  │     (Your SVG appears here)            │   b  │
│  o  │                                        │   j  │
│  l  │                                        │   e  │
│  s  │                                        │   c  │
│     │                                        │   t  │
│     │                                        │   s  │
│     │                                        │      │
├─────┴────────────────────────────────────────┴──────┤
│  Status Bar (shows selected object info)            │
└──────────────────────────────────────────────────────┘
```

### Key Panels (Show via View → menu if not visible)

- **Objects Panel** (Shift+Ctrl+O): Shows layer hierarchy - MOST IMPORTANT
- **Fill and Stroke** (Shift+Ctrl+F): Shows/edits colors and styles
- **XML Editor** (Shift+Ctrl+X): Shows raw SVG code

## Step-by-Step: Identifying Muscle Paths

### Method 1: Using the Objects Panel (Recommended)

1. **Open Objects Panel:**
   - View → Objects (or press Shift+Ctrl+O)

2. **You'll see a tree structure like:**
   ```
   📄 svg8
     └─ 📁 layer2 (svg svaly)
        └─ 📁 g4116
           ├─ 🎨 path2223
           ├─ 🎨 path2023
           ├─ 🎨 path2033
           └─ ... (more paths)
   ```

3. **Find muscle paths:**
   - Click on different paths in the Objects Panel
   - The corresponding shape will highlight on the canvas
   - Look for paths with muscle color (pinkish-red)

4. **Identify the muscle:**
   - When a muscle highlights, note what body part it represents
   - The path ID is shown in the Objects Panel (e.g., `path2223`)

5. **Right-click → Object Properties** to see/edit the ID

### Method 2: Using Selection Tool

1. **Select the "Select and Transform Objects" tool:**
   - Press `S` or click the arrow tool in the left toolbar
   - Or press F1

2. **Click on a muscle shape:**
   - The selected path will show blue selection handles
   - Look at the **bottom status bar** - it shows the path ID!
   ```
   Path (path2223) in layer layer2
   ```

3. **Write down the mapping:**
   - Note which muscle it is (e.g., "left pectoralis")
   - Write down the path ID (e.g., "path2223")

### Method 3: Using the Labeled SVG (Easiest!)

I created a labeled SVG for you at:
`System/Assets/Anatomy/muscles_labeled.svg`

1. **Open this file in Inkscape**
2. **The path IDs are already printed on each muscle!**
3. **Just read the labels and match them to muscles**

## Helpful Inkscape Shortcuts

| Shortcut | Action |
|----------|--------|
| `S` or `F1` | Select tool (arrow) |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `3` | Zoom to fit page |
| `4` | Zoom to selection |
| `Shift+Ctrl+O` | Open Objects panel |
| `Shift+Ctrl+X` | Open XML Editor |
| `Shift+Ctrl+F` | Open Fill & Stroke panel |
| `Ctrl+Z` | Undo |
| `Space` (hold) | Pan canvas |

## Tips for Muscle Identification

### Visual Grouping Strategy

**Anterior (Front) View - Left to Right, Top to Bottom:**
1. Face/Neck muscles
2. Deltoids (shoulders)
3. Pectorals (chest)
4. Abdominals
5. Quadriceps (front thigh)
6. Tibialis anterior (shin)

**Posterior (Back) View - Left to Right, Top to Bottom:**
1. Trapezius (upper back)
2. Deltoids (rear shoulder)
3. Latissimus dorsi (lats)
4. Erector spinae (lower back)
5. Gluteus maximus
6. Hamstrings
7. Gastrocnemius (calves)

### Using the XML Editor (Advanced)

1. **Open XML Editor:** Shift+Ctrl+X

2. **Navigate to a path element**

3. **You can:**
   - Add a label: Add attribute `inkscape:label` = "Left Pectoralis"
   - Change the ID: Edit the `id` attribute
   - See the full path data in the `d` attribute

## Workflow Recommendation

I recommend using the **Interactive HTML Tool** I created instead of Inkscape for the actual mapping:

1. **Use Inkscape to get familiar** with what each muscle looks like
2. **Use the labeled SVG** (`muscles_labeled.svg`) to see IDs
3. **Use the Interactive HTML Tool** (`muscle_mapper.html`) to create the JSON:
   - Open it in a web browser
   - Click on muscles
   - Fill in the form
   - Get instant JSON output!

## Common Inkscape Issues & Solutions

### Issue: "Can't see path IDs when I click"
**Solution:** Look at the bottom status bar - it always shows the ID

### Issue: "Too many objects, can't find muscles"
**Solution:** Use Fill & Stroke panel to filter by color (#f39079)

### Issue: "SVG looks different from the HTML preview"
**Solution:** Normal! Inkscape shows editing view. Export to PNG to see rendered version.

### Issue: "Accidentally moved/edited a path"
**Solution:** Ctrl+Z to undo, or close without saving

## Next Steps After Identification

Once you've identified all 18 muscle paths:

1. **Create mapping JSON** using the HTML tool or manually
2. **Save it** as `System/Assets/Anatomy/muscle_mapping.json`
3. **Validate it** using the Python helper:
   ```bash
   cd System/Assets/Anatomy
   python muscle_helper.py validate muscle_mapping.json
   ```
4. **Integrate into your widget** by loading the JSON in `dc-muscleMap.jsx`

## Resources

- Official Inkscape tutorials: Help → Tutorials → Basic
- Inkscape manual: https://inkscape.org/doc/
- SVG specification: https://www.w3.org/TR/SVG/

---

**Remember:** You don't need to become an Inkscape expert. You just need to:
1. Click on shapes
2. Read the ID from the status bar
3. Note which muscle it is

That's it! The HTML tool will handle the rest.
