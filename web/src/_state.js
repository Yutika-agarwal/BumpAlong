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
