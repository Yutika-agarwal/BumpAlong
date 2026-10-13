// Listing safety checks run before a Give listing is published (PRD SAF-*).
import { getCategory, isValidSubcategory, mustBeNew } from "./catalog.js";

export const CONDITIONS = ["New with tags", "Like new", "Gently used", "Well loved"] as const;
export type Condition = (typeof CONDITIONS)[number];

export interface ListingDraft {
  title: string;
  description?: string;
  category: string;
  subcategory: string;
  condition: Condition;
  carSeat?: { expires?: string; crash?: "no" | "yes" | "unsure"; model?: string };
  pump?: { type: "none" | "closed" | "open"; personalParts: "na" | "sealed" | "used" };
  formula?: "na" | "sealed" | "open";
  sleep?: { modified?: boolean; model?: string; yearMade?: number };
}

export interface Issue {
  code: string;
  message: string;
}

export interface SafetyResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  badges: string[];
  /** True when the listing needs a CPSC recall lookup before going live. */
  needsRecallCheck: boolean;
}

const MILK_BANK = "Breast milk sharing isn't allowed. Accredited milk banks can help: see the safety page.";
const WEIGHTED = "Weighted sleep sacks and swaddles go against safe sleep guidance, so they can't be listed.";

/** Phrases that block a listing outright, matched against title and description. */
export const BANNED_PHRASES: ReadonlyArray<readonly [string, string]> = [
  ["breast milk", MILK_BANK],
  ["breastmilk", MILK_BANK],
  ["crib bumper", "Crib bumpers are banned for sale in the US because of suffocation risk."],
  ["inclined sleeper", "Inclined sleepers are banned under the Safe Sleep for Babies Act."],
  ["drop side", "Drop-side cribs no longer meet the federal crib standard."],
  ["sleep positioner", "Sleep positioners are a suffocation risk and can't be listed."],
  ["baby walker", "Baby walkers with wheels can't be listed because of fall risk."],
  ["pacifier", "Used pacifiers can't be shared for hygiene reasons."],
  ["medication", "Medications and supplements can't be listed."],
  ["opened formula", "Only unopened, sealed formula can be listed."],
  ["weighted sleep", WEIGHTED],
  ["weighted swaddle", WEIGHTED],
  ["nipple shield", "Used nipple shields can't be shared for hygiene reasons."],
];

/** Phrases that contain a banned word but are fine to share. */
const ALLOWED_PHRASES = ["pacifier clip", "pacifier holder"];

const RECALL_CATEGORIES = new Set(["Car seats", "Strollers and carriers", "Sleep", "Nursery furniture", "Baby gear and play"]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

export function findBannedPhrase(text: string): string | undefined {
  let t = normalize(text);
  for (const ok of ALLOWED_PHRASES) t = t.split(ok).join(" ");
  return BANNED_PHRASES.find(([phrase]) => t.includes(phrase))?.[1];
}

/** "2030-03" -> first day of that month, or undefined if malformed. */
function parseMonth(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return undefined;
  return new Date(Date.UTC(Number(m[1]), month - 1, 1));
}

export function checkListing(draft: ListingDraft, now: Date = new Date()): SafetyResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const badges: string[] = [];
  const err = (code: string, message: string) => errors.push({ code, message });
  const warn = (code: string, message: string) => warnings.push({ code, message });

  const title = draft.title.trim();
  if (!title) err("title_missing", "Add a short title so neighbors know what it is.");
  if (title.length > 80) err("title_too_long", "Keep the title under 80 characters.");

  const category = getCategory(draft.category);
  if (!category) err("category_unknown", "Choose a category from the list.");
  else if (!isValidSubcategory(draft.category, draft.subcategory)) err("subcategory_unknown", "Choose an item type from the list.");

  const banned = findBannedPhrase(`${draft.title} ${draft.description ?? ""}`);
  if (banned) err("banned_item", banned);

  if (mustBeNew(draft.subcategory) && draft.condition !== "New with tags") {
    const name = draft.subcategory.replace(/\s*\(.*\)/, "");
    err("must_be_new", `${name} must be new and sealed to share. Set the condition to "New with tags", or leave it out.`);
  }

  if (draft.category === "Car seats") {
    const cs = draft.carSeat ?? {};
    const expires = cs.expires ? parseMonth(cs.expires) : undefined;
    if (!cs.expires) err("car_seat_expiry_missing", "Add the expiry date from the car seat label.");
    else if (!expires) err("car_seat_expiry_invalid", "Enter the expiry date as a month and year.");
    else {
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      if (expires < startOfMonth) err("car_seat_expired", "This car seat has expired, so it can't be listed.");
      else {
        const days = (expires.getTime() - now.getTime()) / 864e5;
        if (days < 183) warn("car_seat_expiring", "This seat expires within 6 months. We'll show that on the listing.");
        badges.push(`Expires ${expires.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}`);
      }
    }
    if (cs.crash === "yes") err("car_seat_crashed", "Car seats that have been in a crash can't be listed.");
    else if (cs.crash === "unsure") err("car_seat_crash_unknown", "If you're not sure about crash history, the seat can't be listed.");
    else if (!cs.crash) err("car_seat_crash_missing", "Tell us whether the seat has been in a crash.");
    else badges.push("Never in a crash (owner attests)");
    if (!cs.model?.trim()) warn("model_missing", "Add the brand and model so we can run the recall check.");
  }

  if (draft.category === "Nursing and pumping" && draft.pump) {
    const { type, personalParts } = draft.pump;
    if (type === "open" && draft.condition !== "New with tags") err("pump_open_used", "Single-user (open-system) pumps can only be given new and sealed.");
    if (personalParts === "used") err("pump_parts_used", "Used flanges, valves and tubing can't be shared. Remove them or include new sealed parts.");
    if (type === "closed") badges.push("Closed-system pump: use new personal parts");
  }

  if (draft.category === "Bottles and formula" && draft.formula === "open") {
    err("formula_open", "Only unopened, sealed formula can be listed.");
  }

  if (draft.category === "Sleep" || draft.category === "Nursery furniture") {
    if (draft.sleep?.modified) err("sleep_modified", "Homemade or modified sleep products can't be listed.");
    if (!draft.sleep?.model?.trim()) warn("model_missing", "Add the brand and model so we can run the recall check.");
    const year = draft.sleep?.yearMade;
    if (draft.subcategory === "Cribs" && year !== undefined && year < 2011) {
      err("crib_pre_2011", "Cribs made before 2011 don't meet the current federal crib standard.");
    }
  }

  const needsRecallCheck = RECALL_CATEGORIES.has(draft.category);
  return { ok: errors.length === 0, errors, warnings, badges, needsRecallCheck };
}
