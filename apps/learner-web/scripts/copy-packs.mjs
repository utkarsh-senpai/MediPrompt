// Copies approved runtime packs into the public directory. The explicit
// --draft-beta option additionally exposes the medical candidate to the local
// `vite --mode medical-beta` server. A normal dev/build always removes it.
import { mkdirSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../../../content/packs");
const candidates = resolve(__dirname, "../../../content/candidates");
const dest = resolve(__dirname, "../public/packs");
const betaDest = resolve(__dirname, "../public/beta-packs");
const includeDraftBeta = process.argv.includes("--draft-beta");

rmSync(dest, { recursive: true, force: true });
rmSync(betaDest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const f of readdirSync(src).filter((f) => f.endsWith(".json"))) {
  copyFileSync(resolve(src, f), resolve(dest, f));
  console.log(`copied ${f}`);
}

if (includeDraftBeta) {
  const candidateFiles = readdirSync(candidates)
    .filter((file) => file.endsWith(".json"))
    .sort();
  if (candidateFiles.length !== 1) {
    throw new Error(
      `medical beta requires exactly one candidate pack, got ${candidateFiles.length}`,
    );
  }
  mkdirSync(betaDest, { recursive: true });
  for (const file of candidateFiles) {
    copyFileSync(resolve(candidates, file), resolve(betaDest, file));
    console.log(`copied local-beta candidate ${file}`);
  }
}
