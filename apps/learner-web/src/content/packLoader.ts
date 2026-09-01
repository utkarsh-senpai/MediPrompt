import type { RuntimePack } from "@/practice/types";
import {
  MAX_PACK_BYTES,
  assertV02DemoMinimums,
  assertV02ProductionPack,
  validatePack,
} from "./packValidator";
import { FALLBACK_PACK } from "./fallbackPack";

/** The pack precached by the service worker and fetched at activation. */
export const PRODUCTION_PACK_ID = "mpt-cardiorespiratory-v1";

/**
 * Fetch, validate, and production-gate the bundled runtime pack.
 * A failed fetch or an invalid/newer pack throws; the caller falls back to the
 * previous cached pack or the empty-capability message. The pack is frozen.
 */
export interface PackLoadResult {
  pack: RuntimePack;
  source: "BUNDLED" | "COMPILED_FALLBACK";
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

export async function loadBundledPack(): Promise<PackLoadResult> {
  const base = import.meta.env.BASE_URL;
  const url = `${base}packs/${PRODUCTION_PACK_ID}.json`;
  try {
    const res = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
    if (!res.ok || res.redirected || res.type === "opaque") {
      throw new Error(`pack fetch failed with status ${res.status}`);
    }
    if (res.url && new URL(res.url).origin !== globalThis.location.origin) {
      throw new Error("practice pack redirected across origins");
    }
    const pack = validatePack(await parseBoundedResponse(res));
    assertV02ProductionPack(pack);
    assertV02DemoMinimums(pack);
    return { pack, source: "BUNDLED" };
  } catch {
    return {
      pack: compiledFallback(),
      source: "COMPILED_FALLBACK",
      warning:
        "The full practice pack was unavailable or invalid. A small reviewed offline fallback is active.",
    };
  }
}
