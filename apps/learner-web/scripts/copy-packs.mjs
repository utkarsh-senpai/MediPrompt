// Publishes only the explicitly labelled MPT practice-beta snapshot. The
// approved non-medical interaction fixture remains a regression-test input and
// is deliberately absent from the learner-facing artifact.
import { mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const candidates = resolve(__dirname, "../../../content/candidates");
const dest = resolve(__dirname, "../public/packs");
const betaDest = resolve(__dirname, "../public/beta-packs");
const publicPracticePack = "mpt-cardiorespiratory-review-candidate.json";
const sourceFile = resolve(candidates, publicPracticePack);

rmSync(dest, { recursive: true, force: true });
rmSync(betaDest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

if (!existsSync(sourceFile)) {
  throw new Error(`missing public practice-beta source: ${publicPracticePack}`);
}

copyFileSync(sourceFile, resolve(dest, publicPracticePack));
console.log(`copied public curriculum beta ${publicPracticePack}`);
