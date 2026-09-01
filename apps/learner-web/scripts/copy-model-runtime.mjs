// Copies the ONNX WASM runtime files bundled with @huggingface/transformers
// into public/models/ort/ so the transcription worker loads them same-origin
// (the library default is the jsdelivr CDN, which our CSP forbids).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// The package's exports map does not expose ./package.json; resolving the
// entry point lands directly in dist/, which contains the wasm runtime files.
const transformersEntry = require.resolve("@huggingface/transformers");
const distDir = dirname(transformersEntry);

const FILES = [
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
];

const outDir = join(appRoot, "public", "models", "ort");
mkdirSync(outDir, { recursive: true });
for (const file of FILES) {
  copyFileSync(join(distDir, file), join(outDir, file));
}
console.log(`copied ${FILES.length} onnx runtime files to public/models/ort/`);
