// Backend for the invite-only pilot published as a Claude artifact. Sign-in is the viewer's claude.ai
// account (the "user" capability) and shared data lives in the artifact's "db" capability.
window.__bumpBackend=(function(){
  let db=null;
  const clean=o=>JSON.parse(JSON.stringify(o));
  const ref=(c,id)=>db.doc(c+"/"+id);
  return {
    modeNote:"Invite-only pilot. Everything here is shared live with the people you invited.",
    async init(){
      const claude=window.claude;
      if(!claude||!claude.use) return null;
      const user=await claude.use("user"); db=await claude.use("db");
      if(!user||!db) return null;
      const me=await user.me();
      if(!me||!me.id) return null;
      return {id:String(me.id).replace(/[^A-Za-z0-9_-]/g,"-"),name:me.name||""};
    },
    signInHtml(){
      return `<div class="panel stack"><h1>Sign in to join</h1><p class="muted">This pilot runs inside Claude. Sign in to claude.ai, then open the link you were sent. If you're signed in and still see this, ask the organizer to share the page with you with edit access.</p></div>`;
    },
    watch(col,cb,err){db.collection(col).onSnapshot(s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),err)},
    async get(col,id){const s=await ref(col,id).get();return s.exists?{id:s.id,...s.data()}:null},
    set(col,id,data){return ref(col,id).set(clean(data))},
    patch(col,id,data){return ref(col,id).update(clean(data))},
    del(col,id){return ref(col,id).delete()}
  };
})();
