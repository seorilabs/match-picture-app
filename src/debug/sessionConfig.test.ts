import { describe, expect, it } from "vitest";

import { parseDebugTotalCards } from "./sessionConfig";

describe("parseDebugTotalCards", () => {
  it("accepts integer card counts within the game range", () => {
    expect(parseDebugTotalCards("1")).toBe(1);
    expect(parseDebugTotalCards("10")).toBe(10);
  });

  it("rejects invalid card counts", () => {
    expect(parseDebugTotalCards(null)).toBeNull();
    expect(parseDebugTotalCards("")).toBeNull();
    expect(parseDebugTotalCards("0")).toBeNull();
    expect(parseDebugTotalCards("11")).toBeNull();
    expect(parseDebugTotalCards("1.5")).toBeNull();
    expect(parseDebugTotalCards("bad")).toBeNull();
  });
});
