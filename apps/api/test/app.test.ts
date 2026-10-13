import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { MemoryStore } from "../src/store.js";

const T0 = new Date(Date.UTC(2026, 9, 13, 12));

function setup() {
  let clock = T0;
  const store = new MemoryStore();
  const app = buildApp(store, () => clock, { tag: "bumpalong-20", placementTags: { lost_draw: "bumpalong-lost-20" }, platforms: ["web"] });
  const as = (user: string) => ({ "x-user-id": user });
  return { app, store, as, advance: (h: number) => (clock = new Date(clock.getTime() + h * 3600e3)) };
}

const pump = { title: "Spectra S1", model: "Spectra S1 Plus", category: "Nursing and pumping", subcategory: "Breast pumps", condition: "Gently used", pump: { type: "closed", personalParts: "na" } };

describe("api", () => {
  it("serves the catalog", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "GET", url: "/catalog" });
    expect(res.json().categories).toHaveLength(17);
  });

  it("requires sign-in to list", async () => {
    const { app } = setup();
    expect((await app.inject({ method: "POST", url: "/listings", payload: pump })).statusCode).toBe(401);
  });

  it("rejects unsafe listings with reasons", async () => {
    const { app, as } = setup();
    const res = await app.inject({ method: "POST", url: "/listings", headers: as("g"), payload: { ...pump, pump: { type: "open", personalParts: "used" } } });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors.map((e: { code: string }) => e.code)).toEqual(["pump_open_used", "pump_parts_used"]);
  });

  it("runs give, interest, draw and handoff end to end", async () => {
    const { app, as, advance } = setup();
    const created = await app.inject({ method: "POST", url: "/listings", headers: as("giver"), payload: pump });
    expect(created.statusCode).toBe(201);
    const listing = created.json().listing;
    expect(listing).toMatchObject({ tier: "Medium", points: 150, stages: ["Postpartum", "Newborn", "Baby"] });

    const feed = await app.inject({ method: "GET", url: "/listings?stage=Postpartum&q=spectra" });
    expect(feed.json().listings).toHaveLength(1);
    expect((await app.inject({ method: "GET", url: "/listings?stage=Toddler" })).json().listings).toHaveLength(0);

    expect((await app.inject({ method: "POST", url: `/listings/${listing.id}/interest`, headers: as("giver") })).statusCode).toBe(409);
    for (const u of ["a", "b", "c"]) {
      const r = await app.inject({ method: "POST", url: `/listings/${listing.id}/interest`, headers: as(u), payload: { chips: ["First baby"] } });
      expect(r.statusCode).toBe(200);
    }

    expect((await app.inject({ method: "POST", url: `/listings/${listing.id}/draw` })).statusCode).toBe(409);
    advance(13);
    const drawn = await app.inject({ method: "POST", url: `/listings/${listing.id}/draw` });
    const hold = drawn.json().hold;
    expect(["a", "b", "c"]).toContain(hold.receiverId);
    expect(hold.backups).toHaveLength(2);
    const again = await app.inject({ method: "POST", url: `/listings/${listing.id}/draw` });
    expect(again.json()).toMatchObject({ repeated: true, hold: { id: hold.id } });

    expect((await app.inject({ method: "POST", url: `/holds/${hold.id}/confirm`, headers: as(hold.receiverId) })).statusCode).toBe(403);
    expect((await app.inject({ method: "POST", url: `/holds/${hold.id}/confirm`, headers: as("giver") })).statusCode).toBe(200);
    expect((await app.inject({ method: "POST", url: `/holds/${hold.id}/confirm`, headers: as("giver") })).json().repeated).toBe(true);

    const giverWallet = (await app.inject({ method: "GET", url: "/me/wallet", headers: as("giver") })).json();
    const recvWallet = (await app.inject({ method: "GET", url: "/me/wallet", headers: as(hold.receiverId) })).json();
    expect(giverWallet.balance).toBe(450);
    expect(recvWallet.balance).toBe(150);
    expect(recvWallet.receivedThisMonth).toBe(1);
  });

  it("closes interest after the claim window", async () => {
    const { app, as, advance } = setup();
    const listing = (await app.inject({ method: "POST", url: "/listings", headers: as("g"), payload: { ...pump, claimWindowHours: 2 } })).json().listing;
    advance(3);
    const r = await app.inject({ method: "POST", url: `/listings/${listing.id}/interest`, headers: as("a") });
    expect(r.json().error).toBe("claim_window_closed");
  });

  it("adds Amazon links on web only, and logs clicks", async () => {
    const { app, as, store } = setup();
    const listing = (await app.inject({ method: "POST", url: "/listings", headers: as("g"), payload: pump })).json().listing;
    expect(listing.shop).toHaveLength(1);
    expect(listing.shop[0]).toMatchObject({ placement: "replacement_parts", label: "New parts for the Spectra S1 on Amazon" });
    expect((await app.inject({ method: "GET", url: "/listings?platform=ios" })).json().listings[0].shop).toEqual([]);

    const lost = (await app.inject({ method: "GET", url: `/listings/${listing.id}/shop?placement=lost_draw` })).json();
    expect(lost.link.url).toBe("https://www.amazon.com/dp/B00T3ZSS1Q?tag=bumpalong-lost-20");
    expect((await app.inject({ method: "GET", url: `/listings/${listing.id}/shop?placement=popup` })).statusCode).toBe(400);

    const click = await app.inject({ method: "POST", url: "/events/shop-click", headers: as("a"), payload: { listingId: listing.id, placement: "lost_draw" } });
    expect(click.statusCode).toBe(204);
    expect(store.shopClicks).toHaveLength(1);
  });
});
