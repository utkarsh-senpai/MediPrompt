import type { RuntimePack } from "@/practice/types";
import {
  MAX_PACK_BYTES,
  assertControlledDraftPack,
  assertV02DemoMinimums,
  assertV02ProductionPack,
  validatePack,
} from "./packValidator";
import { FALLBACK_PACK } from "./fallbackPack";

/** The pack precached by the service worker and fetched at activation. */
export const PRODUCTION_PACK_ID = "demo-interaction-fixture";

/**
 * Fetch, validate, and production-gate the bundled runtime pack.
 * A failed fetch or an invalid/newer pack throws; the caller falls back to the
 * previous cached pack or the empty-capability message. The pack is frozen.
 */
export interface PackLoadResult {
  pack: RuntimePack;
  source: "BUNDLED" | "CONTROLLED_DRAFT" | "COMPILED_FALLBACK";
  warning?: string;
}

function responseLength(response: Response): number | null {
  const raw = response.headers.get("content-length");
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

async function parseBoundedResponse(response: Response): Promise<unknown> {
  const declaredLength = responseLength(response);
  if (declaredLength !== null && declaredLength > MAX_PACK_BYTES) {
    throw new Error("practice pack exceeds the size limit");
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_PACK_BYTES) {
    throw new Error("practice pack exceeds the size limit");
  }
  return JSON.parse(text) as unknown;
}

function compiledFallback(): RuntimePack {
  const pack = validatePack(FALLBACK_PACK);
  assertV02ProductionPack(pack);
  return pack;
}

async function fetchPack(path: string): Promise<RuntimePack> {
  const base = import.meta.env.BASE_URL;
  const url = `${base}${path}`;
  const res = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
  if (!res.ok || res.redirected || res.type === "opaque") {
    throw new Error(`pack fetch failed with status ${res.status}`);
  }
  if (res.url && new URL(res.url).origin !== globalThis.location.origin) {
    throw new Error("practice pack redirected across origins");
  }
  return validatePack(await parseBoundedResponse(res));
}

async function loadProductionPack(warning?: string): Promise<PackLoadResult> {
  try {
    const pack = await fetchPack(`packs/${PRODUCTION_PACK_ID}.json`);
    assertV02ProductionPack(pack);
    assertV02DemoMinimums(pack);
    return { pack, source: "BUNDLED", ...(warning ? { warning } : {}) };
  } catch {
    return {
      pack: compiledFallback(),
      source: "COMPILED_FALLBACK",
      warning: warning ??
        "The full practice pack was unavailable or invalid. A small reviewed offline fallback is active.",
    };
  }
}

export async function loadPackForMode(mode: string): Promise<PackLoadResult> {
  if (mode === "medical-beta") {
    try {
      const pack = await fetchPack(
        "beta-packs/mpt-cardiorespiratory-review-candidate.json",
      );
      assertControlledDraftPack(pack);
      return { pack, source: "CONTROLLED_DRAFT" };
    } catch {
      return loadProductionPack(
        "The controlled medical draft could not be loaded safely. The reviewed interaction fixture is active instead.",
      );
    }
  }
  return loadProductionPack();
}

export async function loadBundledPack(): Promise<PackLoadResult> {
  return loadPackForMode(import.meta.env.MODE);
}
