/*
 * Groundwork service worker — installable, offline-capable shell.
 *
 * Strategy:
 *   - Navigations → network-first (so a new deploy shows fresh content),
 *     falling back to the cached page, then to the precached /offline page.
 *   - Static assets (hashed _next/static, fonts, icons) → stale-while-revalidate
 *     (instant from cache, refreshed in the background).
 *
 * All URLs are resolved relative to the SW's own scope, so the same file works
 * whether the app is served from "/" (next dev) or "/groundwork/" (Pages) — no
 * hard-coded base path. Bump VERSION on each deploy to roll the cache.
 */
const VERSION = "v1";
const CACHE = `groundwork-${VERSION}`;

const scoped = (path) => new URL(path, self.registration.scope).toString();
const PRECACHE = ["", "offline/"].map(scoped); // app shell + offline fallback

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // only same-origin

  // Page navigations: network-first.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(scoped("offline/"))),
        ),
    );
    return;
  }

  // Everything else: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});

// Let the page tell a waiting SW to take over immediately (used after an update).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
