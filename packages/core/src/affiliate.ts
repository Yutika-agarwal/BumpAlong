// Amazon Associates links (revenue). Rules that shape this module, from the
// Associates Program Policies:
// - Links go straight to amazon.com with our tag. No redirects through our
//   servers and no shorteners that hide the destination.
// - No Amazon prices or images unless they come from PA-API; MVP shows text links only.
// - Native apps may only carry links once Amazon approves the app, so links are
//   switched on per platform. Web can carry them from day one.
// - Every screen with a link shows the disclosure below.
import { getCategory, mustBeNew } from "./catalog.js";

export const AFFILIATE_DISCLOSURE = "As an Amazon Associate, Bumpalong earns from qualifying purchases.";

/** Where a link can appear. Each gets its own tracking ID so we can see what earns. */
export const PLACEMENTS = ["replacement_parts", "buy_new", "lost_draw", "unmatched_request"] as const;
export type Placement = (typeof PLACEMENTS)[number];

export type Platform = "web" | "ios" | "android";

export interface AffiliateConfig {
  /** Store ID from Associates Central, e.g. "bumpalong-20". */
  tag: string;
  /** Optional tracking ID per placement; falls back to `tag`. */
  placementTags?: Partial<Record<Placement, string>>;
  /** Platforms where links are allowed. Add ios/android only after Amazon approves the app. */
  platforms: Platform[];
}

/** A known product we can link to exactly. Seeded by hand for the pilot's most-listed items. */
export interface KnownProduct {
  asin: string;
  brand: string;
  model: string;
  aliases: string[];
  /** Search for compatible new parts, when the used item needs them. */
  partsQuery?: string;
}

export const KNOWN_PRODUCTS: readonly KnownProduct[] = [
  { asin: "B00T3ZSS1Q", brand: "Spectra", model: "S1", aliases: ["spectra s1", "s1 plus", "spectra s1 plus"], partsQuery: "Spectra flanges duckbill valves backflow protector" },
  { asin: "B00T3ZSS1G", brand: "Spectra", model: "S2", aliases: ["spectra s2", "s2 plus", "spectra s2 plus"], partsQuery: "Spectra flanges duckbill valves backflow protector" },
  { asin: "B07TKKCJ5J", brand: "Medela", model: "Pump In Style", aliases: ["pump in style", "medela pump in style", "medela pis"], partsQuery: "Medela PersonalFit flex breast shields valves membranes" },
  { asin: "B01H5RTTA4", brand: "Graco", model: "SnugRide 35", aliases: ["snugride", "snugride 35", "graco snugride"] },
  { asin: "B07FFW4F7S", brand: "Halo", model: "BassiNest", aliases: ["bassinest", "halo bassinest", "halo bassinet"] },
];
// NOTE: ASINs above are placeholders to be verified in Associates Central before launch.

export interface MatchInput {
  title: string;
  model?: string;
  category: string;
  subcategory: string;
}

export type ProductMatch =
  | { kind: "exact"; product: KnownProduct; confidence: number }
  | { kind: "search"; query: string; confidence: number };

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Identify the product. Exact match only on a known alias in the brand/model
 * field or title; otherwise a search built from what the giver typed, never
 * guessed. Returns undefined when we know too little to link responsibly.
 */
export function matchProduct(input: MatchInput): ProductMatch | undefined {
  const model = norm(input.model ?? "");
  const title = norm(input.title);
  for (const p of KNOWN_PRODUCTS) {
    for (const alias of p.aliases) {
      const a = norm(alias);
      if (model && (model === a || model.includes(a))) return { kind: "exact", product: p, confidence: 0.95 };
      if (` ${title} `.includes(` ${a} `)) return { kind: "exact", product: p, confidence: 0.8 };
    }
  }
  if (model.length >= 3) return { kind: "search", query: input.model!.trim(), confidence: 0.6 };
  if (!getCategory(input.category)) return undefined;
  const sub = input.subcategory.replace(/\s*\(.*\)/, "");
  return { kind: "search", query: sub, confidence: 0.3 };
}

function tagFor(cfg: AffiliateConfig, placement: Placement): string {
  return cfg.placementTags?.[placement] ?? cfg.tag;
}

export function productUrl(asin: string, tag: string): string {
  if (!/^[A-Z0-9]{10}$/.test(asin)) throw new Error(`Bad ASIN: ${asin}`);
  return `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(tag)}`;
}

export function searchUrl(query: string, tag: string): string {
  const q = new URLSearchParams({ k: query, tag });
  return `https://www.amazon.com/s?${q.toString()}`;
}

export interface ShopLink {
  placement: Placement;
  label: string;
  url: string;
  disclosure: string;
}

export interface ShopContext {
  placement: Placement;
  platform: Platform;
  listing: MatchInput & { blocked?: boolean };
}

/** The one link to show for this context, or undefined when we shouldn't show one. */
export function shopLink(cfg: AffiliateConfig, ctx: ShopContext): ShopLink | undefined {
  if (!cfg.tag || !cfg.platforms.includes(ctx.platform)) return undefined;
  // Never point people at an item our safety checks blocked (recalled, expired, banned).
  if (ctx.listing.blocked) return undefined;
  const match = matchProduct(ctx.listing);
  if (!match) return undefined;
  const tag = tagFor(cfg, ctx.placement);
  const base = { placement: ctx.placement, disclosure: AFFILIATE_DISCLOSURE };

  switch (ctx.placement) {
    case "replacement_parts": {
      if (match.kind !== "exact" || !match.product.partsQuery) return undefined;
      return { ...base, label: `New parts for the ${match.product.brand} ${match.product.model} on Amazon`, url: searchUrl(match.product.partsQuery, tag) };
    }
    case "buy_new": {
      if (!mustBeNew(ctx.listing.subcategory)) return undefined;
      return { ...base, label: "Buy this new on Amazon", url: searchUrl(match.kind === "exact" ? `${match.product.brand} ${match.product.model}` : match.query, tag) };
    }
    case "lost_draw":
    case "unmatched_request": {
      if (match.confidence < 0.5) return { ...base, label: `Shop ${match.kind === "search" ? match.query.toLowerCase() : "this"} on Amazon`, url: searchUrl(match.kind === "search" ? match.query : `${match.product.brand} ${match.product.model}`, tag) };
      if (match.kind === "exact") return { ...base, label: `Get a ${match.product.brand} ${match.product.model} on Amazon`, url: productUrl(match.product.asin, tag) };
      return { ...base, label: `Find "${match.query}" on Amazon`, url: searchUrl(match.query, tag) };
    }
  }
}
