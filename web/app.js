(function(){
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


// Shared state and helpers. The backend (window.__bumpBackend) decides where data lives.
const B=window.__bumpBackend;
const MODE_NOTE=B.modeNote;
let ME=null,bootDone=false,loadError="";
const loaded={};
const COLS=["members","listings","interests","holds","requests"];
const D={members:[],listings:[],interests:[],holds:[],requests:[]};
let S={me:null,listings:[],interests:{},holds:[],mine:[],requests:[],myRequests:[],saved:[],ledger:[],lastLost:null};
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
S.saved=lsGet("bumpalong-saved",[]);
function save(){lsSet("bumpalong-saved",S.saved)}
const monthKey=()=>new Date().toISOString().slice(0,7);
const fmtWhen=t=>new Date(t||Date.now()).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const memberOf=id=>D.members.find(m=>m.id===id);
const nameOf=id=>{const m=memberOf(id);return m?m.name:"A neighbor"};
const CAP_W={Small:1,Medium:1,Large:2};
const ALLOW={Small:"floorSmall",Medium:"floorMedium"};
const isLoaded=()=>COLS.every(c=>loaded[c]);

function rebuild(){
  const me=memberOf(ME.id);
  S.me=me||null;
  S.ledger=(me&&me.ledger)||[];
  const mine={};
  D.interests.filter(i=>i.userId===ME.id).forEach(i=>{mine[i.listingId]=i.chips||[]});
  S.interests=mine;
  S.listings=D.listings.filter(l=>l.status!=="removed").map(l=>({...l,
    owner:l.giverId===ME.id?"You":nameOf(l.giverId),
    gone:l.status!=="open",
    interested:D.interests.filter(i=>i.listingId===l.id&&i.userId!==ME.id).length,
    safety:l.safety||[],desc:l.desc||"No extra details."}))
    .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  S.mine=S.listings.filter(l=>l.giverId===ME.id).map(l=>l.id);
  S.holds=D.holds.filter(h=>h.receiverId===ME.id||h.giverId===ME.id)
    .map(h=>({...h,role:h.giverId===ME.id?"giver":"receiver",messages:h.messages||[]}))
    .sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  const reqs=D.requests.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(r=>({...r,who:nameOf(r.whoId)}));
  S.requests=reqs.filter(r=>r.whoId!==ME.id);
  S.myRequests=reqs.filter(r=>r.whoId===ME.id);
  const dismissed=lsGet("bumpalong-dismissed",[]);
  const lost=D.listings.find(l=>(l.status==="drawn"||l.status==="done")&&D.interests.some(i=>i.listingId===l.id&&i.userId===ME.id)&&!D.holds.some(h=>h.listingId===l.id&&h.receiverId===ME.id)&&!dismissed.includes(l.id));
  S.lastLost=lost?{id:lost.id,who:"Another neighbor"}:null;
}

let view="feed",detailId=null,filter={q:"",cat:"",stage:""};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}
function fmtLeft(ms){if(ms<=0)return"closing now";const m=Math.round(ms/60000),h=Math.floor(m/60);return h?`${h}h ${m%60}m`:`${m}m`}
function tierOf(l){return l.tier||SUB_TIER[l.sub]||(CAT[l.cat]&&CAT[l.cat].tier)||"Small"}
function thumb(l){return `<div class="thumb" style="background:${(CAT[l.cat]||{}).hue||"#ddd"};color:#2A3A35"><span class="pill tier">${tierOf(l)} · ${TIER_PTS[tierOf(l)]} pts</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ART[(CAT[l.cat]||{}).art]||""}</svg></div>`}

function renderNav(){
  if(!S.me){$("#nav").innerHTML="";$("#walletMini").innerHTML="";return}
  const activeHolds=S.holds.filter(h=>h.state==="offered"||h.state==="accepted").length;
  const items=[["feed","Nearby"],["give","Give"],["requests","Requests"],["pickups","Pickups"],["wallet","Points"]];
  $("#nav").innerHTML=items.map(([k,t])=>`<button data-nav="${k}" ${view===k?'aria-current="page"':""}>${ICONS[k]}<span>${t}</span>${k==="pickups"&&activeHolds?`<span class="badge">${activeHolds}</span>`:""}</button>`).join("");
  $("#walletMini").innerHTML=`<div class="small muted">Your points</div><b>${S.me.balance}</b><div class="small muted">Reliability ${S.me.reliability} of 100</div>`;
}
function demoBar(){return `<div class="demo-bar"><span><b>${esc(S.me?S.me.name:"")}</b> · ${MODE_NOTE}</span>${B.signOut?`<button class="btn small ghost" data-act="signout">Sign out</button>`:""}</div>`}

function renderFeed(){
  const q=filter.q.toLowerCase().trim();
  let warn="";
  const ban=BANNED.find(([k])=>q&&q.includes(k));
  if(ban) warn=`<div class="note warn">${esc(ban[1])}</div>`;
  const items=S.listings.filter(l=>(!filter.cat||l.cat===filter.cat)&&(!filter.stage||(CAT[l.cat]&&CAT[l.cat].stages.includes(filter.stage)))&&(!q||(l.title+" "+l.cat+" "+(l.sub||"")+" "+(l.size||"")).toLowerCase().includes(q))&&!l.gone);
  const cats=filter.stage?CATALOG.filter(c=>c.stages.includes(filter.stage)):CATALOG;
  const ic=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const hero=`<section class="hero"><div><h1>Baby things, passed along by neighbors.</h1><p class="lead">Give and get pregnancy, postpartum and baby items for free: fairly, safely, and without digging through a busy group.</p><div class="row"><button class="btn primary big" data-nav="give">Give something</button><button class="btn ghost big" data-nav="requests">Post a request</button></div></div><div class="art">${ic('<path d="M3 11l3-6h12l3 6"/><path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 15h6"/>')}</div></section>
  <section class="promises"><div class="promise">${ic('<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>')}<h3>Fair, not fastest</h3><p>Items go to a random draw when the window closes, so nobody has to refresh all day.</p></div><div class="promise">${ic('<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>')}<h3>Safe to pass on</h3><p>Car seats, pumps and cribs get checked before they're listed. Recalled and banned items never go up.</p></div><div class="promise">${ic('<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>')}<h3>Nobody shut out</h3><p>Everyone gets free items each month, even with zero points.</p></div></section>`;
  return `${demoBar()}${hero}<div class="head"><div><h2>Free near you</h2><p class="muted">Everything from pregnancy to toddler, shared by neighbors in your group. Tap an item to see details and say you're interested.</p></div></div>
  <div class="stages" role="group" aria-label="Life stage"><button class="stage" aria-pressed="${!filter.stage}" data-stage=""><b>Everything</b><span>${S.listings.filter(l=>!l.gone).length} items</span></button>${STAGES.map(st=>`<button class="stage" aria-pressed="${filter.stage===st}" data-stage="${st}"><b>${st}</b><span>${STAGE_NOTE[st]}</span></button>`).join("")}</div>
  <div class="toolbar"><input id="q" type="search" placeholder="Search pregnancy pillow, pump, 0 to 3 months, stroller…" value="${esc(filter.q)}" aria-label="Search">
  <select id="cat" aria-label="Category"><option value="">All categories</option>${cats.map(c=>`<option ${filter.cat===c.cat?"selected":""}>${c.cat}</option>`).join("")}</select>
  <button class="btn small" data-act="saveSearch">Save this search</button></div>
  ${warn}
  ${S.lastLost?(()=>{const l=S.listings.find(x=>x.id===S.lastLost.id);return l?`<div class="panel stack" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><b>Not this time for the ${esc(l.title)}</b><button class="btn small" data-act="dismissLost">Dismiss</button></div><span class="muted small">${esc(S.lastLost.who)} was picked in the draw. If they don't accept, it can pass to a backup.</span>${shopBox(shopFor(l,"lost"),"Need it sooner?")}</div>`:""})():""}
  ${items.length?`<div class="grid">${items.map(card).join("")}</div>`:`<div class="empty">Nothing matches yet. Try a different search, or <button class="btn small" data-nav="requests">post a request</button> so neighbors know what you need.</div>`}
  <div class="panel" style="margin-top:22px"><h2>What you can share${filter.stage?" for "+filter.stage.toLowerCase():""}</h2><p class="muted small">Tap a category to filter the feed. Items marked new or sealed can only be shared unopened.</p>
  <div class="catalog">${cats.map(c=>`<button class="catbox" data-catpick="${esc(c.cat)}"><header><span class="ico" style="background:${c.hue}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ART[c.art]||""}</svg></span><h3>${esc(c.cat)}</h3></header><div class="subs">${c.subs.map(x=>`<span>${esc(x)}</span>`).join("")}</div></button>`).join("")}</div></div>`;
}
function card(l){
  const mine=S.interests[l.id];
  const status=l.mode==="First come"?`<span class="pill neutral">First come</span>`:(l.closes?`<span class="pill neutral">Draw in <span class="timer" data-closes="${l.closes}">${fmtLeft(l.closes-Date.now())}</span></span>`:"");
  return `<button class="card" data-open="${l.id}">${thumb(l)}<div class="body"><h3>${esc(l.title)}</h3>
  <div class="meta"><span>${esc(l.sub||l.cat)}</span>${l.area?`<span>${esc(l.area)}</span>`:""}<span>${esc(l.cond)}</span>${l.size?`<span>${esc(l.size)}</span>`:""}</div>
  <div class="row">${status}<span class="pill neutral">${l.interested+(mine?1:0)} interested</span>${mine?`<span class="pill ok">You're in</span>`:""}</div></div></button>`;
}

function renderDetail(){
  const l=S.listings.find(x=>x.id===detailId); if(!l){view="feed";return renderFeed()}
  const mine=S.interests[l.id];
  const t=tierOf(l),cost=TIER_PTS[t];
  const canFloor=(t==="Small"&&S.me.floorSmall>0)||(t==="Medium"&&S.me.floorMedium>0);
  const afford=S.me.balance>=cost||canFloor;
  const atCap=S.me.received+(t==="Large"?2:1)>S.me.cap;
  const isOwn=l.owner==="You";
  let action="";
  if(isOwn) action=`<div class="note info">This is your listing. You'll be told when the draw picks someone.</div>`;
  else if(S.holds.find(h=>h.listingId===l.id&&h.role==="receiver"&&h.state!=="done"&&h.state!=="released")) action=`<div class="note ok">You won this one. Go to <button class="btn small" data-nav="pickups">Pickups</button> to accept and pick a time.</div>`;
  else if(atCap) action=`<div class="note warn">You've reached this month's limit of ${S.me.cap} items. It resets on the 1st.</div>`;
  else if(!afford) action=`<div class="note warn">You need ${cost} points for a ${t} item and you have ${S.me.balance}. Give something away to earn more.</div>`;
  else if(mine) action=`<div class="note ok">You're in${l.mode==="First come"?"":" the draw"}${mine.length?` with: ${mine.map(esc).join(", ")}`:""}.</div>
    <div class="row"><button class="btn" data-act="withdraw" data-id="${l.id}">Withdraw</button></div>
    <p class="small muted">The draw runs when the claim window closes. People who received something recently get no special treatment, and a retry can't change the winner.</p>`;
  else action=`<p class="small muted">Add context for the giver if you like. Only they see it, and it's never free text.</p>
    <div class="chips" id="chipset">${CHIPS.map(c=>`<button class="chip" aria-pressed="false" data-chip="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="row"><button class="btn primary" data-act="interest" data-id="${l.id}">${l.mode==="First come"?"Claim it now":"I'm interested"}</button>
    <span class="small muted">${afford&&S.me.balance<cost?"Uses your monthly free allowance":`Costs ${cost} points only if you receive it`}</span></div>`;
  return `${demoBar()}<button class="back" data-nav="feed">← Back to nearby items</button>
  <div class="two"><div class="stack"><div class="panel" style="padding:0;overflow:hidden">${thumb(l)}</div>
    <div class="panel"><h2>About this item</h2><p>${esc(l.desc)}</p>
    <dl class="kv"><dt>Category</dt><dd>${esc(l.cat)}${l.sub?" › "+esc(l.sub):""}${l.bundle?" (bundle)":""}</dd><dt>Good for</dt><dd>${(CAT[l.cat]||{stages:[]}).stages.join(", ")}</dd><dt>Condition</dt><dd>${esc(l.cond)}</dd>${l.size?`<dt>Size or age</dt><dd>${esc(l.size)}</dd>`:""}<dt>Pickup</dt><dd>${esc(l.pickup)}</dd><dt>Area</dt><dd>${esc(l.area||"Not given")} (agree the exact spot in chat after you pick a time)</dd><dt>Giver</dt><dd>${esc(l.owner)}</dd></dl>
    ${l.safety.length?`<div class="row">${l.safety.map(s=>`<span class="pill ok">${esc(s)}</span>`).join("")}</div>`:""}
    ${shopBox(shopFor(l,"parts"),"Used pumps need new personal parts.")}${shopBox(shopFor(l,"new"))}</div></div>
  <div class="panel"><div class="row"><span class="pill tier">${t} · ${cost} pts</span>${l.closes&&l.mode!=="First come"?`<span class="pill neutral">Draw in <span class="timer" data-closes="${l.closes}">${fmtLeft(l.closes-Date.now())}</span></span>`:`<span class="pill neutral">${esc(l.mode)}</span>`}</div>
  <h1>${esc(l.title)}</h1><p class="muted small">${l.interested+(mine?1:0)} neighbors interested</p>${action}</div></div>`;
}

function renderGive(){
  return `${demoBar()}<div class="head"><div><h1>Give an item</h1><p class="muted">You earn points when the handoff is confirmed. Safety checks run before your listing goes live.</p></div></div>
  <form class="panel" id="giveForm" novalidate>
  <div class="fields">
   <div class="field"><label for="g-title">What are you giving?</label><input id="g-title" required placeholder="e.g. Baby Bjorn bouncer"></div>
   <div class="field"><label for="g-cat">Category</label><select id="g-cat">${STAGES.map(st=>`<optgroup label="${st}">${CATALOG.filter(c=>c.stages[0]===st).map(c=>`<option>${c.cat}</option>`).join("")}</optgroup>`).join("")}</select></div>
   <div class="field"><label for="g-sub">Type</label><select id="g-sub"></select></div>
   <div class="field"><label for="g-cond">Condition</label><select id="g-cond"><option>New with tags</option><option>Like new</option><option selected>Gently used</option><option>Well used</option><option>For parts or crafts</option></select></div>
   <div class="field"><label for="g-size">Size or age range</label><input id="g-size" placeholder="e.g. 0 to 3 months"></div>
  </div>
  <div id="g-safety" class="fields"></div>
  <div class="fields">
   <div class="field"><label for="g-pickup">Pickup</label><select id="g-pickup"><option>Porch pickup</option><option>Hand-to-hand</option><option>Public meetup</option></select></div>
   <div class="field"><label for="g-area">Neighborhood</label><input id="g-area" placeholder="e.g. Maple Grove (no street address)"></div>
   <div class="field"><label for="g-mode">How should we pick?</label><select id="g-mode"><option>Lottery</option><option>First come</option></select></div>
   <div class="field"><label for="g-window">Claim window</label><select id="g-window"><option value="2">2 hours</option><option value="12" selected>12 hours</option><option value="24">24 hours</option><option value="48">48 hours</option></select></div>
  </div>
  <div class="field"><label for="g-desc">Details</label><textarea id="g-desc" rows="3" placeholder="What's included, any wear or missing parts"></textarea></div>
  <div class="field"><label for="g-photo">Photos</label><input id="g-photo" type="file" accept="image/*" multiple><span class="small muted">We remove location data from photos and blur any child's face we detect.</span></div>
  <div id="g-msg"></div>
  <div class="row"><button class="btn primary" type="submit">Check and publish</button><span class="small muted" id="g-tier"></span></div>
  </form>
  ${S.mine.length?`<div class="panel" style="margin-top:16px"><h2>Your listings</h2>${S.mine.map(id=>{const l=S.listings.find(x=>x.id===id);return l?`<div class="row"><b>${esc(l.title)}</b><span class="pill neutral">${l.status==="done"?"Handed off":l.status==="drawn"?"Picked":"Active"}</span><span class="small muted">${l.interested} interested</span></div>`:""}).join("")}</div>`:""}`;
}
function safetyFields(cat,sub){
  if(cat==="Car seats") return `<div class="field"><label for="s-exp">Expiry date on the label</label><input id="s-exp" type="month"></div><div class="field"><label for="s-crash">Has it ever been in a crash?</label><select id="s-crash"><option value="">Choose one</option><option value="no">No, never</option><option value="yes">Yes</option><option value="unsure">Not sure</option></select></div><div class="field"><label for="s-model">Brand and model</label><input id="s-model" placeholder="For the recall check"></div>`;
  if(cat==="Bottles and formula") return `<div class="field"><label for="s-formula">Formula or food?</label><select id="s-formula"><option value="na">No</option><option value="sealed">Yes, sealed and in date</option><option value="open">Yes, opened</option></select></div>`;
  if(cat==="Nursing and pumping") return `<div class="field"><label for="s-pump">Is this a breast pump?</label><select id="s-pump"><option value="none">Not a pump</option><option value="closed">Yes, closed-system (multi-user)</option><option value="open">Yes, open-system (single-user)</option></select></div><div class="field"><label for="s-sealed">Personal parts (flanges, valves, tubing)</label><select id="s-sealed"><option value="na">Not included</option><option value="sealed">Included, new and sealed</option><option value="used">Included, used</option></select></div>`;
  if(cat==="Sleep"||cat==="Nursery furniture") return `<div class="field"><label for="s-model">Brand and model</label><input id="s-model" placeholder="For the recall check"></div><div class="field"><label for="s-year">Year made</label><input id="s-year" type="number" min="1990" max="2026" placeholder="e.g. 2022"></div><div class="field"><label for="s-mod">Modified or homemade?</label><select id="s-mod"><option value="no">No</option><option value="yes">Yes</option></select></div>`;
  return "";
}
function checkGive(){
  const title=$("#g-title").value.trim(), cat=$("#g-cat").value, sub=$("#g-sub").value, text=(title+" "+$("#g-desc").value).toLowerCase();
  const errs=[],warns=[],badges=[];
  if(!title) errs.push("Add a short title so neighbors know what it is.");
  const ban=BANNED.find(([k])=>text.includes(k)); if(ban) errs.push(ban[1]);
  if(MUST_BE_NEW.test(sub)&&$("#g-cond").value!=="New with tags") errs.push(`${sub.replace(/\s*\(.*\)/,"")} must be new and sealed to share. Set the condition to "New with tags", or leave it out.`);
  if(cat==="Car seats"){
    const exp=$("#s-exp").value,crash=$("#s-crash").value;
    if(!exp) errs.push("Add the expiry date from the car seat label.");
    else{const d=new Date(exp+"-01"),now=new Date();
      if(d<now) errs.push("This car seat has expired, so it can't be listed.");
      else{ if((d-now)/864e5<183) warns.push("This seat expires within 6 months. We'll show that on the listing."); badges.push("Expires "+d.toLocaleString("en-US",{month:"short",year:"numeric"}));}}
    if(crash==="yes") errs.push("Car seats that have been in a crash can't be listed.");
    else if(crash==="unsure") errs.push("If you're not sure about crash history, the seat can't be listed.");
    else if(!crash) errs.push("Tell us whether the seat has been in a crash.");
    else badges.push("Never in a crash (owner attests)");
  }
  if(cat==="Bottles and formula"&&$("#s-formula").value==="open") errs.push("Only unopened, sealed formula can be listed.");
  if(cat==="Nursing and pumping"){
    const p=$("#s-pump").value,s=$("#s-sealed").value;
    if(p==="open"&&$("#g-cond").value!=="New with tags") errs.push("Single-user (open-system) pumps can only be given new and sealed.");
    if(s==="used") errs.push("Used flanges, valves and tubing can't be shared. Remove them or include new sealed parts.");
    if(p==="closed") badges.push("Closed-system pump: use new personal parts");
  }
  if(cat==="Sleep"||cat==="Nursery furniture"){
    if($("#s-mod").value==="yes") errs.push("Homemade or modified sleep products can't be listed.");
    if(!$("#s-model").value.trim()) warns.push("Add the brand and model so we can run the recall check.");
  }
  if(["Car seats","Strollers and carriers","Sleep","Nursery furniture","Baby gear and play"].includes(cat)&&!errs.length) badges.push("Recall check passed (CPSC)");
  return {errs,warns,badges,title,cat,sub};
}

function renderRequests(){
  return `${demoBar()}<div class="head"><div><h1>Requests</h1><p class="muted">Ask for what you need. Neighbors can see what you need and list a match.</p></div></div>
  <div class="two"><div class="stack"><div class="panel"><h2>Nearby requests</h2>
  ${S.requests.map(r=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:10px"><div><b>${esc(r.what)}</b><div class="small muted">${esc(r.who)}${r.area?" · "+esc(r.area):""} · ${esc(r.by)}${r.size?" · "+esc(r.size):""}</div></div><button class="btn small" data-nav="give">I have one</button></div>`).join("")}</div>
  ${S.myRequests.length?`<div class="panel"><h2>Your requests</h2>${S.myRequests.map(r=>`<div><b>${esc(r.what)}</b> <span class="small muted">${esc(r.by)} · open for 30 days</span></div>`).join("")}</div>`:""}</div>
  <div class="stack"><form class="panel" id="reqForm"><h2>Ask for something</h2>
  <div class="field"><label for="r-what">What do you need?</label><input id="r-what" placeholder="e.g. Baby carrier" required></div>
  <div class="field"><label for="r-size">Size or age</label><input id="r-size" placeholder="Optional"></div>
  <div class="field"><label for="r-by">When</label><select id="r-by"><option>This week</option><option>Within 2 weeks</option><option>Due next month</option><option>No rush</option></select></div>
  <div id="r-msg"></div><button class="btn primary" type="submit">Post request</button></form>
  <div class="panel"><h2>Saved searches</h2>${S.saved.length?S.saved.map(s=>`<div class="row"><span>${esc(s)}</span><span class="pill neutral">Saved</span></div>`).join(""):`<p class="muted small">Save a search on the Nearby page to keep it here.</p>`}</div></div></div>`;
}

function renderPickups(){
  const hs=S.holds.slice().reverse();
  if(!hs.length) return `${demoBar()}<div class="head"><h1>Pickups</h1></div><div class="empty">No pickups yet. When you win a draw, the item shows up here with a timer to accept it.</div>`;
  return `${demoBar()}<div class="head"><div><h1>Pickups</h1><p class="muted">Accept in time, pick a slot, and confirm when you have it. No-shows lower your reliability score.</p></div></div><div class="stack">${hs.map(holdPanel).join("")}</div>`;
}
function chatBox(h,l){
  const other=h.role==="giver"?(h.receiverName||"the receiver"):l.owner;
  return `<div class="chat" id="chat-${h.id}">${(h.messages||[]).map(m=>`<div class="msg ${m.by===ME.id?"me":""}">${m.sys?`<span class="sys">${esc(m.t)}</span>`:esc(m.t)}</div>`).join("")}</div>
    <form class="row" data-chat="${h.id}"><input id="msg-${h.id}" style="flex:1 1 200px;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:var(--bg)" placeholder="Message ${esc(other)}" aria-label="Message"><button class="btn small" type="submit">Send</button></form>`;
}
function holdPanel(h){
  const l=S.listings.find(x=>x.id===h.listingId); if(!l) return "";
  const t=tierOf(l), giver=h.role==="giver"; let body="";
  if(h.state==="offered") body=giver
    ?`<div class="note info">${esc(h.receiverName||"A neighbor")} won the draw and has <span class="timer" data-closes="${h.acceptBy}">${fmtLeft(h.acceptBy-Date.now())}</span> to accept. If they don't, it goes to the next person.</div>`
    :`<div class="note info">You won the draw. Accept within <span class="timer" data-closes="${h.acceptBy}">${fmtLeft(h.acceptBy-Date.now())}</span> or it goes to the next person.</div>
    <div class="row"><button class="btn primary" data-act="accept" data-id="${h.id}">Accept</button><button class="btn" data-act="decline" data-id="${h.id}">Pass to next person</button></div>`;
  if(h.state==="accepted"){
    const slots=["Today 5:00 to 6:00 pm","Today 7:00 to 8:00 pm","Tomorrow 9:00 to 10:00 am","Tomorrow 6:00 to 7:00 pm"];
    const pick=giver?"":`<div class="field"><b>Pick a pickup time</b><div class="slots">${slots.map(s=>`<button class="chip" aria-pressed="${h.slot===s}" data-act="slot" data-id="${h.id}" data-slot="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`;
    const status=h.slot?`<div class="note ok"><b>${esc(l.pickup)}:</b> ${esc(h.slot)}<br><span class="small">${giver?"Share the exact spot in the chat below.":"The giver will share the exact spot in the chat below."}</span></div>`:`<div class="note info">${giver?`Waiting for ${esc(h.receiverName||"them")} to pick a time.`:"Pick a time, then the giver shares the exact spot in chat."}</div>`;
    const acts=giver?"":`<div class="row"><button class="btn primary" data-act="gotit" data-id="${h.id}" ${h.slot?"":"disabled"}>Got it</button><button class="btn" data-act="declineAtPickup" data-id="${h.id}" ${h.slot?"":"disabled"}>Doesn't match the listing</button><button class="btn ghost" data-act="cancel" data-id="${h.id}">Cancel</button></div>`;
    body=pick+status+chatBox(h,l)+acts;
  }
  if(h.state==="done") body=`<div class="note ok">${esc(giver?(h.resultGiver||h.result):h.result)}</div>`;
  if(h.state==="released") body=`<div class="note warn">${esc(giver?(h.resultGiver||h.result):h.result)}</div>`;
  return `<div class="panel"><div class="row" style="justify-content:space-between"><div><h2>${esc(l.title)}</h2><div class="small muted">${giver?"To "+esc(h.receiverName||"a neighbor"):"From "+esc(l.owner)}${l.area?" · "+esc(l.area):""}</div></div><span class="pill tier">${t} · ${TIER_PTS[t]} pts</span></div>${body}</div>`;
}

function renderWallet(){
  const m=S.me;
  return `${demoBar()}<div class="head"><div><h1>Your points</h1><p class="muted">Points move only when a handoff is confirmed. They never expire and can't be bought or sold.</p></div></div>
  <div class="stats">
   <div class="stat"><span class="small muted">Balance</span><b>${m.balance}</b><span class="small muted">points</span></div>
   <div class="stat"><span class="small muted">Free allowance this month</span><b>${m.floorSmall} + ${m.floorMedium}</b><span class="small muted">small + medium items, even at 0 points</span></div>
   <div class="stat"><span class="small muted">Received this month</span><b>${m.received} of ${m.cap}</b><div class="meter"><i style="width:${Math.min(100,m.received/m.cap*100)}%"></i></div></div>
   <div class="stat"><span class="small muted">Reliability</span><b>${m.reliability}</b><div class="meter"><i style="width:${m.reliability}%;background:${m.reliability>=70?"var(--ok)":m.reliability>=40?"var(--warn)":"var(--bad)"}"></i></div><span class="small muted">${m.reliability>=70?"Shows a Reliable badge":"Below 70, no badge"}</span></div>
  </div>
  <div class="two" style="margin-top:16px"><div class="panel"><h2>History</h2><div class="tablewrap"><table><thead><tr><th>When</th><th>What</th><th style="text-align:right">Points</th></tr></thead><tbody>${S.ledger.slice().reverse().map(e=>`<tr><td>${esc(fmtWhen(e.t))}</td><td>${esc(e.what)}</td><td class="num">${e.amt>0?"+":""}${e.amt}</td></tr>`).join("")}</tbody></table></div></div>
  <div class="panel"><h2>How points work</h2><div class="tablewrap"><table><thead><tr><th>Size</th><th>Examples</th><th style="text-align:right">Points</th></tr></thead><tbody>
  <tr><td>Small</td><td>Clothes bundle, toys, books</td><td class="num">50</td></tr><tr><td>Medium</td><td>Bouncer, carrier, car seat</td><td class="num">150</td></tr><tr><td>Large</td><td>Stroller, crib, glider</td><td class="num">300</td></tr></tbody></table></div>
  <p class="small muted">Givers earn the item's points; receivers spend them. You can receive up to 8 items a month.</p></div></div>`;
}

function render(){
  renderNav();
  if(!ME||!S.me){$("#main").innerHTML=gateHtml();return}
  const r={feed:renderFeed,detail:renderDetail,give:renderGive,requests:renderRequests,pickups:renderPickups,wallet:renderWallet}[view];
  $("#main").innerHTML=r();
  if(view==="give"){const c=$("#g-cat"),sb=$("#g-sub");
    const updTier=()=>{const t=tierOf({cat:c.value,sub:sb.value});$("#g-safety").innerHTML=safetyFields(c.value,sb.value);$("#g-tier").textContent=`${t} item: you earn ${TIER_PTS[t]} points when it's picked up.`};
    const updCat=()=>{sb.innerHTML=CAT[c.value].subs.map(x=>`<option>${esc(x)}</option>`).join("");updTier()};
    c.addEventListener("change",updCat);sb.addEventListener("change",updTier);updCat();}
  save();
}
function go(v){view=v;window.scrollTo(0,0);render()}

function ledger(what,amt){S.ledger.push({when:new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),what,amt})}


// Rules, draw, handoff and event handlers.
async function sha(s){
  try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
  catch(e){let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))>>>0;return h.toString(16).padStart(8,"0")}
}
const SYS_JOIN="Chat stays in the app. Phone numbers and links are hidden.";
const intId=(lid,uid)=>`${lid}__${String(uid).replace(/[^A-Za-z0-9_-]/g,"-")}`;
const holdId=l=>`hold_${l.id}_${l.round||0}`;
const newHold=(l,id,receiverId,backups)=>({id,listingId:l.id,giverId:l.giverId,receiverId,receiverName:nameOf(receiverId),backups,state:"offered",acceptBy:Date.now()+6*3600e3,slot:null,messages:[{sys:true,by:"",t:SYS_JOIN}],createdAt:Date.now()});

function quote(t){
  const m=S.me;
  if(m.received+CAP_W[t]>m.cap) return {ok:false,msg:`You've reached this month's limit of ${m.cap} items. It resets on the 1st.`};
  const cost=TIER_PTS[t];
  if(m.balance>=cost) return {ok:true,method:"points",cost};
  const k=ALLOW[t];
  if(k&&m[k]>0) return {ok:true,method:"allowance",cost:0};
  return {ok:false,msg:`You need ${cost} points for a ${t} item and you have ${m.balance}. Give something away to earn more.`};
}

// Deterministic draw: the same listing and round always produce the same order, so a retry can't change the winner.
async function localDraw(l){
  const hid=holdId(l);
  if(await B.get("holds",hid)){ if(l.status==="open") await B.patch("listings",l.id,{status:"drawn"}); return; }
  const seen=new Set(),el=[];
  for(const i of D.interests.filter(x=>x.listingId===l.id)){
    const rel=(memberOf(i.userId)||{}).reliability??80;
    if(i.userId===l.giverId||seen.has(i.userId)||rel<40||!memberOf(i.userId)) continue;
    seen.add(i.userId);el.push(i.userId);
  }
  if(!el.length){await B.patch("listings",l.id,{closes:Date.now()+12*3600e3});return}
  const keys=await Promise.all(el.map(async id=>[id,await sha(`${l.id}:${l.round||0}:${id}`)]));
  keys.sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:0);
  const order=keys.map(k=>k[0]);
  await B.set("holds",hid,newHold(l,hid,order[0],order.slice(1,4)));
  await B.patch("listings",l.id,{status:"drawn"});
}
async function localClaim(l){
  const hid=holdId(l);
  if(await B.get("holds",hid)) return false;
  await B.set("holds",hid,newHold(l,hid,ME.id,[]));
  await B.patch("listings",l.id,{status:"drawn"});
  return true;
}
async function localCredit(h,l,t){
  const g=await B.get("members",l.giverId); if(!g) return;
  const earn=TIER_PTS[t];
  await B.patch("members",l.giverId,{balance:(g.balance||0)+earn,ledger:[...(g.ledger||[]),{t:Date.now(),what:"Gave: "+l.title,amt:earn}].slice(-100)});
}
async function reopen(l){
  for(const i of D.interests.filter(x=>x.listingId===l.id)) await B.del("interests",i.id);
  await B.patch("listings",l.id,{status:"open",round:(l.round||0)+1,closes:l.mode==="First come"?null:Date.now()+12*3600e3});
}
async function localRelease(h,mode,resR,resG){
  const l=D.listings.find(x=>x.id===h.listingId); if(!l) return;
  const f=await B.get("holds",h.id); if(!f||f.state==="released"||f.state==="done") return;
  await B.patch("holds",h.id,{state:"released",result:resR,resultGiver:resG});
  const next=mode==="next"?(f.backups||[]).filter(id=>memberOf(id)):[];
  if(next.length){
    const id2=h.id+"_n";
    if(!(await B.get("holds",id2))) await B.set("holds",id2,newHold(l,id2,next[0],next.slice(1)));
  } else await reopen(l);
}
// mode "next": offer to the next backup, or reopen the listing. mode "reopen": reopen the listing.
const releaseHold=(h,mode,resR,resG)=>(B.releaseHold||localRelease)(h,mode,resR,resG);

let maintaining=false;
async function maintain(){
  if(maintaining||!ME||!isLoaded()||!S.me) return;
  maintaining=true;
  try{
    const now=Date.now();
    if(S.me.month!==monthKey()) await B.patch("members",ME.id,{month:monthKey(),received:0,floorSmall:2,floorMedium:1});
    for(const l of D.listings){
      if(l.status==="open"&&l.mode!=="First come"&&l.closes&&l.closes<=now) await (B.runDraw||localDraw)(l);
    }
    for(const h of S.holds){
      if(h.state==="offered"&&h.acceptBy&&h.acceptBy<now) await releaseHold(h,"next","The time to accept ran out, so it went to the next person.","The time to accept ran out, so it went to the next person.");
    }
  }catch(e){console.warn("maintain",e)}
  finally{maintaining=false}
}

let pendingRender=false;
function onData(){
  if(!ME||!isLoaded()) return;
  rebuild();
  maintain();
  const a=document.activeElement;
  const typing=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&$("#main").contains(a);
  const giveDirty=view==="give"&&$("#g-title")&&($("#g-title").value||$("#g-desc").value);
  if(typing||giveDirty){pendingRender=true;renderNav();return}
  pendingRender=false;render();
}
document.addEventListener("focusout",()=>{if(pendingRender)setTimeout(()=>{if(pendingRender&&!document.activeElement.closest("#main")){pendingRender=false;if(ME&&isLoaded()){rebuild();render()}}},80)});

function gateHtml(){
  if(loadError) return `<div class="panel stack"><h2>Couldn't load</h2><div class="note warn">${esc(loadError)}</div></div>`;
  if(!bootDone) return `<div class="empty">Loading…</div>`;
  if(!ME) return B.signInHtml();
  if(!isLoaded()) return `<div class="empty">Loading your neighborhood…</div>`;
  const first=(ME.name||"").split(/\s+/)[0]||"";
  const last=((ME.name||"").split(/\s+/)[1]||"")[0];
  return `<div class="head"><div><h1>Welcome to Bumpalong</h1><p class="muted">Pick the name neighbors will see. First name and last initial works well. You start with 300 points.</p></div></div>
  <form class="panel" id="joinForm" novalidate><div class="fields">
  <div class="field"><label for="j-name">Display name</label><input id="j-name" maxlength="40" value="${esc(first+(last?" "+last+".":""))}" required></div>
  <div class="field"><label for="j-area">Neighborhood</label><input id="j-area" maxlength="60" placeholder="e.g. Maple Grove (no street address)"></div></div>
  <div id="j-msg"></div><button class="btn primary" type="submit">Join</button></form>`;
}

document.addEventListener("click",async e=>{
  const nav=e.target.closest("[data-nav]"); if(nav){e.preventDefault();go(nav.dataset.nav);return}
  const open=e.target.closest("[data-open]"); if(open){detailId=open.dataset.open;go("detail");return}
  if(e.target.closest('[data-act="dismissLost"]')){const d=lsGet("bumpalong-dismissed",[]);if(S.lastLost)d.push(S.lastLost.id);lsSet("bumpalong-dismissed",d);S.lastLost=null;render();return}
  const cp=e.target.closest("[data-catpick]"); if(cp){filter.cat=cp.dataset.catpick;render();window.scrollTo(0,0);return}
  const st=e.target.closest("[data-stage]"); if(st){filter.stage=st.dataset.stage;if(filter.stage&&filter.cat&&!CAT[filter.cat].stages.includes(filter.stage))filter.cat="";render();return}
  const chip=e.target.closest("[data-chip]"); if(chip){chip.setAttribute("aria-pressed",chip.getAttribute("aria-pressed")==="true"?"false":"true");return}
  const a=e.target.closest("[data-act]"); if(!a)return;
  const act=a.dataset.act,id=a.dataset.id;
  try{
    if(act==="signout"){await B.signOut();location.reload();return}
    if(act==="googleSignin"){await B.signInGoogle();return}
    if(!S.me) return;
    if(act==="saveSearch"){const label=(filter.q||filter.cat||"Everything");if(!S.saved.includes(label))S.saved.push(label);save();render();toast("Search saved on this device.");return}
    if(act==="interest"){
      const l=D.listings.find(x=>x.id===id); if(!l||l.giverId===ME.id) return;
      if(l.status!=="open"){toast("This one is no longer open.");return}
      const q=quote(tierOf(l)); if(!q.ok){toast(q.msg);return}
      if(l.mode==="First come"){const ok=await (B.claim||localClaim)(l);toast(ok?"It's yours. Go to Pickups to accept.":"Someone just claimed it.");if(ok)go("pickups");return}
      const chips=[...document.querySelectorAll('#chipset [aria-pressed="true"]')].map(b=>b.dataset.chip);
      await B.set("interests",intId(l.id,ME.id),{listingId:l.id,userId:ME.id,chips,createdAt:Date.now()});
      toast("You're in the draw");return}
    if(act==="withdraw"){await B.del("interests",intId(id,ME.id));toast("Interest withdrawn, no penalty");return}
    const h=D.holds.find(x=>x.id===id);
    if(!h) return;
    const l=D.listings.find(x=>x.id===h.listingId);
    const msgs=(h.messages||[]);
    if(act==="accept"){await B.patch("holds",id,{state:"accepted"});toast("Accepted. Pick a time.");return}
    if(act==="decline"){await releaseHold(h,"next","You passed. It went to the next person, with no penalty because you said so in time.",`${S.me.name} passed. It went to the next person.`);return}
    if(act==="slot"){const slot=a.dataset.slot;await B.patch("holds",id,{slot,messages:[...msgs,{sys:true,by:"",t:`Pickup set for ${slot}.`}].slice(-200)});return}
    if(act==="cancel"){await B.patch("members",ME.id,{reliability:Math.max(0,S.me.reliability-3)});await releaseHold(h,"next","Cancelled early. Reliability -3. The item went to the next person.",`${S.me.name} cancelled. It went to the next person.`);return}
    if(act==="declineAtPickup"){
      await releaseHold(h,"reopen","Declined at pickup because it didn't match the listing. No points moved and no penalty.","The receiver said the item didn't match the listing. No points moved. Your listing is open again.");return}
    if(act==="gotit"){
      const f=await B.get("holds",id); if(!f||f.state!=="accepted"||f.receiverId!==ME.id||!l) return;
      const t=tierOf(l),q=quote(t); if(!q.ok){toast(q.msg);return}
      const m=S.me,patch={received:m.received+CAP_W[t],reliability:Math.min(100,m.reliability+3)};
      let note;
      if(q.method==="points"){patch.balance=m.balance-q.cost;note=`${q.cost} points spent.`}
      else{patch[ALLOW[t]]=m[ALLOW[t]]-1;note="Used your free allowance, no points spent."}
      patch.ledger=[...S.ledger,{t:Date.now(),what:(q.method==="points"?"Received: ":"Received with free allowance: ")+l.title,amt:-q.cost}].slice(-100);
      await B.patch("holds",id,{state:"done",result:`Handoff confirmed. ${note} Reliability +3.`,resultGiver:`Handoff confirmed. You earned ${TIER_PTS[t]} points.`});
      await B.patch("members",ME.id,patch);
      if(B.creditGiver) await B.creditGiver(f,l,t);
      else{await B.patch("listings",l.id,{status:"done"});await localCredit(f,l,t)}
      toast("Enjoy it!");return}
  }catch(err){console.warn(err);toast("That didn't go through. Try again.")}
});
document.addEventListener("input",e=>{
  if(e.target.id==="q"){filter.q=e.target.value;const pos=e.target.selectionStart;render();const q=$("#q");q.focus();q.setSelectionRange(pos,pos)}
});
document.addEventListener("change",e=>{
  if(e.target.id==="cat"){filter.cat=e.target.value;render()}
});
document.addEventListener("submit",async e=>{
  e.preventDefault();
  try{
  if(e.target.id==="signinForm"){const em=$("#si-email").value.trim();if(!em)return;$("#si-msg").innerHTML=`<div class="note info">${esc(await B.signIn(em))}</div>`;return}
  if(e.target.id==="joinForm"){
    const name=$("#j-name").value.trim().slice(0,40);
    if(!name){$("#j-msg").innerHTML=`<div class="note bad">Add a display name.</div>`;return}
    if(!(await B.get("members",ME.id))) await B.set("members",ME.id,{name,area:$("#j-area").value.trim().slice(0,60),balance:300,reliability:80,floorSmall:2,floorMedium:1,received:0,cap:8,month:monthKey(),ledger:[{t:Date.now(),what:"Starting balance",amt:300}],joinedAt:Date.now()});
    return}
  if(!S.me) return;
  if(e.target.id==="giveForm"){
    const r=checkGive(),box=$("#g-msg");
    if(r.errs.length){box.innerHTML=r.errs.map(x=>`<div class="note bad">${esc(x)}</div>`).join("");return}
    const id="L"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),mode=$("#g-mode").value;
    await B.set("listings",id,{id,giverId:ME.id,title:r.title.slice(0,120),cat:r.cat,sub:r.sub,cond:$("#g-cond").value,size:$("#g-size").value.trim().slice(0,60),area:$("#g-area").value.trim().slice(0,60)||S.me.area||"",mode,closes:mode==="First come"?null:Date.now()+(+$("#g-window").value)*3600e3,pickup:$("#g-pickup").value,safety:r.badges,desc:$("#g-desc").value.trim().slice(0,1000),status:"open",round:0,tier:tierOf({cat:r.cat,sub:r.sub}),createdAt:Date.now()});
    box.innerHTML=r.warns.map(x=>`<div class="note warn">${esc(x)}</div>`).join("")+`<div class="note ok">Published. Neighbors can see it now.</div>`;
    $("#giveForm").reset();setTimeout(()=>{detailId=id;rebuild();go("detail")},900);
    return}
  if(e.target.id==="reqForm"){
    const what=$("#r-what").value.trim();
    if(!what){$("#r-msg").innerHTML=`<div class="note bad">Say what you need.</div>`;return}
    const ban=BANNED.find(([k])=>what.toLowerCase().includes(k));
    if(ban){$("#r-msg").innerHTML=`<div class="note bad">${esc(ban[1])}</div>`;return}
    const id="R"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    await B.set("requests",id,{id,whoId:ME.id,what:what.slice(0,120),size:$("#r-size").value.trim().slice(0,60),by:$("#r-by").value,area:S.me.area||"",createdAt:Date.now()});
    $("#reqForm").reset();toast("Request posted");return}
  const cid=e.target.dataset.chat;
  if(cid){
    const inp=$("#msg-"+cid);let t=inp.value.trim();if(!t)return;
    const f=await B.get("holds",cid);if(!f)return;
    const masked=t.replace(/(\+?\d[\d\s().-]{6,}\d)/g,"[number hidden]").replace(/https?:\/\/\S+/g,"[link hidden]");
    const add=[];
    if(/venmo|zelle|cash ?app|paypal|\$\d/i.test(t)) add.push({sys:true,by:"",t:"Payment requests aren't allowed. Bumpalong is free."});
    else add.push({by:ME.id,t:masked.slice(0,500)});
    if(masked!==t) add.push({sys:true,by:"",t:"Phone numbers and links are hidden."});
    inp.value="";
    await B.patch("holds",cid,{messages:[...(f.messages||[]),...add].slice(-200)});
    const c=$("#chat-"+cid);if(c)c.scrollTop=c.scrollHeight;
  }
  }catch(err){console.warn(err);toast("That didn't go through. Try again.")}
});
setInterval(()=>{document.querySelectorAll("[data-closes]").forEach(el=>{el.textContent=fmtLeft(+el.dataset.closes-Date.now())})},30000);
setInterval(()=>{maintain()},30000);

(async()=>{
  render();
  try{ME=await B.init()}catch(e){ME=null;loadError=(e&&e.message)||"Could not start."}
  bootDone=true;
  if(!ME){render();return}
  render();
  COLS.forEach(c=>B.watch(c,rows=>{D[c]=rows;loaded[c]=true;onData()},err=>{loadError=(err&&err.message)||"Could not load shared data.";render()}));
})();

})();
