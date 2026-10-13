import { describe, expect, it } from "vitest";
import { AFFILIATE_DISCLOSURE, KNOWN_PRODUCTS, matchProduct, productUrl, searchUrl, shopLink, type AffiliateConfig } from "../src/index.js";

const cfg: AffiliateConfig = { tag: "bumpalong-20", placementTags: { lost_draw: "bumpalong-lost-20" }, platforms: ["web"] };
const pump = { title: "Spectra S1 breast pump", model: "Spectra S1 Plus", category: "Nursing and pumping", subcategory: "Breast pumps" };

describe("matchProduct", () => {
  it("matches a known product from the model field first", () => {
    expect(matchProduct(pump)).toMatchObject({ kind: "exact", product: { brand: "Spectra", model: "S1" }, confidence: 0.95 });
  });
  it("matches from the title on whole words only", () => {
    expect(matchProduct({ ...pump, model: "" })).toMatchObject({ kind: "exact", confidence: 0.8 });
    expect(matchProduct({ ...pump, model: "", title: "Spectras1x pump" })).toMatchObject({ kind: "search" });
  });
  it("searches what the giver typed when the product is unknown", () => {
    expect(matchProduct({ ...pump, title: "Pump", model: "Lansinoh Signature Pro" })).toEqual({ kind: "search", query: "Lansinoh Signature Pro", confidence: 0.6 });
  });
  it("falls back to the item type, without the new/sealed note", () => {
    expect(matchProduct({ title: "Kit", category: "Postpartum recovery", subcategory: "Recovery kits (sealed)" })).toEqual({ kind: "search", query: "Recovery kits", confidence: 0.3 });
  });
  it("gives up on unknown categories", () => {
    expect(matchProduct({ title: "x", category: "Garden", subcategory: "Rakes" })).toBeUndefined();
  });
});

describe("urls", () => {
  it("builds direct amazon.com links with the tag", () => {
    expect(productUrl("B00T3ZSS1Q", "t-20")).toBe("https://www.amazon.com/dp/B00T3ZSS1Q?tag=t-20");
    expect(searchUrl("pump parts & valves", "t-20")).toBe("https://www.amazon.com/s?k=pump+parts+%26+valves&tag=t-20");
    expect(() => productUrl("bad", "t")).toThrow();
  });
  it("has well-formed seed ASINs", () => {
    for (const p of KNOWN_PRODUCTS) expect(p.asin).toMatch(/^[A-Z0-9]{10}$/);
  });
});

describe("shopLink", () => {
  it("offers replacement parts for a known pump", () => {
    const l = shopLink(cfg, { placement: "replacement_parts", platform: "web", listing: pump });
    expect(l?.label).toBe("New parts for the Spectra S1 on Amazon");
    expect(l?.url).toContain("tag=bumpalong-20");
    expect(l?.disclosure).toBe(AFFILIATE_DISCLOSURE);
  });
  it("uses the placement tracking ID and an exact product after a lost draw", () => {
    const l = shopLink(cfg, { placement: "lost_draw", platform: "web", listing: pump });
    expect(l?.url).toBe("https://www.amazon.com/dp/B00T3ZSS1Q?tag=bumpalong-lost-20");
  });
  it("offers buy-new only for must-be-new item types", () => {
    expect(shopLink(cfg, { placement: "buy_new", platform: "web", listing: pump })).toBeUndefined();
    const kit = { title: "Frida recovery kit", category: "Postpartum recovery", subcategory: "Recovery kits (sealed)" };
    expect(shopLink(cfg, { placement: "buy_new", platform: "web", listing: kit })?.url).toContain("k=Recovery+kits");
  });
  it("shows nothing on unapproved platforms, without a tag, or for blocked items", () => {
    expect(shopLink(cfg, { placement: "lost_draw", platform: "ios", listing: pump })).toBeUndefined();
    expect(shopLink({ ...cfg, tag: "" }, { placement: "lost_draw", platform: "web", listing: pump })).toBeUndefined();
    expect(shopLink(cfg, { placement: "lost_draw", platform: "web", listing: { ...pump, blocked: true } })).toBeUndefined();
  });
});
