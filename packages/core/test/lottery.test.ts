import { describe, expect, it } from "vitest";
import { draw } from "../src/index.js";

const entrants = ["u1", "u2", "u3", "u4", "u5", "u6"].map((userId) => ({ userId, reliability: 80 }));

describe("draw", () => {
  it("is deterministic for the same seed", () => {
    expect(draw("L1:2026-10-13T20:00Z", "g", entrants)).toEqual(draw("L1:2026-10-13T20:00Z", "g", [...entrants].reverse()));
  });

  it("picks one winner and up to three distinct backups", () => {
    const r = draw("seed", "g", entrants);
    expect(r.winner).toBeDefined();
    expect(r.backups).toHaveLength(3);
    expect(new Set([r.winner, ...r.backups]).size).toBe(4);
  });

  it("skips the giver, duplicates and low reliability", () => {
    const r = draw("seed", "g", [{ userId: "g", reliability: 90 }, { userId: "u1", reliability: 90 }, { userId: "u1", reliability: 90 }, { userId: "u2", reliability: 10 }]);
    expect(r.winner).toBe("u1");
    expect(r.backups).toEqual([]);
    expect(r.skipped.map((s) => s.reason)).toEqual(["giver", "duplicate", "low_reliability"]);
  });

  it("returns no winner with no eligible entrants", () => {
    expect(draw("seed", "g", []).winner).toBeUndefined();
  });

  it("spreads wins across seeds", () => {
    const wins = new Set(Array.from({ length: 50 }, (_, i) => draw(`s${i}`, "g", entrants).winner));
    expect(wins.size).toBeGreaterThan(3);
  });
});
