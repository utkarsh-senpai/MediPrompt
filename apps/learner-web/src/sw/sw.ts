/// <reference lib="webworker" />

// MediPrompt service worker (v0.2).
// Rules (docs/V0.2_DEVELOPMENT_CONTEXT.md §11):
//  - precache a fixed, build-generated manifest of same-origin hashed assets + the pack
//  - handle only same-origin GET; never POST / range / cross-origin / opaque
//  - network-first for navigations and the pack, cache-first for immutable hashed assets
//  - activation deletes only older caches with this app's prefix
//  - no automatic mid-session takeover; the app prompts for refresh on update

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST?: { url: string; revision?: string }[];
};

const APP_PREFIX = "mediprompt-";
const CACHE_NAME = `${APP_PREFIX}v0.2.0`;
const PACK_PATH = "packs/demo-interaction-fixture.json";

const scope = self.registration.scope;
const indexUrl = new URL("index.html", scope).href;
const packUrl = new URL(PACK_PATH, scope).href;

function isSameOriginGet(request: Request): boolean {
  try {
    const url = new URL(request.url);
    return request.method === "GET" && url.origin === self.location.origin;
  } catch {
    return false;
  }
}

function isImmutableAsset(pathname: string): boolean {
  return (
    /[.-][a-f0-9]{8,}\.(js|css|svg|woff2?|json|webmanifest)$/.test(pathname) ||
    pathname.endsWith(".js")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const manifest = self.__WB_MANIFEST ?? [];
      const urls = manifest.map((m) => m.url);
      // Atomic-ish: if addAll fails, the previous cache remains usable.
      await cache.addAll([...urls, indexUrl, packUrl]).catch(() => {
        /* keep previous cache on partial failure */
      });
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith(APP_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      );
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!isSameOriginGet(request)) return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, indexUrl));
    return;
  }

  if (url.pathname === new URL(packUrl).pathname) {
    event.respondWith(networkFirst(request, packUrl));
    return;
  }

  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request, undefined));
});

async function networkFirst(request: Request, fallbackKey?: string): Promise<Response> {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached =
      (await caches.match(request)) ??
      (fallbackKey ? await caches.match(fallbackKey) : undefined);
    return cached ?? Response.error();
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    return Response.error();
  }
}
