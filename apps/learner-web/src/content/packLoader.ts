import type { RuntimePack } from "@/practice/types";
import { validatePack, assertV02ProductionPack } from "./packValidator";

/** The pack precached by the service worker and fetched at activation. */
export const PRODUCTION_PACK_ID = "demo-interaction-fixture";

/**
 * Fetch, validate, and production-gate the bundled runtime pack.
 * A failed fetch or an invalid/newer pack throws; the caller falls back to the
 * previous cached pack or the empty-capability message. The pack is frozen.
 */
export async function loadBundledPack(): Promise<RuntimePack> {
  const base = import.meta.env.BASE_URL;
  const url = `${base}packs/${PRODUCTION_PACK_ID}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`pack fetch failed: ${res.status} for ${url}`);
  }
  const obj = await res.json();
  const pack = validatePack(obj);
  assertV02ProductionPack(pack);
  return pack;
}
