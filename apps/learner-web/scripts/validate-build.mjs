// Fails closed when the production artifact leaks draft/private material or
// violates the v0.2 static-hosting and lightweight-bundle contract.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = resolve(appDir, "dist");
const errors = [];

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
  "packs/demo-interaction-fixture.json",
];
for (const name of required) {
  if (!names.includes(name)) errors.push(`missing required artifact: ${name}`);
}

for (const name of names) {
  if (name.endsWith(".map")) errors.push(`production source map is forbidden: ${name}`);
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
  ["mpt-cardiorespiratory-review-candidate", "unapproved medical candidate identifier"],
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

const html = readFileSync(resolve(distDir, "index.html"), "utf8");
if (!html.includes("Content-Security-Policy")) errors.push("index.html has no CSP");
if (/unsafe-inline|unsafe-eval/.test(html)) errors.push("CSP contains an unsafe source");
for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
  if (!/\bsrc\s*=/.test(match[1] ?? "")) errors.push("index.html contains an inline script");
}

const manifest = JSON.parse(readFileSync(resolve(distDir, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "/MediPrompt/" || manifest.scope !== "/MediPrompt/") {
  errors.push("manifest start_url/scope do not match the GitHub Pages repository path");
}

const jsBytes = files
  .filter((file) => file.endsWith(".js"))
  .reduce((total, file) => total + statSync(file).size, 0);
const totalBytes = files.reduce((total, file) => total + statSync(file).size, 0);
if (jsBytes > 512 * 1024) errors.push(`JavaScript budget exceeded: ${jsBytes} bytes`);
if (totalBytes > 1024 * 1024) errors.push(`artifact budget exceeded: ${totalBytes} bytes`);

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(2);
}

console.log(
  `build validation passed (${names.length} files, ${jsBytes} JS bytes, ${totalBytes} total bytes)`,
);
