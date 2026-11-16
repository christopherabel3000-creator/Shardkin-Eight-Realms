// Shardkin: puts the game's own files in www/, the folder the iPhone app is built from
// (capacitor.config.json). The game on GitHub Pages is served straight from the repo, so this is
// only for the app. The service worker (sw.js) stays out: the app's files are already on the phone.
// Usage: node scripts/build-www.js
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "www");
const KEEP = ["index.html", "privacy.html", "support.html", "manifest.webmanifest", "css", "js", "fonts", "icons", "vendor"];
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const f of KEEP) fs.cpSync(path.join(ROOT, f), path.join(OUT, f), { recursive: true });
console.log("www/ ready: " + KEEP.join(", "));
