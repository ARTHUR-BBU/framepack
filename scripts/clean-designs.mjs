import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SOURCE_DIR = "F:/DESIGN.MD/design-systems";
const TARGET_DIR = "F:/hyperframes/templates/designs";

const DESIGNS = [
  "spacex", "tesla", "nvidia", "apple", "stripe", "nike",
  "ferrari", "lamborghini", "bugatti", "bmw-m", "vercel",
  "linear-app", "spotify", "discord", "figma", "playstation",
  "shopify", "meta", "uber", "raycast", "openai", "notion",
];

const REMOVE_SECTIONS = [
  /^## 4\.\s/i,
  /^## 5\.\s/i,
  /^## 6\.\s/i,
  /^## 8\.\s/i,
];

const KEEP_SECTIONS = [
  /^## 1\.\s/i,
  /^## 2\.\s/i,
  /^## 3\.\s/i,
  /^## 7\.\s/i,
  /^## 9\.\s/i,
];

function isSectionStart(line) {
  return /^## \d+\./.test(line);
}

function sectionIndex(line) {
  const match = line.match(/^## (\d+)\./);
  return match ? parseInt(match[1], 10) : null;
}

function shouldRemoveSection(sectionNum) {
  return [4, 5, 6, 8].includes(sectionNum);
}

function cleanDesignFile(sourcePath) {
  const content = readFileSync(sourcePath, "utf8");
  const lines = content.split("\n");
  const result = [];
  let inRemoveSection = false;
  let currentSection = 0;

  for (const line of lines) {
    if (isSectionStart(line)) {
      currentSection = sectionIndex(line);
      inRemoveSection = shouldRemoveSection(currentSection);
    }

    if (!inRemoveSection) {
      result.push(line);
    }
  }

  let cleaned = result.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return cleaned;
}

mkdirSync(TARGET_DIR, { recursive: true });

let processed = 0;
let skipped = 0;

for (const name of DESIGNS) {
  const sourcePath = join(SOURCE_DIR, name, "DESIGN.md");
  try {
    const cleaned = cleanDesignFile(sourcePath);
    const targetPath = join(TARGET_DIR, `${name}.md`);
    writeFileSync(targetPath, cleaned, "utf8");
    processed++;
    console.log(`OK: ${name} (${cleaned.split("\n").length} lines)`);
  } catch (err) {
    skipped++;
    console.warn(`SKIP: ${name} — ${err.message}`);
  }
}

console.log(`\nDone: ${processed} processed, ${skipped} skipped`);
