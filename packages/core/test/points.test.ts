import { describe, expect, it } from "vitest";
import { MONTHLY_RECEIVE_CAP, STARTING_POINTS, applyReceive, balanceOf, giverEarns, newMonth, quoteReceive } from "../src/index.js";

describe("points", () => {
  it("starts new members at 300", () => expect(STARTING_POINTS).toBe(300));

  it("spends points when the balance covers the tier", () => {
    expect(quoteReceive(newMonth(300), "Medium")).toEqual({ allowed: true, method: "points", cost: 150 });
  });

  it("falls back to the monthly allowance at a low balance", () => {
    let s = newMonth(0);
    expect(quoteReceive(s, "Small")).toMatchObject({ allowed: true, method: "allowance" });
    s = applyReceive(s, "Small").state;
    s = applyReceive(s, "Small").state;
    expect(quoteReceive(s, "Small")).toMatchObject({ allowed: false, reason: "insufficient_points" });
    expect(quoteReceive(s, "Medium")).toMatchObject({ allowed: true, method: "allowance" });
    expect(quoteReceive(s, "Large")).toMatchObject({ allowed: false, reason: "insufficient_points" });
    expect(s.balance).toBe(0);
  });

  it("never lets the balance go negative", () => {
    const r = applyReceive(newMonth(100), "Medium");
    expect(r.method).toBe("allowance");
    expect(r.state.balance).toBe(100);
  });

  it("enforces the monthly cap, with Large items counting double", () => {
    let s = { ...newMonth(10_000), receivedThisMonth: MONTHLY_RECEIVE_CAP - 1 };
    expect(quoteReceive(s, "Large")).toMatchObject({ allowed: false, reason: "monthly_cap" });
    expect(quoteReceive(s, "Small")).toMatchObject({ allowed: true });
    s = applyReceive(s, "Small").state;
    expect(quoteReceive(s, "Small")).toMatchObject({ allowed: false, reason: "monthly_cap" });
  });

  it("pays givers by tier and sums the ledger per user", () => {
    expect(giverEarns("Large")).toBe(300);
    expect(balanceOf([{ userId: "a", delta: 300 }, { userId: "a", delta: -50 }, { userId: "b", delta: 300 }], "a")).toBe(250);
  });
});
