// Fails closed when the production artifact leaks draft/private material or
// violates the static-hosting and lightweight-shell contract.
// v0.3 note: the pinned ORT wasm runtime ships under models/ort/ (same-origin,
// CSP forbids CDN code). It is excluded from the shell budgets and has its own
// budget: it downloads lazily on first transcription activation and is then
// cached by the service worker. Vendored .mjs runtime files are excluded from
// text scans by design (pinned third-party code, verified by lockfile).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = resolve(appDir, "dist");
const errors = [];

const RUNTIME_PREFIX = "models/ort/";
const ORT_RUNTIME_FILES = [
  "models/ort/ort-wasm-simd-threaded.jsep.mjs",
  "models/ort/ort-wasm-simd-threaded.jsep.wasm",
];
const MAX_RUNTIME_BYTES = 32 * 1024 * 1024;
// Lazy transcription worker graph (pinned transformers.js), loaded only on
// explicit learner activation and then cached.
const MAX_TOTAL_JS_BYTES = 3 * 1024 * 1024;
const PUBLIC_PRACTICE_PACK = "packs/mpt-cardiorespiratory-review-candidate.json";

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const files = filesUnder(distDir);
const names = files.map((file) => relative(distDir, file));
const required = [
  "index.html",
  "manifest.webmanifest",
  "sw.js",
  PUBLIC_PRACTICE_PACK,
  ...ORT_RUNTIME_FILES,
];
for (const name of required) {
  if (!names.includes(name)) errors.push(`missing required artifact: ${name}`);
}

for (const name of names) {
  if (name.endsWith(".map")) errors.push(`production source map is forbidden: ${name}`);
  if (name === "beta-packs" || name.startsWith("beta-packs/")) {
    errors.push(`legacy beta-packs path leaked into the public artifact: ${name}`);
  }
  if (name === "packs/demo-interaction-fixture.json") {
    errors.push("generic interaction fixture must not ship to learners");
  }
  if (/not-for-publication|mpt-competency-draft|medical-candidate/i.test(name)) {
    errors.push(`draft/reference content leaked into the artifact: ${name}`);
  }
}
if (names.includes("registerSW.js")) {
  errors.push("duplicate auto-generated service-worker registrar is present");
}

const textExtensions = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".svg"]);
const forbiddenText = [
  ["synthetic-not-for-publication", "draft fixture identifier"],
  ["mpt-competency-draft", "reference curriculum marker"],
  ["mpt-clinical-reviewer", "fabricated medical reviewer identifier"],
  ["demo-interaction-fixture", "generic interaction fixture identifier"],
  ["Everyday Explanations", "generic Everyday subject"],
  ["Science and Nature", "generic Science subject"],
  ["Reasoning and Trade-offs", "generic Reasoning subject"],
  ["-----BEGIN PRIVATE KEY-----", "private key"],
];
const credentialPatterns = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
];

for (const file of files.filter((candidate) => textExtensions.has(extname(candidate)))) {
  const text = readFileSync(file, "utf8");
  const name = relative(distDir, file);
  for (const [needle, label] of forbiddenText) {
    if (text.includes(needle)) errors.push(`${label} found in ${name}`);
  }
  for (const pattern of credentialPatterns) {
    if (pattern.test(text)) errors.push(`credential-like value found in ${name}`);
  }
  if (file.endsWith(".js")) {
    if (text.includes("new Function(")) {
      errors.push(`dynamic Function construction found in ${name}; strict CSP forbids it`);
    }
    if (/(^|[^A-Za-z0-9_$])eval\s*\(/.test(text)) {
      errors.push(`dynamic eval found in ${name}; strict CSP forbids it`);
    }
  }
}

// Public testing deliberately uses the exact source-grounded medical candidate,
// but it must remain an unattested DRAFT. These assertions prevent a build from
// silently relabelling it as reviewed or switching back to generic topics.
const publicPack = JSON.parse(readFileSync(resolve(distDir, PUBLIC_PRACTICE_PACK), "utf8"));
const publicTopicCount = Array.isArray(publicPack.subjects)
  ? publicPack.subjects.reduce(
      (total, subject) => total + (Array.isArray(subject.topics) ? subject.topics.length : 0),
      0,
    )
  : 0;
if (
  publicPack.packId !== "mpt-cardiorespiratory-review-candidate" ||
  publicPack.contentKind !== "MEDICAL" ||
  publicPack.review?.status !== "DRAFT" ||
  !Array.isArray(publicPack.review?.reviewers) ||
  publicPack.review.reviewers.length !== 0 ||
  publicPack.review.reviewedAt !== null ||
  publicTopicCount !== 20
) {
  errors.push("public physiotherapy pack is not the expected unattested 20-topic DRAFT");
}

const html = readFileSync(resolve(distDir, "index.html"), "utf8");
if (!html.includes("Content-Security-Policy")) errors.push("index.html has no CSP");
// 'wasm-unsafe-eval' is the scoped v0.3 exception (WebAssembly only, no JS eval);
// bare unsafe-eval/unsafe-inline remain forbidden.
if (/unsafe-inline|(?<!wasm-)unsafe-eval/.test(html)) {
  errors.push("CSP contains an unsafe source");
}
for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
  if (!/\bsrc\s*=/.test(match[1] ?? "")) errors.push("index.html contains an inline script");
}

const manifest = JSON.parse(readFileSync(resolve(distDir, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "/MediPrompt/" || manifest.scope !== "/MediPrompt/") {
  errors.push("manifest start_url/scope do not match the GitHub Pages repository path");
}

const isRuntime = (file) => relative(distDir, file).startsWith(RUNTIME_PREFIX);
const runtimeBytes = files
  .filter(isRuntime)
  .reduce((total, file) => total + statSync(file).size, 0);
if (runtimeBytes > MAX_RUNTIME_BYTES) {
  errors.push(`speech runtime budget exceeded: ${runtimeBytes} bytes`);
}

// Initial-load JS: only the entry scripts referenced by index.html. The v0.2
// lightweight contract applies to the shell the learner pays for up front.
const entryScripts = new Set(
  [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map((match) =>
    // Strip the leading slash and any base-path prefix so the value matches a
    // dist-relative path regardless of VITE_BASE_PATH.
    match[1].replace(/^\//, "").replace(/^MediPrompt\//, ""),
  ),
);
const entryJsBytes = files
  .filter((file) => file.endsWith(".js") && entryScripts.has(relative(distDir, file)))
  .reduce((total, file) => total + statSync(file).size, 0);
if (entryJsBytes > 512 * 1024) {
  errors.push(`entry JavaScript budget exceeded: ${entryJsBytes} bytes`);
}

const totalJsBytes = files
  .filter((file) => file.endsWith(".js"))
  .reduce((total, file) => total + statSync(file).size, 0);
if (totalJsBytes > MAX_TOTAL_JS_BYTES) {
  errors.push(`total JavaScript budget exceeded: ${totalJsBytes} bytes`);
}

const shellBytes = files
  .filter((file) => !isRuntime(file))
  .reduce((total, file) => total + statSync(file).size, 0);
// v0.3: the shell now carries the pinned transformers.js worker graph (~0.9 MB)
// so the service worker can precache it for offline transcription. Initial load
// is still bounded by the entry budget above; the wasm runtime is separate.
const MAX_SHELL_BYTES = 1536 * 1024;
if (shellBytes > MAX_SHELL_BYTES) errors.push(`shell budget exceeded: ${shellBytes} bytes`);

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(2);
}

console.log(
  `build validation passed (${names.length} files, ${entryJsBytes} entry JS bytes, ${totalJsBytes} total JS bytes, ${shellBytes} shell bytes, ${runtimeBytes} runtime bytes)`,
);
