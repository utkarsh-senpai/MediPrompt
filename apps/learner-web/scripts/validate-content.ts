// Validates content packs against the runtime schema + custom cross-reference checks.
// - content/packs/*.json : production packs; must also pass the v0.2 production gate.
// - content/fixtures/*.json: test fixtures; structural validation only (may be DRAFT /
//   NOT_FOR_PUBLICATION and must NOT pass the production gate by accident).
//
// Exit codes: 0 success, 2 validation failure.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validatePack,
  assertV02ProductionPack,
  assertV02DemoMinimums,
  PackValidationError,
  MAX_PACK_BYTES,
} from "../src/content/packValidator";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packsDir = resolve(__dirname, "../../../content/packs");
const fixturesDir = resolve(__dirname, "../../../content/fixtures");

function readJson(file: string): unknown {
  if (statSync(file).size > MAX_PACK_BYTES) {
    throw new Error(`file exceeds ${MAX_PACK_BYTES} bytes`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function listJson(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => resolve(dir, f));
}

let failed = 0;

function fail(label: string, err: unknown): void {
  failed++;
  if (err instanceof PackValidationError) {
    console.error(`FAIL ${label}`);
    for (const e of err.errors) console.error(`   - ${e}`);
  } else {
    console.error(`FAIL ${label}: ${(err as Error).message}`);
  }
}

const packFiles = listJson(packsDir);
const fixtureFiles = listJson(fixturesDir);

if (packFiles.length !== 1) {
  console.error(`FAIL content/packs must contain exactly one v0.2 JSON pack, got ${packFiles.length}`);
  failed++;
}
if (fixtureFiles.length === 0) {
  console.error("FAIL content/fixtures must contain a production-gate rejection fixture");
  failed++;
}

for (const file of packFiles) {
  const label = `pack:${file.split("/").pop()}`;
  try {
    const pack = validatePack(readJson(file));
    assertV02ProductionPack(pack);
    assertV02DemoMinimums(pack);
    if (basename(file) !== `${pack.packId}.json`) {
      throw new Error(`filename must match packId (${pack.packId}.json)`);
    }
    console.error(`ok   ${label} (${pack.subjects.reduce((n, s) => n + s.topics.length, 0)} topics, ${pack.review.status})`);
  } catch (err) {
    fail(label, err);
  }
}

for (const file of fixtureFiles) {
  const label = `fixture:${file.split("/").pop()}`;
  try {
    const pack = validatePack(readJson(file));
    // A fixture must be structurally valid but must NOT satisfy the production gate.
    let gateThrew = false;
    try {
      assertV02ProductionPack(pack);
    } catch {
      gateThrew = true;
    }
    if (!gateThrew) {
      throw new Error("fixture unexpectedly passed the production gate");
    }
    console.error(`ok   ${label} (structural ok, production-gate rejected as expected)`);
  } catch (err) {
    fail(label, err);
  }
}

if (failed > 0) {
  console.error(`\n${failed} content validation failure(s)`);
  process.exit(2);
}
console.error("\ncontent validation passed");
