import type { BagState, BagStore } from "@/practice/types";

// v0.2 bag store is session-memory only (no IndexedDB). The bag is the remaining
// shuffled variant queue for a filter fingerprint; see shuffledBag.ts.
export class InMemoryBagStore implements BagStore {
  private readonly map = new Map<string, BagState>();

  load(fingerprint: string): BagState | undefined {
    const state = this.map.get(fingerprint);
    if (!state) return undefined;
    return {
      eligibleVariantIds: [...state.eligibleVariantIds],
      remainingVariantIds: [...state.remainingVariantIds],
    };
  }

  save(fingerprint: string, state: BagState): void {
    this.map.set(fingerprint, {
      eligibleVariantIds: [...state.eligibleVariantIds],
      remainingVariantIds: [...state.remainingVariantIds],
    });
  }

  clear(): void {
    this.map.clear();
  }
}
