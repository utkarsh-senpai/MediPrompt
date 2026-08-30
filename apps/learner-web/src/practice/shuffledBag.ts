import type { RandomSource } from "@/platform/random";

// Non-repeating random draw (docs/V0.2_DEVELOPMENT_CONTEXT.md §6).
// Pure: randomness and bag persistence are injected. Bag state is treated as
// untrusted even behind the port: duplicates and unknown IDs are removed.

export function fingerprint(parts: readonly string[]): string {
  return [...new Set(parts)].sort().join("|");
}

function fisherYates<T>(items: readonly T[], random: RandomSource): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = random.int(i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export interface DrawInput {
  eligible: readonly string[];
  bag: readonly string[];
  random: RandomSource;
  lastDrawnId?: string;
}

export interface DrawOutput {
  chosen: string;
  remaining: string[];
}

export function draw(input: DrawInput): DrawOutput {
  const eligibleSet = new Set(input.eligible);
  const eligibleSorted = [...eligibleSet].sort();

  if (eligibleSorted.length === 0) {
    throw new Error("no eligible variants for selection");
  }

  // Treat stored bag as untrusted: drop duplicates and IDs no longer eligible.
  const seen = new Set<string>();
  const remaining: string[] = [];
  for (const id of input.bag) {
    if (typeof id === "string" && eligibleSet.has(id) && !seen.has(id)) {
      seen.add(id);
      remaining.push(id);
    }
  }

  if (remaining.length === 0) {
    const shuffled = fisherYates(eligibleSorted, input.random);
    // Avoid an immediate repeat of the last drawn variant after a reshuffle.
    if (
      input.lastDrawnId &&
      shuffled.length >= 2 &&
      shuffled[0] === input.lastDrawnId
    ) {
      const swap = 1 + input.random.int(shuffled.length - 1);
      const first = shuffled[0]!;
      shuffled[0] = shuffled[swap]!;
      shuffled[swap] = first;
    }
    const [chosen, ...rest] = shuffled;
    return { chosen: chosen!, remaining: rest };
  }

  const [chosen, ...rest] = remaining;
  return { chosen: chosen!, remaining: rest };
}
