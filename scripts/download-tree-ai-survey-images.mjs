/**
 * Download 10 tree survey demo images from Wikimedia Commons.
 * Run: node scripts/download-tree-ai-survey-images.mjs
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/assets/trees/ai-survey");

function filePathUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=800`;
}

const IMAGES = [
  {
    file: "01-canopy.jpg",
    wikiFile: "Looking up at tree canopies in Gullmarsskogen ravine.jpg",
    source: "Wikimedia Commons — tree canopy looking up",
  },
  {
    file: "02-full-tree.jpg",
    wikiFile: "Qutb Minar with Neem Tree.jpg",
    source: "Wikimedia Commons — Neem tree (Azadirachta indica)",
  },
  {
    file: "03-bark.jpg",
    wikiFile: "Rough tree bark surface texture macro side view.jpg",
    source: "Wikimedia Commons — tree bark close-up",
  },
  {
    file: "04-leaf.jpg",
    wikiFile: "Mangifera indica20090409 16.jpg",
    source: "Wikimedia Commons — Mangifera indica leaf",
  },
  {
    file: "05-flower.jpg",
    wikiFile: "Flame tree mali.jpg",
    source: "Wikimedia Commons — Delonix regia (flame tree) flower",
  },
  {
    file: "06-fruit.jpg",
    wikiFile: "Mangos - single and halved.jpg",
    source: "Wikimedia Commons — mango fruit",
  },
  {
    file: "07-root-base.jpg",
    wikiFile: "Tree roots.jpg",
    source: "Wikimedia Commons — exposed tree roots",
  },
  {
    file: "08-trunk.jpg",
    wikiFile: "Thomas Sully - Rocky Landscape, Large Tree Trunk in Foreground - B1981.25.2781 - Yale Center for British Art.jpg",
    source: "Wikimedia Commons — large tree trunk",
  },
  {
    file: "09-branch.jpg",
    wikiFile: "Branches of a Ficus kurzii reflecting in the water at Singapore Botanic Gardens.jpg",
    source: "Wikimedia Commons — tree branch structure",
  },
  {
    file: "10-soil-base.jpg",
    wikiFile: "Upslope tree roots (55185037707).jpg",
    source: "Wikimedia Commons — tree base, roots & soil",
  },
];

const UA = "TreeSurveyDemo/1.0 (demo asset fetch)";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(outDir, { recursive: true });

const manifest = [];

for (const { file, wikiFile, source } of IMAGES) {
  const dest = path.join(outDir, file);
  if (await exists(dest)) {
    const stat = await import("node:fs/promises").then((fs) => fs.stat(dest));
    if (stat.size > 5000) {
      manifest.push({ file, source, wikiFile });
      console.log(`Skipping ${file} — already present (${(stat.size / 1024).toFixed(0)} KB)`);
      continue;
    }
  }

  process.stdout.write(`Downloading ${file}… `);
  await delay(2500);
  try {
    const res = await fetch(filePathUrl(wikiFile), {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) throw new Error(`too small (${buf.length} bytes)`);
    await writeFile(dest, buf);
    manifest.push({ file, source, wikiFile });
    console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
  }
}

await writeFile(path.join(outDir, "sources.json"), JSON.stringify(manifest, null, 2));
console.log(`Ready: ${manifest.length}/${IMAGES.length} images.`);
