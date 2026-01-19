---
created: 2026-01-19
tags:
  - dashboards
  - testing
---

## Network Capability Test

Test whether Datacore JSX widgets can make HTTP requests to fetch external files. This determines the approach for building an in-Obsidian capsule manager.

```datacorejsx
const scriptPath = "System/Scripts/Widgets/dc-networkTest.jsx";
const target = dc.fileLink(scriptPath);
const result = await dc.require(target);
const view = result?.renderedView ?? result?.View ?? result;
const Func = result?.Func ?? null;

return function View() {
    const currentFile = dc.useCurrentFile();
    if (Func) {
        return Func({ currentFile, scriptPath });
    }
    return view ?? <p>Failed to render Network Test</p>;
}
```

---

### Next Steps Based on Results

**If ANY method works:**
- Design capsule manifest format (JSON)
- Build capsule manager widget with install/update buttons
- Host manifest + files on GitHub

**If NONE work:**
- Build monorepo with install.sh script
- Datacore widget shows installed versions (reads local manifest)
- Users run script manually for updates
