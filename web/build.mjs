// Builds the two flavors of the site from web/src.
//   node web/build.mjs
//   web/app.js         shared app (loaded by the public site)
//   web/index.html     public site (Supabase backend)
//   web/dist/pilot.html  one self-contained file for the invite-only pilot (Claude artifact backend)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const rd = (p) => readFileSync(join(root, p), "utf8");
const wr = (p, s) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), s); };

const app = `(function(){\n${["_data", "_state", "_render", "_actions"].map((n) => rd(`src/${n}.js`)).join("\n")}\n})();\n`;
wr("app.js", app);

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600&display=swap">`;
const shell = `<div class="app">
  <aside class="side">
    <div class="logo"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 14c1.5-3 3.5-4.5 6-4.5s4.5 1.500 6 4.500"/><circle cx="12" cy="17.500" r="1" fill="currentColor"/></svg></span>Bumpalong<small>Free baby gear, shared</small></div>
    <nav class="nav" id="nav" aria-label="Main"></nav>
    <div class="wallet-mini" id="walletMini"></div>
  </aside>
  <main id="main"></main>
</div>
<div class="toast" id="toast" hidden></div>`;
const desc = "Give and get pregnancy, postpartum and baby items free from neighbors.";

wr("index.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${desc}">
<title>Bumpalong</title>
${fonts}
<link rel="stylesheet" href="styles.css">
</head>
<body>
${shell}
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="config.js"></script>
<script src="src/backend-supabase.js"></script>
<script src="app.js"></script>
</body>
</html>
`);

// The artifact viewer wraps the page in its own document, so this file has no <html>, <head> or <body>.
wr("dist/pilot.html", `<meta name="description" content="${desc}">
<title>Bumpalong</title>
${fonts}
<style>
${rd("styles.css")}
</style>
${shell}
<script>
${rd("src/backend-artifact.js")}
</script>
<script>
${app}
</script>
`);
console.log("built app.js, index.html, dist/pilot.html");
