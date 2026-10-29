// Shardkin: Eight Realms — service worker. Keeps the game playable offline.
// The page itself is fetched fresh whenever there's a connection, so updates arrive as usual. The files it
// lists (scripts and styles with their ?v= numbers, icons, the manifest) are cached as they're used, so a new
// ?v= number fetches the new file once and keeps it. Fonts and the Firebase library are cached the same way.
// Nothing else is touched: online play and cloud saves always go straight to the network.
"use strict";
const CACHE = "shardkin";
const PAGE = new URL("./", self.registration.scope).href;
const CDN = url => url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" ||
  (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"));

// The local files a page refers to, from its src and href attributes.
function filesIn(html) {
  const out = new Set(["manifest.webmanifest"]);
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) if (!/^([a-z]+:)?\/\//i.test(m[1]) && !m[1].startsWith("mailto:")) out.add(m[1]);
  return [...out].map(u => new URL(u, PAGE).href);
}
// Saves the page and everything it needs, then drops cached copies the page no longer uses.
async function refresh(res) {
  const cache = await caches.open(CACHE), html = await res.clone().text(), files = filesIn(html);
  await cache.put(PAGE, res.clone());
  await Promise.all(files.map(async u => { if (!(await cache.match(u))) { try { const r = await fetch(u); if (r.ok) await cache.put(u, r); } catch (e) { /* fetched later */ } } }));
  const keep = new Set([PAGE, ...files]);
  for (const req of await cache.keys()) { const u = new URL(req.url); if (u.origin === location.origin && !keep.has(req.url)) await cache.delete(req); }
}

self.addEventListener("install", ev => {
  ev.waitUntil(fetch(PAGE, { cache: "no-store" }).then(res => (res.ok ? refresh(res) : null)).catch(() => null).then(() => self.skipWaiting()));
});
self.addEventListener("activate", ev => { ev.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate" && url.origin === location.origin) {
    // The page: fresh when online, the saved copy when offline.
    ev.respondWith(fetch(req, { cache: "no-store" }).then(res => {
      if (res.ok && new URL(res.url || req.url).pathname === new URL(PAGE).pathname) ev.waitUntil(refresh(res.clone()));
      return res;
    }).catch(async () => (await caches.match(PAGE)) || Response.error()));
    return;
  }
  if (url.origin !== location.origin && !CDN(url)) return;
  // Everything else it uses: the saved copy if there is one, otherwise the network, saving what comes back.
  ev.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); ev.waitUntil(caches.open(CACHE).then(c => c.put(req, copy))); }
    return res;
  })));
});
