import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const root = process.cwd();
const markdownFiles: string[] = [];
const failures: string[] = [];

function walk(directory: string): void {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (["node_modules", ".git", "dist", "build"].includes(entry)) {
        continue;
      }
      walk(fullPath);
      continue;
    }

    if (entry.endsWith(".md")) {
      markdownFiles.push(fullPath);
    }
  }
}

walk(root);

const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const body = readFileSync(file, "utf8");
  const base = dirname(file);
  const matches = body.matchAll(markdownLinkPattern);

  for (const match of matches) {
    const rawTarget = match[1]?.trim();

    if (!rawTarget || rawTarget.startsWith("http") || rawTarget.startsWith("mailto:")) {
      continue;
    }

    const [targetWithoutAnchor] = rawTarget.split("#");

    if (!targetWithoutAnchor || targetWithoutAnchor.length === 0) {
      continue;
    }

    const resolved = normalize(join(base, targetWithoutAnchor));

    if (!existsSync(resolved)) {
      failures.push(`${file.replace(`${root}/`, "")}: broken link -> ${rawTarget}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Documentation link check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Documentation link check passed for ${markdownFiles.length} Markdown files.`);
