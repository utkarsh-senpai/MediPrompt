import { afterEach, describe, expect, it, vi } from "vitest";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";
import { MAX_PACK_BYTES } from "./packValidator";
import { loadBundledPack } from "./packLoader";

function responseFor(value: unknown, overrides: Partial<Response> = {}): Response {
  const body = JSON.stringify(value);
  return {
    ok: true,
    status: 200,
    redirected: false,
    type: "basic",
    url: "",
    headers: new Headers({ "content-length": String(new TextEncoder().encode(body).byteLength) }),
    text: async () => body,
    ...overrides,
  } as Response;
}

describe("loadBundledPack", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads, validates, and gates the full bundled pack", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(demoPackJson)));
    const result = await loadBundledPack();
    expect(result.source).toBe("BUNDLED");
    expect(result.pack.subjects.flatMap((subject) => subject.topics)).toHaveLength(20);
    expect(Object.isFrozen(result.pack)).toBe(true);
  });

  it("uses the compiled reviewed fallback when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    const result = await loadBundledPack();
    expect(result.source).toBe("COMPILED_FALLBACK");
    expect(result.warning).toMatch(/fallback/i);
    expect(result.pack.contentKind).toBe("NON_MEDICAL_INTERACTION");
  });

  it("rejects an oversized response before reading its body", async () => {
    const text = vi.fn(async () => JSON.stringify(demoPackJson));
    const response = responseFor(demoPackJson, {
      headers: new Headers({ "content-length": String(MAX_PACK_BYTES + 1) }),
      text,
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));
    const result = await loadBundledPack();
    expect(result.source).toBe("COMPILED_FALLBACK");
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects redirected or draft content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => responseFor(demoPackJson, { redirected: true })),
    );
    expect((await loadBundledPack()).source).toBe("COMPILED_FALLBACK");

    const draft = JSON.parse(JSON.stringify(demoPackJson)) as {
      review: { status: string };
    };
    draft.review.status = "DRAFT";
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(draft)));
    expect((await loadBundledPack()).source).toBe("COMPILED_FALLBACK");
  });
});
