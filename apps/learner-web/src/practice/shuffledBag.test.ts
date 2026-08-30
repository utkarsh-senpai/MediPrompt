import { describe, expect, it } from "vitest";
import { draw, fingerprint } from "./shuffledBag";
import { seededRandom } from "@/platform/random";

describe("fingerprint", () => {
  it("is order-independent and dedupes", () => {
    expect(fingerprint(["b", "a", "a"])).toBe("a|b");
    expect(fingerprint(["a", "b"])).toBe(fingerprint(["b", "a"]));
  });
});

describe("draw", () => {
  it("throws when there are no eligible variants", () => {
    expect(() =>
      draw({ eligible: [], bag: [], random: seededRandom(1) }),
    ).toThrow();
  });

  it("returns the only eligible variant and an empty bag", () => {
    const out = draw({ eligible: ["a"], bag: [], random: seededRandom(1) });
    expect(out.chosen).toBe("a");
    expect(out.remaining).toEqual([]);
  });

  it("does not repeat a variant before the bag is exhausted", () => {
    const eligible = ["a", "b", "c"];
    const random = seededRandom(42);
    let bag: string[] = [];
    const drawn: string[] = [];
    for (let i = 0; i < 3; i++) {
      const out = draw({ eligible, bag, random, lastDrawnId: drawn[i - 1] });
      drawn.push(out.chosen);
      bag = out.remaining;
    }
    expect(new Set(drawn).size).toBe(3); // all distinct before exhaustion
    expect(bag).toEqual([]);
  });

  it("treats stored bag state as untrusted: drops dups and unknown ids", () => {
    const out = draw({
      eligible: ["a", "b"],
      bag: ["a", "a", "zzz", "b"],
      random: seededRandom(1),
    });
    expect(out.chosen).toBe("a");
    expect(out.remaining).toEqual(["b"]);
  });

  it("avoids an immediate repeat after a reshuffle when alternatives exist", () => {
    const eligible = ["a", "b", "c"];
    const random = seededRandom(7);
    // Exhaust the bag so the next draw reshuffles.
    let bag: string[] = [];
    let last: string | undefined;
    for (let i = 0; i < 3; i++) {
      const out = draw({ eligible, bag, random, lastDrawnId: last });
      last = out.chosen;
      bag = out.remaining;
    }
    expect(bag).toEqual([]);
    // Reshuffle: the first item must not equal the last drawn.
    const reshuffle = draw({ eligible, bag, random, lastDrawnId: last });
    expect(reshuffle.chosen).not.toBe(last);
  });
});
