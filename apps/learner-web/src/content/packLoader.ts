import type { RuntimePack } from "@/practice/types";
import {
  MAX_PACK_BYTES,
  assertPublicDraftPracticePack,
  validatePack,
} from "./packValidator";

/** The pack precached by the service worker and fetched at activation. */
export const PUBLIC_PRACTICE_PACK_ID = "mpt-cardiorespiratory-review-candidate";

/**
 * Fetch, validate, and public-draft-gate the bundled runtime pack.
 * A failed fetch or an invalid/newer pack throws; the caller falls back to the
 * previous cached pack or the empty-capability message. The pack is frozen.
 */
export interface PackLoadResult {
  pack: RuntimePack;
  source: "PUBLIC_DRAFT" | "COMPILED_FALLBACK";
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

// The 595-topic pack (~1.05 MiB) is dynamically imported so it loads as a separate
// chunk only when the fetched pack is unavailable, keeping the initial entry JS
// within the bounded pack budget. The service-worker precache is the primary offline path.
async function compiledFallback(): Promise<RuntimePack> {
  const mod = (await import(
    "@content/candidates/mpt-cardiorespiratory-review-candidate.json"
  )) as { default: unknown };
  const pack = validatePack(mod.default);
  assertPublicDraftPracticePack(pack);
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

async function loadPublicPracticePack(): Promise<PackLoadResult> {
  try {
    const pack = await fetchPack(`packs/${PUBLIC_PRACTICE_PACK_ID}.json`);
    assertPublicDraftPracticePack(pack);
    return { pack, source: "PUBLIC_DRAFT" };
  } catch {
    return {
      pack: await compiledFallback(),
      source: "COMPILED_FALLBACK",
      warning:
        "The downloaded physiotherapy pack was unavailable or invalid. The same bundled curriculum-beta snapshot is active offline.",
    };
  }
}

export async function loadBundledPack(): Promise<PackLoadResult> {
  return loadPublicPracticePack();
}
