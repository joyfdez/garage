const CACHE = "garage-shell-v1";

function isSkipped(url) {
  try {
    const u = new URL(url);
    return (
      u.pathname.startsWith("/api/") ||
      u.pathname.startsWith("/auth/") ||
      u.pathname.startsWith("/_next/") ||
      u.pathname.startsWith("/icons/")
    );
  } catch {
    return true;
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add("/"))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (isSkipped(request.url)) return;

  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match("/"))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  e.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((res) => {
        caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      });
      return cached || fresh;
    })
  );
});
