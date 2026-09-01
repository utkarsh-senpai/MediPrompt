import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageExamScheduleStore } from "./examScheduleStore";

describe("LocalStorageExamScheduleStore", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a strict calendar date", () => {
    const store = new LocalStorageExamScheduleStore();
    store.save({ schemaVersion: 1, examOn: "2026-12-01" });
    expect(new LocalStorageExamScheduleStore().load()).toEqual({
      schemaVersion: 1,
      examOn: "2026-12-01",
    });
  });

  it("rejects invalid values and clears saved data", () => {
    const store = new LocalStorageExamScheduleStore();
    expect(() =>
      store.save({ schemaVersion: 1, examOn: "2026-02-30" }),
    ).toThrow(TypeError);
    store.save({ schemaVersion: 1, examOn: "2026-12-01" });
    store.clear();
    expect(store.load().examOn).toBeNull();
  });
});
