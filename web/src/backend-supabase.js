// Backend for the public site: Supabase Auth (email link, Google) and Postgres with row-level security.
// Run supabase/schema.sql first, then fill in web/config.js.
window.__bumpBackend=(function(){
  const cfg=window.BUMPALONG_CONFIG||{};
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  const row=r=>({...r.data,id:r.id});
  const reloaders=[];
  const refresh=()=>reloaders.forEach(f=>f());
  const ok=async p=>{const r=await p;if(r.error)throw r.error;return r.data};
  return {
    modeNote:"Neighbors only. Sign in with the same account each time.",
    signOut:()=>sb.auth.signOut(),
    async init(){
      const {data}=await sb.auth.getSession();
      const u=data.session&&data.session.user;
      if(!u) return null;
      const meta=u.user_metadata||{};
      return {id:u.id,name:meta.name||meta.full_name||(u.email||"").split("@")[0]};
    },
    signInHtml(){
      return `<div class="panel stack"><h1>Sign in to Bumpalong</h1><p class="muted">Give and get baby items from neighbors. We email you a sign-in link, no password needed.</p>
      <form class="stack" id="signinForm" novalidate><div class="field"><label for="si-email">Email</label><input id="si-email" type="email" autocomplete="email" required></div><div id="si-msg"></div>
      <div class="row"><button class="btn primary" type="submit">Email me a link</button><button class="btn" type="button" data-act="googleSignin">Continue with Google</button></div></form></div>`;
    },
    async signIn(email){
      const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split("#")[0]}});
      return error?error.message:"Check your email for a sign-in link.";
    },
    async signInGoogle(){await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.href.split("#")[0]}})},
    watch(col,cb,err){
      const load=()=>ok(sb.from("docs").select("id,data").eq("col",col)).then(rows=>cb(rows.map(row))).catch(err);
      reloaders.push(load);load();
      sb.channel("docs-"+col).on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:"col=eq."+col},load).subscribe();
    },
    async get(col,id){const r=await ok(sb.from("docs").select("id,data").eq("col",col).eq("id",id).maybeSingle());return r?row(r):null},
    async set(col,id,data){await ok(sb.from("docs").upsert({col,id,data}));refresh()},
    async patch(col,id,part){
      const cur=await this.get(col,id);if(!cur)throw new Error("not_found");
      await ok(sb.from("docs").update({data:{...cur,...part},updated_at:new Date().toISOString()}).eq("col",col).eq("id",id));refresh();
    },
    async del(col,id){await ok(sb.from("docs").delete().eq("col",col).eq("id",id));refresh()},
    // Moves that touch more than one person run inside the database so nobody can fake them from the browser.
    async runDraw(l){await ok(sb.rpc("run_draw",{p_listing:l.id}));refresh()},
    async claim(l){const r=await ok(sb.rpc("claim_first_come",{p_listing:l.id}));refresh();return !!r},
    async releaseHold(h,mode,resR,resG){await ok(sb.rpc("release_hold",{p_hold:h.id,p_mode:mode,p_result_r:resR,p_result_g:resG}));refresh()},
    async creditGiver(h){await ok(sb.rpc("credit_giver",{p_hold:h.id}));refresh()}
  };
})();
