import type { BagStore } from "@/practice/types";

// v0.2 bag store is session-memory only (no IndexedDB). The bag is the remaining
// shuffled variant queue for a filter fingerprint; see shuffledBag.ts.
export class InMemoryBagStore implements BagStore {
  private readonly map = new Map<string, string[]>();

  load(fingerprint: string): readonly string[] {
    return this.map.get(fingerprint) ?? [];
  }

  save(fingerprint: string, remainingVariantIds: readonly string[]): void {
    this.map.set(fingerprint, [...remainingVariantIds]);
  }

  clear(): void {
    this.map.clear();
  }
}
