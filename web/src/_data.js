const ICONS={
  feed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  give:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  requests:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>',
  pickups:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h16l-1.5 10h-13z"/><path d="M8 9a4 4 0 0 1 8 0"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12.5h2"/><path d="M3 9h18"/></svg>'
};
// Full catalog: every category, the life stages it serves, its default points tier and its subcategories.
const ART={
  maternity:'<path d="M9 3c0 3-2 4-2 8s3 9 7 9 4-4 4-6-2-3-4-3c0-3 1-5-1-8"/>',
  comfort:'<path d="M4 15c0-4 3-7 8-7s8 3 8 7-3 4-8 4-8 0-8-4z"/><path d="M8 11c1-1 2-1.5 4-1.5"/>',
  heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  bottle:'<path d="M9 3h6M10 3v3l-2 3v11h8V9l-2-3V3"/><path d="M8 13h8"/>',
  pump:'<path d="M6 8h7v11H6zM13 11h3a3 3 0 0 0 3-3V5"/><circle cx="9.5" cy="13.5" r="1.5"/>',
  spoon:'<path d="M8 3c-2 0-3 2-3 4s1.5 3 3 3 3-1 3-3-1-4-3-4zM8 10v11M16 3v18M14 3v5a2 2 0 0 0 4 0V3"/>',
  stroller:'<path d="M6 16a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 16a2 2 0 1 0 4 0 2 2 0 1 0-4 0M5 6h3l2 8h8l2-6H9"/>',
  carseat:'<path d="M7 4h6l1 9h5v6H7z"/><path d="M9 9h4"/>',
  crib:'<path d="M3 18h18M5 18V9h14v9M5 13h14M9 9v9M13 9v9M17 9v9"/>',
  diaper:'<path d="M4 7h16v3a8 8 0 0 1-16 0z"/><path d="M8 7v2M16 7v2"/>',
  bath:'<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0"/>',
  play:'<path d="M3 20h18M6 20 12 8l6 12M9 14h6"/><circle cx="12" cy="5" r="1.5"/>',
  shirt:'<path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-4z"/>',
  toy:'<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14"/>',
  house:'<path d="M5 20V8l7-4 7 4v12M9 20v-6h6v6"/>',
  shield:'<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  potty:'<path d="M6 10h12l-1.5 4h-9zM8 14v6h8v-6M7 10V6h4v4"/>'
};
const STAGES=["Pregnancy","Postpartum","Newborn","Baby","Toddler"];
const STAGE_NOTE={Pregnancy:"Maternity wear, comfort and birth prep",Postpartum:"Recovery, nursing and pumping",Newborn:"0 to 3 months",Baby:"3 to 12 months",Toddler:"1 to 3 years"};
const CATALOG=[
  {cat:"Maternity clothing",art:"maternity",hue:"#EED9CF",tier:"Small",stages:["Pregnancy","Postpartum"],subs:["Jeans and pants","Tops and dresses","Maternity coats","Belly bands","Maternity swimwear","Labor gowns and robes"]},
  {cat:"Pregnancy comfort and birth prep",art:"comfort",hue:"#F1E1D2",tier:"Small",stages:["Pregnancy"],subs:["Pregnancy pillows","Support belts","Compression socks","Birth and peanut balls","Pregnancy and birth books","Hospital bag items (new)"]},
  {cat:"Postpartum recovery",art:"heart",hue:"#F2D6D8",tier:"Small",stages:["Postpartum"],subs:["Recovery kits (sealed)","Peri bottles (new)","Postpartum underwear (new)","Sitz baths (new)","Belly binders","Recovery and nursing robes"]},
  {cat:"Nursing and pumping",art:"pump",hue:"#DCE4F0",tier:"Small",stages:["Postpartum","Newborn","Baby"],subs:["Breast pumps","Pump parts (new, sealed)","Nursing bras and tanks","Nursing pillows","Nursing covers","Milk storage bags (sealed)","Nipple cream (unopened)"]},
  {cat:"Bottles and formula",art:"bottle",hue:"#D9E3EE",tier:"Small",stages:["Newborn","Baby"],subs:["Bottles (with new nipples)","Bottle warmers","Sterilizers and dryers","Formula (sealed, in date)","Formula pitchers and dispensers"]},
  {cat:"Solids and mealtime",art:"spoon",hue:"#E9E4CC",tier:"Small",stages:["Baby","Toddler"],subs:["High chairs","Booster and hook-on seats","Bibs","Plates, bowls and cups","Baby food makers"]},
  {cat:"Strollers and carriers",art:"stroller",hue:"#CFE3DC",tier:"Large",stages:["Newborn","Baby","Toddler"],subs:["Full-size strollers","Travel systems","Compact and umbrella strollers","Jogging strollers","Double strollers","Soft carriers and wraps","Stroller accessories"]},
  {cat:"Car seats",art:"carseat",hue:"#E3DCCF",tier:"Medium",stages:["Newborn","Baby","Toddler"],subs:["Infant car seats","Convertible car seats","All-in-one car seats","Booster seats","Car seat bases"]},
  {cat:"Sleep",art:"crib",hue:"#E2DDF0",tier:"Large",stages:["Newborn","Baby","Toddler"],subs:["Cribs","Bassinets and bedside sleepers","Play yards","Crib mattresses","Sleep sacks and swaddles","Crib sheets","Sound machines and night lights"]},
  {cat:"Diapering",art:"diaper",hue:"#E0EBDD",tier:"Small",stages:["Newborn","Baby","Toddler"],subs:["Diapers (unopened)","Cloth diapers and covers","Wipes (unopened)","Changing pads and covers","Diaper bags","Diaper pails"]},
  {cat:"Bath and health",art:"bath",hue:"#D3E8EC",tier:"Small",stages:["Newborn","Baby","Toddler"],subs:["Baby tubs","Hooded towels and washcloths","Thermometers","Nail clippers and grooming","Nasal aspirators (new)","Humidifiers"]},
  {cat:"Baby gear and play",art:"play",hue:"#DCE9E1",tier:"Medium",stages:["Newborn","Baby"],subs:["Bouncers and rockers","Swings","Play mats and activity gyms","Activity centers","Baby monitors"]},
  {cat:"Clothing (preemie to 5T)",art:"shirt",hue:"#F0D9DE",tier:"Small",stages:["Newborn","Baby","Toddler"],subs:["Preemie and newborn","0 to 3 months","3 to 6 months","6 to 12 months","12 to 24 months","2T to 5T","Shoes and socks","Outerwear and snowsuits"]},
  {cat:"Toys and books",art:"toy",hue:"#F3E6C8",tier:"Small",stages:["Newborn","Baby","Toddler"],subs:["Rattles and teethers","Developmental toys","Board books","Puzzles and blocks","Ride-ons and balance bikes"]},
  {cat:"Nursery furniture",art:"house",hue:"#D9E6D3",tier:"Large",stages:["Pregnancy","Newborn","Baby"],subs:["Gliders and rockers","Dressers and changing tables","Bookshelves and storage","Nursery decor"]},
  {cat:"Safety and babyproofing",art:"shield",hue:"#E6E1D6",tier:"Small",stages:["Baby","Toddler"],subs:["Baby gates","Cabinet and outlet locks (unopened)","Corner guards","Furniture anchors"]},
  {cat:"Toddler transitions",art:"potty",hue:"#EAE0EE",tier:"Small",stages:["Toddler"],subs:["Potty chairs and seats","Toddler beds","Step stools","Training underwear (new)"]}
];
const SUB_TIER={"Pregnancy pillows":"Medium","Breast pumps":"Medium","Nursing pillows":"Medium","Bottle warmers":"Medium","Sterilizers and dryers":"Medium","High chairs":"Medium","Baby food makers":"Medium","Soft carriers and wraps":"Medium","Stroller accessories":"Small","Crib mattresses":"Medium","Sleep sacks and swaddles":"Small","Crib sheets":"Small","Sound machines and night lights":"Small","Baby tubs":"Small","Humidifiers":"Medium","Ride-ons and balance bikes":"Medium","Bookshelves and storage":"Medium","Nursery decor":"Small","Baby gates":"Medium","Toddler beds":"Large","Diaper pails":"Medium"};
const CAT={}; CATALOG.forEach(c=>CAT[c.cat]=c);
const CATEGORIES=CATALOG.map(c=>c.cat);
const TIER_PTS={Small:50,Medium:150,Large:300};
// Amazon Associates links. Text only, straight to amazon.com with the tag (no prices or images without PA-API).
const AMZ_TAG="zreviews0d-20", AMZ_DISCLOSURE="As an Amazon Associate, Bumpalong earns from qualifying purchases.";
const AMZ_PRODUCTS=[{asin:"B00T3ZSS1Q",name:"Spectra S1",aliases:["spectra s1"],parts:"Spectra flanges duckbill valves backflow protector"},{asin:"B01H5RTTA4",name:"Graco SnugRide 35",aliases:["snugride"]},{asin:"B07FFW4F7S",name:"Halo BassiNest",aliases:["bassinest","halo bassinet"]}];
function amzSearch(q,tag){return "https://www.amazon.com/s?"+new URLSearchParams({k:q,tag:tag||AMZ_TAG})}
function shopFor(l,placement){
  const t=l.title.toLowerCase(),p=AMZ_PRODUCTS.find(x=>x.aliases.some(a=>t.includes(a))),sub=(l.sub||l.cat).replace(/\s*\(.*\)/,"");
  if(placement==="parts") return p&&p.parts?{label:`New parts for the ${p.name} on Amazon`,url:amzSearch(p.parts)}:null;
  if(placement==="new") return MUST_BE_NEW.test(l.sub||"")?{label:`Buy ${sub.toLowerCase()} new on Amazon`,url:amzSearch(sub)}:null;
  if(placement==="lost") return p?{label:`Get a ${p.name} on Amazon`,url:`https://www.amazon.com/dp/${p.asin}?tag=${AMZ_TAG}`}:{label:`Shop ${sub.toLowerCase()} on Amazon`,url:amzSearch(sub)};
  return null;
}
function shopBox(link,lead){return link?`<div class="shop">${lead?`<span class="small">${lead}</span>`:""}<a href="${link.url}" target="_blank" rel="noopener sponsored">${esc(link.label)} ↗</a><small>${AMZ_DISCLOSURE}</small></div>`:""}
const MUST_BE_NEW=/\((new|sealed|unopened|new, sealed|sealed, in date|with new nipples)\)/;
const BANNED=[["breast milk","Breast milk sharing isn't allowed. Accredited milk banks can help: see the safety page."],["breastmilk","Breast milk sharing isn't allowed. Accredited milk banks can help: see the safety page."],["crib bumper","Crib bumpers are banned for sale in the US because of suffocation risk."],["inclined sleeper","Inclined sleepers are banned under the Safe Sleep for Babies Act."],["drop-side","Drop-side cribs no longer meet the federal crib standard."],["drop side","Drop-side cribs no longer meet the federal crib standard."],["sleep positioner","Sleep positioners are a suffocation risk and can't be listed."],["baby walker","Baby walkers with wheels can't be listed because of fall risk."],["pacifier","Used pacifiers can't be shared for hygiene reasons."],["medication","Medications and supplements can't be listed."],["opened formula","Only unopened, sealed formula can be listed."],["weighted sleep","Weighted sleep sacks and swaddles go against safe sleep guidance, so they can't be listed."],["weighted swaddle","Weighted sleep sacks and swaddles go against safe sleep guidance, so they can't be listed."],["nipple shield","Used nipple shields can't be shared for hygiene reasons."]];
const CHIPS=["Due next month","Baby is 0 to 3 months","First baby","Replacing a broken one","Can pick up today"];
const NEIGHBORS=["Priya S.","Dana K.","Marisol R.","Hannah L.","Jo W.","Aisha B.","Kelly M.","Tomás G."];

