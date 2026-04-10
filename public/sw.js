const CACHE_NAME = "mil-range-finder-v3";
const APP_SHELL_CACHE = [
  "/",
  "/guide",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/maskable-icon.svg",
];

function isSuccessfulResponse(response) {
  return Boolean(response && response.ok);
}

async function putInCache(request, response) {
  if (!isSuccessfulResponse(response)) {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackPath = "/") {
  try {
    const response = await fetch(request);
    return await putInCache(request, response);
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return caches.match(fallbackPath);
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const networkResponsePromise = fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkResponsePromise;
  if (networkResponse) {
    return networkResponse;
  }

  return Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_CACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

          return Promise.resolve();
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigationRequest = request.mode === "navigate";
  const isNextStaticAsset = url.pathname.startsWith("/_next/static/");
  const isAppShellAsset =
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico" ||
    url.pathname.startsWith("/icons/");

  if (isNavigationRequest) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isNextStaticAsset || isAppShellAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
