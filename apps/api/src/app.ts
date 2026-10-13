import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import {
  CATALOG, STAGES, STAGE_NOTES, TIER_POINTS, applyReceive, checkListing, draw, getCategory, giverEarns, quoteReceive,
  tierOf, shopLink, PLACEMENTS, type AffiliateConfig, type ListingDraft, type Placement, type Platform, type Stage,
} from "@bumpalong/core";
import { MemoryStore, type Listing } from "./store.js";

const DEFAULT_CLAIM_WINDOW_HOURS = 12;

/** Amazon Associates settings from the environment. Native platforms stay off until Amazon approves the app. */
export function affiliateFromEnv(env = process.env): AffiliateConfig {
  const platforms = (env.AFFILIATE_PLATFORMS ?? "web").split(",").map((p) => p.trim()).filter(Boolean) as Platform[];
  const placementTags: Partial<Record<Placement, string>> = {};
  for (const p of PLACEMENTS) {
    const t = env[`AMAZON_TAG_${p.toUpperCase()}`];
    if (t) placementTags[p] = t;
  }
  return { tag: env.AMAZON_ASSOCIATE_TAG ?? "", placementTags, platforms };
}

const PLATFORMS: readonly Platform[] = ["web", "ios", "android"];
const asPlatform = (p?: string): Platform => (PLATFORMS.includes(p as Platform) ? (p as Platform) : "web");

export function buildApp(store = new MemoryStore(), now: () => Date = () => new Date(), affiliate: AffiliateConfig = affiliateFromEnv()) {
  const app = Fastify({ logger: false });

  // TODO(auth): replace with verified sessions (Apple, Google, email + phone). The header stands in for a signed-in user.
  function userId(req: FastifyRequest, reply: FastifyReply): string | undefined {
    const id = req.headers["x-user-id"];
    if (typeof id !== "string" || !id) {
      void reply.code(401).send({ error: "sign_in_required" });
      return undefined;
    }
    store.ensureUser(id);
    return id;
  }

  const matchInput = (l: Listing) => ({ title: l.title, model: l.model, category: l.category, subcategory: l.subcategory });
  /** Links shown on a listing page: new parts for used pumps, or the new version of must-be-new items. */
  const listingShop = (l: Listing, platform: Platform) =>
    (["replacement_parts", "buy_new"] as const)
      .map((placement) => shopLink(affiliate, { placement, platform, listing: matchInput(l) }))
      .filter((x) => x !== undefined);
  const view = (l: Listing, platform: Platform = "web") => ({ ...l, points: TIER_POINTS[l.tier], shop: listingShop(l, platform) });

  app.get("/health", async () => ({ ok: true }));

  app.get("/catalog", async () => ({
    stages: STAGES.map((s) => ({ name: s, note: STAGE_NOTES[s] })),
    categories: CATALOG,
    tierPoints: TIER_POINTS,
  }));

  app.post<{ Body: ListingDraft }>("/listings/check", async (req) => checkListing(req.body, now()));

  app.post<{ Body: ListingDraft & { claimWindowHours?: number } }>("/listings", async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return;
    const result = checkListing(req.body, now());
    if (!result.ok) return reply.code(422).send({ error: "safety_check_failed", ...result });
    const cat = getCategory(req.body.category)!;
    const hours = Math.min(48, Math.max(1, req.body.claimWindowHours ?? DEFAULT_CLAIM_WINDOW_HOURS));
    const created = now();
    const listing: Listing = {
      id: randomUUID(),
      giverId: uid,
      title: req.body.title.trim(),
      description: (req.body.description ?? "").trim(),
      category: cat.name,
      subcategory: req.body.subcategory,
      condition: req.body.condition,
      model: (req.body.model ?? req.body.carSeat?.model ?? req.body.sleep?.model ?? "").trim(),
      tier: tierOf(cat.name, req.body.subcategory),
      stages: cat.stages,
      badges: result.badges,
      status: "open",
      createdAt: created,
      closesAt: new Date(created.getTime() + hours * 3600e3),
    };
    store.listings.set(listing.id, listing);
    return reply.code(201).send({ listing: view(listing), warnings: result.warnings, needsRecallCheck: result.needsRecallCheck });
  });

  app.get<{ Querystring: { stage?: string; category?: string; q?: string; platform?: string } }>("/listings", async (req) => {
    const { stage, category, q } = req.query;
    const platform = asPlatform(req.query.platform);
    const needle = q?.toLowerCase().trim();
    const items = [...store.listings.values()].filter(
      (l) =>
        l.status === "open" &&
        (!stage || l.stages.includes(stage as Stage)) &&
        (!category || l.category === category) &&
        (!needle || `${l.title} ${l.category} ${l.subcategory} ${l.description}`.toLowerCase().includes(needle)),
    );
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { listings: items.map((l) => view(l, platform)) };
  });

  app.post<{ Params: { id: string }; Body: { chips?: string[] } }>("/listings/:id/interest", async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return;
    const l = store.listings.get(req.params.id);
    if (!l) return reply.code(404).send({ error: "not_found" });
    if (l.giverId === uid) return reply.code(409).send({ error: "own_listing" });
    if (l.status !== "open" || now() >= l.closesAt) return reply.code(409).send({ error: "claim_window_closed" });
    const quote = quoteReceive(store.monthState(uid), l.tier);
    if (!quote.allowed) return reply.code(409).send({ error: quote.reason, message: quote.message });
    if (!store.interests.some((i) => i.listingId === l.id && i.userId === uid)) {
      store.interests.push({ listingId: l.id, userId: uid, chips: (req.body?.chips ?? []).slice(0, 5), createdAt: now() });
    }
    return { interested: store.interests.filter((i) => i.listingId === l.id).length, quote };
  });

  // Run by the scheduler when the claim window closes. Safe to retry.
  app.post<{ Params: { id: string } }>("/listings/:id/draw", async (req, reply) => {
    const l = store.listings.get(req.params.id);
    if (!l) return reply.code(404).send({ error: "not_found" });
    const existing = store.holdForListing(l.id);
    if (existing) return { hold: existing, repeated: true };
    if (now() < l.closesAt) return reply.code(409).send({ error: "claim_window_open" });
    const entrants = store.interests
      .filter((i) => i.listingId === l.id)
      .map((i) => ({ userId: i.userId, reliability: store.ensureUser(i.userId).reliability }));
    const result = draw(`${l.id}:${l.closesAt.toISOString()}`, l.giverId, entrants);
    if (!result.winner) return { hold: null, result };
    const hold = { id: randomUUID(), listingId: l.id, receiverId: result.winner, backups: result.backups, status: "offered" as const, createdAt: now() };
    store.holds.set(hold.id, hold);
    l.status = "drawn";
    return { hold, result };
  });

  // Both sides confirm in the real flow; for now the giver's confirmation completes the handoff.
  app.post<{ Params: { id: string } }>("/holds/:id/confirm", async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return;
    const h = store.holds.get(req.params.id);
    if (!h) return reply.code(404).send({ error: "not_found" });
    const l = store.listings.get(h.listingId)!;
    if (uid !== l.giverId) return reply.code(403).send({ error: "giver_only" });
    if (h.status === "completed") return { hold: h, repeated: true };
    const receiver = store.ensureUser(h.receiverId);
    let applied;
    try {
      applied = applyReceive(store.monthState(receiver.id), l.tier);
    } catch (e) {
      return reply.code(409).send({ error: (e as Error).message });
    }
    receiver.receivedThisMonth = applied.state.receivedThisMonth;
    receiver.allowanceUsed = { ...applied.state.allowanceUsed };
    store.addLedger(receiver.id, applied.delta, "received", `recv:${h.id}`);
    store.addLedger(l.giverId, giverEarns(l.tier), "gave", `give:${h.id}`);
    h.status = "completed";
    l.status = "handed_off";
    return { hold: h, method: applied.method };
  });

  // A shopping suggestion for one placement, e.g. after someone loses the draw.
  app.get<{ Params: { id: string }; Querystring: { placement?: string; platform?: string } }>("/listings/:id/shop", async (req, reply) => {
    const l = store.listings.get(req.params.id);
    if (!l) return reply.code(404).send({ error: "not_found" });
    const placement = req.query.placement as Placement;
    if (!PLACEMENTS.includes(placement)) return reply.code(400).send({ error: "unknown_placement" });
    return { link: shopLink(affiliate, { placement, platform: asPlatform(req.query.platform), listing: matchInput(l) }) ?? null };
  });

  // Links go straight to Amazon (redirects are against Associates policy), so the app reports clicks separately.
  app.post<{ Body: { listingId: string; placement: string; platform?: string } }>("/events/shop-click", async (req, reply) => {
    const uid = req.headers["x-user-id"];
    if (!req.body?.listingId || !PLACEMENTS.includes(req.body.placement as Placement)) return reply.code(400).send({ error: "bad_event" });
    store.shopClicks.push({ userId: typeof uid === "string" ? uid : undefined, listingId: req.body.listingId, placement: req.body.placement, platform: asPlatform(req.body.platform), at: now() });
    return reply.code(204).send();
  });

  app.get("/me/wallet", async (req, reply) => {
    const uid = userId(req, reply);
    if (!uid) return;
    return {
      ...store.monthState(uid),
      reliability: store.ensureUser(uid).reliability,
      ledger: store.ledger.filter((r) => r.userId === uid),
    };
  });

  return app;
}
