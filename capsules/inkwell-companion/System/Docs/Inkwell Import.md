---
categories:
  - "Docs"
---

# Inkwell Import

This capsule ships the importer that pulls your Inkwell coursework export into this vault's `Knowledge/` folder.

The importer is a [Bun](https://bun.sh) script, not a Datacore widget — Obsidian's plugin sandbox doesn't allow the raw filesystem/zip access the import needs, so it runs from a terminal instead.

## Usage

```bash
# From an exported bundle (.zip) downloaded from Inkwell:
bun tools/inkwell-import.ts --bundle <path-to-zip> --vault <path-to-this-vault>

# Directly from a running Inkwell account:
bun tools/inkwell-import.ts --url <inkwell-api base> --token <your-token> --capsule <capsule-id> --vault <path-to-this-vault>
```

Re-running the import for the same capsule updates existing notes in place — it dedupes on `capsule-id`/`module-id` frontmatter, not filename, so it's safe to re-import after Inkwell content changes.

## Sample class

`Knowledge/Introduction to Linux/` is included as a synthetic demo class so you can see the layout (Lessons, Labs, Quizzes, Flashcards, Slides, Conversations) before connecting a real Inkwell account.
