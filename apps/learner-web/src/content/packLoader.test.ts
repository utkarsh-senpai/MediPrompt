import { afterEach, describe, expect, it, vi } from "vitest";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";
import medicalCandidateJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";
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

  it("loads, validates, and gates the public physiotherapy practice beta", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(medicalCandidateJson)));
    const result = await loadBundledPack();
    expect(result.source).toBe("PUBLIC_DRAFT");
    expect(result.pack.contentKind).toBe("MEDICAL");
    expect(result.pack.review).toEqual({
      status: "DRAFT",
      reviewers: [],
      reviewedAt: null,
    });
    expect(result.pack.subjects.map((subject) => subject.title)).toEqual([
      "Research Methods and Bioethics",
      "Applied Physiotherapeutics",
      "Musculoskeletal Physiotherapy",
      "Neuro Physiotherapy",
      "Cardiovascular & Respiratory Physiotherapy",
      "Community Health Physiotherapy",
      "Sports Physiotherapy",
    ]);
    expect(result.pack.subjects.flatMap((subject) => subject.topics)).toHaveLength(253);
    expect(
      result.pack.subjects.filter((subject) => subject.availability === "ACTIVE"),
    ).toHaveLength(3);
    expect(
      result.pack.subjects.filter((subject) => subject.availability === "COMING_SOON"),
    ).toHaveLength(4);
    expect(Object.isFrozen(result.pack)).toBe(true);
  });

  it("never activates the generic interaction fixture as learner content", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(demoPackJson)));
    const result = await loadBundledPack();
    expect(result.source).toBe("COMPILED_FALLBACK");
    expect(result.pack.packId).toBe("mpt-cardiorespiratory-review-candidate");
    expect(result.pack.contentKind).toBe("MEDICAL");
    expect(result.warning).toMatch(/curriculum-beta snapshot/i);
  });

  it("uses the same compiled physiotherapy snapshot when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    const result = await loadBundledPack();
    expect(result.source).toBe("COMPILED_FALLBACK");
    expect(result.warning).toMatch(/active offline/i);
    expect(result.pack.contentKind).toBe("MEDICAL");
    expect(result.pack.subjects.flatMap((subject) => subject.topics)).toHaveLength(253);
  });

  it("rejects an oversized response before reading its body", async () => {
    const text = vi.fn(async () => JSON.stringify(medicalCandidateJson));
    const response = responseFor(medicalCandidateJson, {
      headers: new Headers({ "content-length": String(MAX_PACK_BYTES + 1) }),
      text,
    });
    vi.stubGlobal("fetch", vi.fn(async () => response));
    const result = await loadBundledPack();
    expect(result.source).toBe("COMPILED_FALLBACK");
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects redirected or falsely approved public-beta content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => responseFor(medicalCandidateJson, { redirected: true })),
    );
    expect((await loadBundledPack()).source).toBe("COMPILED_FALLBACK");

    const falselyApproved = JSON.parse(JSON.stringify(medicalCandidateJson)) as {
      review: { status: string };
    };
    falselyApproved.review.status = "APPROVED";
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(falselyApproved)));
    expect((await loadBundledPack()).source).toBe("COMPILED_FALLBACK");
  });
});
