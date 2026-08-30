// Copies approved runtime packs from content/packs into the app's public dir so
// Vite emits them as static assets and the service worker precaches them.
// Production gate is enforced separately by content:validate.
import { mkdirSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../../../content/packs");
const dest = resolve(__dirname, "../public/packs");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const f of readdirSync(src).filter((f) => f.endsWith(".json"))) {
  copyFileSync(resolve(src, f), resolve(dest, f));
  console.log(`copied ${f}`);
}
