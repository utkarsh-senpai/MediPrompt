import { describe, expect, it } from "vitest";
import { draw, fingerprint } from "./shuffledBag";
import { seededRandom } from "@/platform/random";

describe("fingerprint", () => {
  it("preserves dimension order and value boundaries without delimiter collisions", () => {
    expect(fingerprint(["pack", "subject", "mode"]))
      .not.toBe(fingerprint(["mode", "subject", "pack"]));
    expect(fingerprint(["a|b", "c"]))
      .not.toBe(fingerprint(["a", "b|c"]));
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
    let previousEligible: string[] | undefined;
    const drawn: string[] = [];
    for (let i = 0; i < 3; i++) {
      const out = draw({
        eligible,
        previousEligible,
        bag,
        random,
        lastDrawnId: drawn[i - 1],
      });
      drawn.push(out.chosen);
      bag = out.remaining;
      previousEligible = eligible;
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

  it("preserves undrawn entries and appends only newly eligible ids", () => {
    const out = draw({
      eligible: ["a", "b", "c"],
      previousEligible: ["a", "b"],
      bag: ["b"],
      random: seededRandom(1),
    });
    expect(out.chosen).toBe("b");
    expect(out.remaining).toEqual(["c"]);
  });

  it("avoids an immediate repeat after a reshuffle when alternatives exist", () => {
    const eligible = ["a", "b", "c"];
    const random = seededRandom(7);
    // Exhaust the bag so the next draw reshuffles.
    let bag: string[] = [];
    let previousEligible: string[] | undefined;
    let last: string | undefined;
    for (let i = 0; i < 3; i++) {
      const out = draw({ eligible, previousEligible, bag, random, lastDrawnId: last });
      last = out.chosen;
      bag = out.remaining;
      previousEligible = eligible;
    }
    expect(bag).toEqual([]);
    // Reshuffle: the first item must not equal the last drawn.
    const reshuffle = draw({ eligible, previousEligible, bag, random, lastDrawnId: last });
    expect(reshuffle.chosen).not.toBe(last);
  });
});
