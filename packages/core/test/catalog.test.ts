import { describe, expect, it } from "vitest";
import { CATALOG, STAGES, SUBCATEGORY_TIER, categoriesForStage, isValidSubcategory, mustBeNew, tierOf } from "../src/index.js";

describe("catalog", () => {
  it("has 17 categories and every stage has some", () => {
    expect(CATALOG).toHaveLength(17);
    for (const s of STAGES) expect(categoriesForStage(s).length).toBeGreaterThan(0);
  });

  it("has unique category names and item types", () => {
    expect(new Set(CATALOG.map((c) => c.name)).size).toBe(CATALOG.length);
    const subs = CATALOG.flatMap((c) => c.subcategories);
    expect(new Set(subs).size).toBe(subs.length);
  });

  it("only overrides tiers for item types that exist", () => {
    const subs = new Set(CATALOG.flatMap((c) => c.subcategories));
    for (const s of Object.keys(SUBCATEGORY_TIER)) expect(subs.has(s), s).toBe(true);
  });

  it("uses the item type tier before the category tier", () => {
    expect(tierOf("Sleep", "Crib sheets")).toBe("Small");
    expect(tierOf("Sleep", "Cribs")).toBe("Large");
    expect(tierOf("Nursing and pumping", "Breast pumps")).toBe("Medium");
    expect(tierOf("Car seats")).toBe("Medium");
    expect(() => tierOf("Garden tools")).toThrow();
  });

  it("validates item types against their own category", () => {
    expect(isValidSubcategory("Car seats", "Booster seats")).toBe(true);
    expect(isValidSubcategory("Car seats", "Cribs")).toBe(false);
  });

  it("flags item types that must be new", () => {
    expect(mustBeNew("Pump parts (new, sealed)")).toBe(true);
    expect(mustBeNew("Formula (sealed, in date)")).toBe(true);
    expect(mustBeNew("Breast pumps")).toBe(false);
  });
});
