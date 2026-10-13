import { describe, expect, it } from "vitest";
import { checkListing, findBannedPhrase, type ListingDraft } from "../src/index.js";

const NOW = new Date(Date.UTC(2026, 9, 13));
const base: ListingDraft = { title: "Board books", category: "Toys and books", subcategory: "Board books", condition: "Gently used" };
const codes = (d: ListingDraft) => checkListing(d, NOW).errors.map((e) => e.code);

describe("checkListing", () => {
  it("passes a simple listing", () => {
    const r = checkListing(base, NOW);
    expect(r.ok).toBe(true);
    expect(r.needsRecallCheck).toBe(false);
  });

  it("requires a title and a known category and item type", () => {
    expect(codes({ ...base, title: "  " })).toContain("title_missing");
    expect(codes({ ...base, category: "Garden" })).toContain("category_unknown");
    expect(codes({ ...base, subcategory: "Cribs" })).toContain("subcategory_unknown");
  });

  it("blocks banned items in the title or description", () => {
    expect(codes({ ...base, description: "comes with a crib bumper" })).toContain("banned_item");
    expect(codes({ ...base, title: "Frozen breastmilk" })).toContain("banned_item");
    expect(codes({ ...base, title: "Drop-side crib" })).toContain("banned_item");
  });

  it("does not block allowed phrases that contain a banned word", () => {
    expect(findBannedPhrase("Pacifier clip, never used")).toBeUndefined();
    expect(findBannedPhrase("Pacifier and clip")).toBeDefined();
  });

  it("requires must-be-new item types to be new", () => {
    const d: ListingDraft = { ...base, title: "Recovery kit", category: "Postpartum recovery", subcategory: "Recovery kits (sealed)" };
    expect(codes(d)).toContain("must_be_new");
    expect(codes({ ...d, condition: "New with tags" })).not.toContain("must_be_new");
  });

  describe("car seats", () => {
    const seat: ListingDraft = { title: "Graco SnugRide", category: "Car seats", subcategory: "Infant car seats", condition: "Like new", carSeat: { expires: "2030-03", crash: "no", model: "Graco SnugRide 35" } };

    it("passes with expiry, no crash and model", () => {
      const r = checkListing(seat, NOW);
      expect(r.errors).toEqual([]);
      expect(r.badges).toContain("Expires Mar 2030");
      expect(r.needsRecallCheck).toBe(true);
    });
    it("blocks expired, crashed, unsure and missing answers", () => {
      expect(codes({ ...seat, carSeat: { ...seat.carSeat, expires: "2026-09" } })).toContain("car_seat_expired");
      expect(codes({ ...seat, carSeat: { ...seat.carSeat, crash: "yes" } })).toContain("car_seat_crashed");
      expect(codes({ ...seat, carSeat: { ...seat.carSeat, crash: "unsure" } })).toContain("car_seat_crash_unknown");
      expect(codes({ ...seat, carSeat: {} })).toEqual(expect.arrayContaining(["car_seat_expiry_missing", "car_seat_crash_missing"]));
      expect(codes({ ...seat, carSeat: { ...seat.carSeat, expires: "2030-13" } })).toContain("car_seat_expiry_invalid");
    });
    it("allows a seat expiring this month but warns", () => {
      const r = checkListing({ ...seat, carSeat: { ...seat.carSeat, expires: "2026-10" } }, NOW);
      expect(r.ok).toBe(true);
      expect(r.warnings.map((w) => w.code)).toContain("car_seat_expiring");
    });
  });

  describe("pumps and formula", () => {
    const pump: ListingDraft = { title: "Spectra S1", category: "Nursing and pumping", subcategory: "Breast pumps", condition: "Gently used", pump: { type: "closed", personalParts: "na" } };
    it("allows a used closed-system pump without parts", () => {
      expect(checkListing(pump, NOW).ok).toBe(true);
    });
    it("blocks used open-system pumps and used personal parts", () => {
      expect(codes({ ...pump, pump: { type: "open", personalParts: "na" } })).toContain("pump_open_used");
      expect(codes({ ...pump, pump: { type: "closed", personalParts: "used" } })).toContain("pump_parts_used");
    });
    it("blocks opened formula", () => {
      expect(codes({ ...base, category: "Bottles and formula", subcategory: "Formula pitchers and dispensers", formula: "open" })).toContain("formula_open");
    });
  });

  describe("sleep", () => {
    const crib: ListingDraft = { title: "IKEA crib", category: "Sleep", subcategory: "Cribs", condition: "Gently used", sleep: { model: "IKEA Sniglar", yearMade: 2019 } };
    it("passes a recent unmodified crib", () => expect(checkListing(crib, NOW).ok).toBe(true));
    it("blocks modified products and pre-2011 cribs", () => {
      expect(codes({ ...crib, sleep: { ...crib.sleep, modified: true } })).toContain("sleep_modified");
      expect(codes({ ...crib, sleep: { ...crib.sleep, yearMade: 2009 } })).toContain("crib_pre_2011");
    });
  });
});
