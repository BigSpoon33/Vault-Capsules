// Minimal indentation-based YAML subset parser — the vault repo has no
// package.json/npm deps (Datacore JSX runs in-plugin, can't import ajv/yaml/etc.,
// per STORY-010 findings), so tools/ scripts can't pull in the "yaml" package
// either without adding dependency management this repo doesn't otherwise need.
// Handles exactly what capsule.yaml + our own written frontmatter use: scalars,
// quoted strings, null, block sequences of scalars or maps, nested maps, inline
// `[a, b]` flow arrays. Not a general YAML parser.

function stripComment(line: string): string {
  // naive: only strip a trailing # that isn't inside quotes
  let inQuote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      inQuote = c;
    } else if (c === "#" && (i === 0 || line[i - 1] === " ")) {
      return line.slice(0, i);
    }
  }
  return line;
}

function parseScalar(raw: string): unknown {
  const v = raw.trim();
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((s) => parseScalar(s.trim()));
  }
  return v;
}

interface Line {
  indent: number;
  content: string;
  raw: string;
}

function tokenize(text: string): Line[] {
  return text
    .split("\n")
    .map((raw) => {
      const stripped = stripComment(raw).replace(/\s+$/, "");
      return { raw, content: stripped, indent: stripped.length - stripped.trimStart().length };
    })
    .filter((l) => l.content.trim().length > 0);
}

// Parses a block starting at lines[start] with the given indent, consuming
// all lines that belong to it (indent >= blockIndent), returns [value, nextIndex]
function parseBlock(lines: Line[], start: number, blockIndent: number): [unknown, number] {
  if (start >= lines.length) return [null, start];
  const first = lines[start];
  if (first.indent < blockIndent) return [null, start];

  const trimmed = first.content.trim();
  if (trimmed.startsWith("- ") || trimmed === "-") {
    return parseSequence(lines, start, first.indent);
  }
  return parseMapping(lines, start, first.indent);
}

function parseSequence(lines: Line[], start: number, indent: number): [unknown[], number] {
  const arr: unknown[] = [];
  let i = start;
  while (i < lines.length && lines[i].indent === indent && lines[i].content.trim().startsWith("-")) {
    const line = lines[i];
    const afterDash = line.content.trim().slice(1).trim();
    if (afterDash === "") {
      // nested block sequence/mapping under a bare "-"
      const [val, next] = parseBlock(lines, i + 1, indent + 1);
      arr.push(val);
      i = next;
    } else if (afterDash.includes(":") && !afterDash.startsWith('"') && !afterDash.startsWith("[")) {
      // "- key: value" starts an inline map item; dash column + 2 is the map's indent
      const dashCol = line.content.indexOf("-");
      const itemIndent = dashCol + 2;
      const syntheticLines: Line[] = [{ indent: itemIndent, content: " ".repeat(itemIndent) + afterDash, raw: line.raw }];
      let j = i + 1;
      while (j < lines.length && lines[j].indent >= itemIndent) {
        syntheticLines.push(lines[j]);
        j++;
      }
      const [obj] = parseMapping(syntheticLines, 0, itemIndent);
      arr.push(obj);
      i = j;
    } else {
      arr.push(parseScalar(afterDash));
      i++;
    }
  }
  return [arr, i];
}

function parseMapping(lines: Line[], start: number, indent: number): [Record<string, unknown>, number] {
  const obj: Record<string, unknown> = {};
  let i = start;
  while (i < lines.length && lines[i].indent === indent) {
    const line = lines[i];
    const trimmedContent = line.content.trim();
    const colonIdx = findKeyColon(trimmedContent);
    if (colonIdx === -1) {
      i++;
      continue;
    }
    const key = trimmedContent.slice(0, colonIdx).trim().replace(/^["']|["']$/g, "");
    const rest = trimmedContent.slice(colonIdx + 1).trim();

    if (rest === "") {
      // value is a nested block on following more-indented lines
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.indent > indent) {
        const [val, next] = parseBlock(lines, i + 1, nextLine.indent);
        obj[key] = val;
        i = next;
      } else {
        obj[key] = null;
        i++;
      }
    } else {
      obj[key] = parseScalar(rest);
      i++;
    }
  }
  return [obj, i];
}

function findKeyColon(content: string): number {
  let inQuote: string | null = null;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      inQuote = c;
    } else if (c === ":" && (i === content.length - 1 || content[i + 1] === " ")) {
      return i;
    }
  }
  return -1;
}

export function parseYaml(text: string): Record<string, unknown> {
  const lines = tokenize(text);
  if (lines.length === 0) return {};
  const [obj] = parseMapping(lines, 0, lines[0].indent);
  return obj;
}
