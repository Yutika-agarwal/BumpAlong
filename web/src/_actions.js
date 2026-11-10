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
