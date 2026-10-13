import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { MemoryStore } from "../src/store.js";

const T0 = new Date(Date.UTC(2026, 9, 13, 12));

function setup() {
  let clock = T0;
  const store = new MemoryStore();
  const app = buildApp(store, () => clock);
  const as = (user: string) => ({ "x-user-id": user });
  return { app, store, as, advance: (h: number) => (clock = new Date(clock.getTime() + h * 3600e3)) };
}

const pump = { title: "Spectra S1", category: "Nursing and pumping", subcategory: "Breast pumps", condition: "Gently used", pump: { type: "closed", personalParts: "na" } };

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
});
