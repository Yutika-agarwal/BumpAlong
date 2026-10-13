// The full Bumpalong catalog: every category, the life stages it serves, its
// default points tier and its item types. Mirrors PRD LST-02.

export const STAGES = ["Pregnancy", "Postpartum", "Newborn", "Baby", "Toddler"] as const;
export type Stage = (typeof STAGES)[number];

export const TIERS = ["Small", "Medium", "Large"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_POINTS: Record<Tier, number> = { Small: 50, Medium: 150, Large: 300 };

export const STAGE_NOTES: Record<Stage, string> = {
  Pregnancy: "Maternity wear, comfort and birth prep",
  Postpartum: "Recovery, nursing and pumping",
  Newborn: "0 to 3 months",
  Baby: "3 to 12 months",
  Toddler: "1 to 3 years",
};

export interface Category {
  name: string;
  icon: string;
  tier: Tier;
  stages: Stage[];
  subcategories: string[];
}

export const CATALOG: readonly Category[] = [
  { name: "Maternity clothing", icon: "maternity", tier: "Small", stages: ["Pregnancy", "Postpartum"], subcategories: ["Jeans and pants", "Tops and dresses", "Maternity coats", "Belly bands", "Maternity swimwear", "Labor gowns and robes"] },
  { name: "Pregnancy comfort and birth prep", icon: "comfort", tier: "Small", stages: ["Pregnancy"], subcategories: ["Pregnancy pillows", "Support belts", "Compression socks", "Birth and peanut balls", "Pregnancy and birth books", "Hospital bag items (new)"] },
  { name: "Postpartum recovery", icon: "heart", tier: "Small", stages: ["Postpartum"], subcategories: ["Recovery kits (sealed)", "Peri bottles (new)", "Postpartum underwear (new)", "Sitz baths (new)", "Belly binders", "Recovery and nursing robes"] },
  { name: "Nursing and pumping", icon: "pump", tier: "Small", stages: ["Postpartum", "Newborn", "Baby"], subcategories: ["Breast pumps", "Pump parts (new, sealed)", "Nursing bras and tanks", "Nursing pillows", "Nursing covers", "Milk storage bags (sealed)", "Nipple cream (unopened)"] },
  { name: "Bottles and formula", icon: "bottle", tier: "Small", stages: ["Newborn", "Baby"], subcategories: ["Bottles (with new nipples)", "Bottle warmers", "Sterilizers and dryers", "Formula (sealed, in date)", "Formula pitchers and dispensers"] },
  { name: "Solids and mealtime", icon: "spoon", tier: "Small", stages: ["Baby", "Toddler"], subcategories: ["High chairs", "Booster and hook-on seats", "Bibs", "Plates, bowls and cups", "Baby food makers"] },
  { name: "Strollers and carriers", icon: "stroller", tier: "Large", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Full-size strollers", "Travel systems", "Compact and umbrella strollers", "Jogging strollers", "Double strollers", "Soft carriers and wraps", "Stroller accessories"] },
  { name: "Car seats", icon: "carseat", tier: "Medium", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Infant car seats", "Convertible car seats", "All-in-one car seats", "Booster seats", "Car seat bases"] },
  { name: "Sleep", icon: "crib", tier: "Large", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Cribs", "Bassinets and bedside sleepers", "Play yards", "Crib mattresses", "Sleep sacks and swaddles", "Crib sheets", "Sound machines and night lights"] },
  { name: "Diapering", icon: "diaper", tier: "Small", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Diapers (unopened)", "Cloth diapers and covers", "Wipes (unopened)", "Changing pads and covers", "Diaper bags", "Diaper pails"] },
  { name: "Bath and health", icon: "bath", tier: "Small", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Baby tubs", "Hooded towels and washcloths", "Thermometers", "Nail clippers and grooming", "Nasal aspirators (new)", "Humidifiers"] },
  { name: "Baby gear and play", icon: "play", tier: "Medium", stages: ["Newborn", "Baby"], subcategories: ["Bouncers and rockers", "Swings", "Play mats and activity gyms", "Activity centers", "Baby monitors"] },
  { name: "Clothing (preemie to 5T)", icon: "shirt", tier: "Small", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Preemie and newborn", "0 to 3 months", "3 to 6 months", "6 to 12 months", "12 to 24 months", "2T to 5T", "Shoes and socks", "Outerwear and snowsuits"] },
  { name: "Toys and books", icon: "toy", tier: "Small", stages: ["Newborn", "Baby", "Toddler"], subcategories: ["Rattles and teethers", "Developmental toys", "Board books", "Puzzles and blocks", "Ride-ons and balance bikes"] },
  { name: "Nursery furniture", icon: "house", tier: "Large", stages: ["Pregnancy", "Newborn", "Baby"], subcategories: ["Gliders and rockers", "Dressers and changing tables", "Bookshelves and storage", "Nursery decor"] },
  { name: "Safety and babyproofing", icon: "shield", tier: "Small", stages: ["Baby", "Toddler"], subcategories: ["Baby gates", "Cabinet and outlet locks (unopened)", "Corner guards", "Furniture anchors"] },
  { name: "Toddler transitions", icon: "potty", tier: "Small", stages: ["Toddler"], subcategories: ["Potty chairs and seats", "Toddler beds", "Step stools", "Training underwear (new)"] },
];

/** Item types whose tier differs from their category's default. */
export const SUBCATEGORY_TIER: Readonly<Record<string, Tier>> = {
  "Pregnancy pillows": "Medium",
  "Breast pumps": "Medium",
  "Nursing pillows": "Medium",
  "Bottle warmers": "Medium",
  "Sterilizers and dryers": "Medium",
  "High chairs": "Medium",
  "Baby food makers": "Medium",
  "Soft carriers and wraps": "Medium",
  "Stroller accessories": "Small",
  "Crib mattresses": "Medium",
  "Sleep sacks and swaddles": "Small",
  "Crib sheets": "Small",
  "Sound machines and night lights": "Small",
  "Humidifiers": "Medium",
  "Ride-ons and balance bikes": "Medium",
  "Bookshelves and storage": "Medium",
  "Nursery decor": "Small",
  "Baby gates": "Medium",
  "Toddler beds": "Large",
  "Diaper pails": "Medium",
};

const BY_NAME = new Map(CATALOG.map((c) => [c.name, c]));

export function getCategory(name: string): Category | undefined {
  return BY_NAME.get(name);
}

export function isValidSubcategory(category: string, subcategory: string): boolean {
  return getCategory(category)?.subcategories.includes(subcategory) ?? false;
}

export function categoriesForStage(stage: Stage): Category[] {
  return CATALOG.filter((c) => c.stages.includes(stage));
}

/** Points tier for an item. Throws on an unknown category. */
export function tierOf(category: string, subcategory?: string): Tier {
  const cat = getCategory(category);
  if (!cat) throw new Error(`Unknown category: ${category}`);
  return (subcategory && SUBCATEGORY_TIER[subcategory]) || cat.tier;
}

/** Item types that may only be shared new, sealed or unopened, marked in their name. */
const MUST_BE_NEW = /\((new|sealed|unopened|new, sealed|sealed, in date|with new nipples)\)/;

export function mustBeNew(subcategory: string): boolean {
  return MUST_BE_NEW.test(subcategory);
}
