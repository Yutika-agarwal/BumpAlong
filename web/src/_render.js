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

