# Amazon affiliate links (MVP)

Bumpalong earns from Amazon Associates referral links shown next to items, at moments where buying new genuinely helps the parent.

## Where links appear

| Placement | When | Link |
|---|---|---|
| `replacement_parts` | A used breast pump we can identify | Search for that pump's new flanges, valves and tubing |
| `buy_new` | Item types that must be shared new (recovery kits, pump parts, formula) | Search for the item type |
| `lost_draw` | Someone didn't win the draw | The exact product if identified, otherwise a search |
| `unmatched_request` | A request with no match yet | Same as above |

Links never appear on feed cards, and never for an item our safety checks blocked (expired or crashed car seats, banned or recalled products).

## Identifying products

1. The giver's brand and model field (already asked for recall checks) is matched against a curated product list, then the title on whole words. A match gives an exact `/dp/ASIN` link.
2. Otherwise we search Amazon for exactly what the giver typed.
3. With no brand or model, we search the item type ("recovery kits").

The curated list starts with the pilot's most-listed products. Seed ASINs in `packages/core/src/affiliate.ts` are placeholders until verified in Associates Central.

## Amazon Associates rules this follows

- Links go straight to amazon.com with our tag. No redirects through our servers, no shorteners that hide Amazon. The app reports clicks to `POST /events/shop-click` instead.
- Text links only. Prices and product images need the Product Advertising API and come later.
- Every link shows: "As an Amazon Associate, Bumpalong earns from qualifying purchases."
- Native apps may only carry links once Amazon approves the app, and Amazon pages can't open in a WebView. Links are on for web from day one and switched on for iOS and Android with `AFFILIATE_PLATFORMS` after approval.

## Configuration

See `apps/api/.env.example`: `AMAZON_ASSOCIATE_TAG`, optional `AMAZON_TAG_<PLACEMENT>` tracking IDs, and `AFFILIATE_PLATFORMS`.
