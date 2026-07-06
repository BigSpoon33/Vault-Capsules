#!/usr/bin/env bun
// Imports an inkwell-api export bundle (.zip) into Knowledge/<Class Name>/ per
// docs/export-contract.md AC-2/AC-3/AC-4. Widget path (dc-inkwellImport.jsx) was
// rejected: unzip needs a JS zip lib the vault has no package.json/npm deps for,
// and Datacore's plugin sandbox restricts raw fs access more than a Bun script.
// Usage:
//   bun tools/inkwell-import.ts --bundle <path-to-zip> --vault <vault-root>
//   bun tools/inkwell-import.ts --url <inkwell-api base> --token <jwt> --capsule <id> --vault <vault-root>

import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseYaml } from "./yaml-mini";

interface Args {
  bundle?: string;
  url?: string;
  token?: string;
  capsule?: string;
  vault: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--bundle") args.bundle = argv[++i];
    else if (a === "--url") args.url = argv[++i];
    else if (a === "--token") args.token = argv[++i];
    else if (a === "--capsule") args.capsule = argv[++i];
    else if (a === "--vault") args.vault = argv[++i];
  }
  if (!args.vault) {
    console.error("usage: bun tools/inkwell-import.ts (--bundle <zip> | --url <api> --token <jwt> --capsule <id>) --vault <vault-root>");
    process.exit(2);
  }
  if (!args.bundle && !(args.url && args.token && args.capsule)) {
    console.error("must supply either --bundle <zip>, or --url/--token/--capsule to download one");
    process.exit(2);
  }
  return args as Args;
}

// AC-2: strip filesystem-unsafe characters from class/module names
function sanitizeName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_").trim();
}

const TYPE_FOLDER: Record<string, string> = {
  lesson: "Lessons",
  lab: "Labs",
  quiz: "Quizzes",
  flashcard: "Flashcards",
  slides: "Slides",
  "guided-conversation": "Conversations",
  pdf: "Resources",
  youtube: "Resources",
  resource: "Resources",
};

// AC-3 status mapping table
function mapStatus(progressStatus: string | undefined, hasScore: boolean): string {
  if (!progressStatus || progressStatus === "not_started") return "todo";
  if (progressStatus === "in_progress") return "in-progress";
  if (progressStatus === "completed") return hasScore ? "graded" : "done";
  return "todo";
}

interface ProgressRow {
  module_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
}

interface ContentModule {
  id: string;
  type: string;
  title: string;
  path?: string;
  order?: number;
  prerequisites?: string[];
  pdf_file?: string;
}

interface Capsule {
  class_id: string;
  version: string;
  title: string;
  description?: string;
  tags?: string[];
  difficulty?: string;
  tutor_persona?: { name?: string };
  content_modules: ContentModule[];
}

async function downloadBundle(url: string, token: string, capsuleId: string): Promise<string> {
  const res = await fetch(`${url.replace(/\/$/, "")}/export/${capsuleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`export request failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = join(mkdtempSync(join(tmpdir(), "inkwell-bundle-")), `${capsuleId}.zip`);
  writeFileSync(dest, buf);
  return dest;
}

async function unzipBundle(zipPath: string): Promise<string> {
  const dest = mkdtempSync(join(tmpdir(), "inkwell-import-"));
  const proc = Bun.spawnSync(["unzip", "-o", "-q", zipPath, "-d", dest]);
  if (proc.exitCode !== 0) {
    throw new Error(`unzip failed: ${proc.stderr.toString()}`);
  }
  return dest;
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkFiles(full)));
    else out.push(full);
  }
  return out;
}

// AC-4: dedupe key is (capsule-id, module-id) frontmatter pair, looked up by
// content not filename (student may rename files).
async function findExistingByFrontmatter(
  dir: string,
  matcher: (fm: Record<string, unknown>) => boolean,
): Promise<string | null> {
  if (!existsSync(dir)) return null;
  const files = (await walkFiles(dir)).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    let fm: Record<string, unknown>;
    try {
      fm = parseYaml(match[1]) || {};
    } catch {
      continue;
    }
    if (matcher(fm)) return file;
  }
  return null;
}

function toYamlFrontmatter(obj: Record<string, unknown>): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value === null) {
      lines.push(`${key}: null`);
    } else if (Array.isArray(value)) {
      lines.push(value.length ? `${key}:\n${value.map((v) => `  - ${JSON.stringify(v)}`).join("\n")}` : `${key}: []`);
    } else if (typeof value === "string" && (value.startsWith("[[") || /^\d{4}-\d{2}-\d{2}/.test(value))) {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else if (typeof value === "string") {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function importBundle(bundlePath: string, vaultRoot: string): Promise<{ created: number; updated: number; skipped: string[] }> {
  const extractDir = await unzipBundle(bundlePath);
  const capsuleYamlPath = join(extractDir, "capsule.yaml");
  const progressPath = join(extractDir, "progress.json");

  const capsuleYamlText = readFileSync(capsuleYamlPath, "utf-8");
  const capsule: Capsule = parseYaml(capsuleYamlText);
  const progressRows: ProgressRow[] = existsSync(progressPath)
    ? JSON.parse(readFileSync(progressPath, "utf-8"))
    : [];
  const progressByModule = new Map(progressRows.map((r) => [r.module_id, r]));

  const className = sanitizeName(capsule.title);
  const classDir = join(vaultRoot, "Knowledge", className);
  const exportedAt = new Date().toISOString();
  const skipped: string[] = [];
  let created = 0;
  let updated = 0;

  mkdirSync(classDir, { recursive: true });

  // AC-4: class index dedupe key is capsule-id alone
  const existingClassNote = await findExistingByFrontmatter(join(vaultRoot, "Knowledge"), (fm) => fm["capsule-id"] === capsule.class_id);

  const moduleRows: { type: string; title: string; status: string; path: string }[] = [];

  for (const mod of capsule.content_modules) {
    const srcPath = mod.path ? join(extractDir, mod.path) : null;
    if (!srcPath || !existsSync(srcPath)) {
      skipped.push(`${mod.id} (${mod.type}): no file in bundle`);
      continue;
    }
    const body = readFileSync(srcPath, "utf-8");
    const progress = progressByModule.get(mod.id);
    const hasScore = !!progress?.score;
    const status = mapStatus(progress?.status, hasScore);

    const folder = TYPE_FOLDER[mod.type] || "Resources";
    const folderPath = join(classDir, folder);
    mkdirSync(folderPath, { recursive: true });

    const moduleTitle = sanitizeName(mod.title);
    let fileName = `${moduleTitle}.md`;
    const destPath = join(folderPath, fileName);

    const fm: Record<string, unknown> = {
      categories: ["Coursework"],
      type: mod.type,
      status,
      due: null,
      grade: progress?.score ?? null,
      class: `[[${className}]]`,
      "capsule-id": capsule.class_id,
      "module-id": mod.id,
      order: mod.order ?? null,
      prerequisites: mod.prerequisites ?? [],
      source: "inkwell-export",
      "exported-at": exportedAt,
    };

    const noteContent = `${toYamlFrontmatter(fm)}\n\n${body}`;

    // AC-4: dedupe by (capsule-id, module-id), not filename
    const existing = await findExistingByFrontmatter(folderPath, (existingFm) => existingFm["capsule-id"] === capsule.class_id && existingFm["module-id"] === mod.id);

    if (existing) {
      writeFileSync(existing, noteContent);
      updated++;
      moduleRows.push({ type: mod.type, title: mod.title, status, path: existing.replace(vaultRoot + "/", "") });
    } else {
      if (existsSync(destPath)) {
        // filename collision with a different module — disambiguate per AC-2
        fileName = `${moduleTitle}-${mod.id.slice(-8)}.md`;
      }
      const finalPath = join(folderPath, fileName);
      writeFileSync(finalPath, noteContent);
      created++;
      moduleRows.push({ type: mod.type, title: mod.title, status, path: finalPath.replace(vaultRoot + "/", "") });
    }

    // AC-2/pdf handling: pdf module binaries land in _assets/<module-id>/, absent = resource note only
    if (mod.type === "pdf" && mod.pdf_file) {
      const pdfSrc = mod.pdf_file.includes("/") ? join(extractDir, mod.pdf_file) : join(extractDir, "pdfs", mod.pdf_file.split("/").pop()!);
      if (existsSync(pdfSrc)) {
        const assetDir = join(classDir, "_assets", mod.id);
        mkdirSync(assetDir, { recursive: true });
        writeFileSync(join(assetDir, mod.pdf_file.split("/").pop()!), readFileSync(pdfSrc));
      }
    }
  }

  // Class index note
  const classFm: Record<string, unknown> = {
    categories: ["Classes"],
    status: "active",
    "course-code": capsule.class_id,
    term: null,
    "capsule-id": capsule.class_id,
    "capsule-version": capsule.version,
    tags: capsule.tags ?? [],
    difficulty: capsule.difficulty ?? null,
    source: "inkwell-export",
    "exported-at": exportedAt,
  };
  const toc = moduleRows
    .map((r) => `| ${r.type} | [[${r.title}]] | ${r.status} |`)
    .join("\n");
  const classBody = [
    `# ${capsule.title}`,
    "",
    capsule.description ?? "",
    capsule.tutor_persona?.name ? `\n**Tutor persona:** ${capsule.tutor_persona.name}` : "",
    "",
    "| Type | Module | Status |",
    "|---|---|---|",
    toc,
  ].join("\n");
  const classNoteContent = `${toYamlFrontmatter(classFm)}\n\n${classBody}\n`;

  if (existingClassNote) {
    writeFileSync(existingClassNote, classNoteContent);
    updated++;
  } else {
    writeFileSync(join(classDir, `${className}.md`), classNoteContent);
    created++;
  }

  rmSync(extractDir, { recursive: true, force: true });
  return { created, updated, skipped };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let bundlePath = args.bundle;
  if (!bundlePath) {
    bundlePath = await downloadBundle(args.url!, args.token!, args.capsule!);
  }
  const result = await importBundle(bundlePath, args.vault);
  console.log(`Import complete: ${result.created} created, ${result.updated} updated`);
  if (result.skipped.length) {
    console.log(`Skipped (no file in bundle):`);
    for (const s of result.skipped) console.log(`  - ${s}`);
  }
}

main().catch((err) => {
  console.error("inkwell-import failed:", err);
  process.exit(1);
});
