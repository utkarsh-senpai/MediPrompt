/// <reference lib="webworker" />

// MediPrompt service worker (v0.2). Only fixed, build-manifest assets are cached.
// Bump CACHE_FORMAT whenever cache semantics change independently of an asset build.

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST?: { url: string; revision?: string | null }[];
};

const APP_PREFIX = "mediprompt-";
const CACHE_FORMAT = "2";
const PACK_PATH = "packs/demo-interaction-fixture.json";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_PACK_BYTES = 512 * 1024;

const scopeUrl = new URL(self.registration.scope);
const indexUrl = new URL("index.html", scopeUrl).href;
const packUrl = new URL(PACK_PATH, scopeUrl).href;
const injectedManifest = self.__WB_MANIFEST ?? [];

function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const manifestIdentity = injectedManifest
  .map((entry) => `${entry.url}:${entry.revision ?? "hashed"}`)
  .sort()
  .join("|");
const CACHE_NAME = `${APP_PREFIX}v0.2-${CACHE_FORMAT}-${shortHash(manifestIdentity)}`;

const precacheUrls = new Set(
  [...injectedManifest.map((entry) => new URL(entry.url, scopeUrl).href), indexUrl, packUrl],
);

function isInScope(url: URL): boolean {
  return url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname);
}

function isHandledGet(request: Request): boolean {
  try {
    const url = new URL(request.url);
    return request.method === "GET" && !request.headers.has("range") && isInScope(url);
  } catch {
    return false;
  }
}

function declaredLength(response: Response): number | null {
  const raw = response.headers.get("content-length");
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

async function isSafeResponse(
  response: Response,
  expectedUrl: string,
  kind: "asset" | "html" | "pack",
): Promise<boolean> {
  if (
    response.status !== 200 ||
    response.redirected ||
    (response.type !== "basic" && response.type !== "default")
  ) {
    return false;
  }
  const finalUrl = response.url ? new URL(response.url) : new URL(expectedUrl);
  if (!isInScope(finalUrl)) return false;
  if (kind !== "html" && finalUrl.href !== expectedUrl) return false;

  const length = declaredLength(response);
  const limit = kind === "pack" ? MAX_PACK_BYTES : MAX_RESPONSE_BYTES;
  if (length !== null && length > limit) return false;

  if (kind === "html") {
    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("text/html");
  }
  if (kind === "pack") {
    try {
      const text = await response.clone().text();
      if (new TextEncoder().encode(text).byteLength > MAX_PACK_BYTES) return false;
      const value = JSON.parse(text) as Record<string, unknown>;
      const review = value["review"] as Record<string, unknown> | undefined;
      return (
        value["schemaVersion"] === "1.0" &&
        value["packId"] === "demo-interaction-fixture" &&
        review?.["status"] === "APPROVED"
      );
    } catch {
      return false;
    }
  }
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await caches.delete(CACHE_NAME);
      const cache = await caches.open(CACHE_NAME);
      try {
        for (const url of precacheUrls) {
          const parsed = new URL(url);
          if (!isInScope(parsed)) throw new Error("precache URL escaped the app scope");
          const response = await fetch(
            new Request(url, { cache: "reload", credentials: "same-origin" }),
          );
          const kind = url === packUrl ? "pack" : url === indexUrl ? "html" : "asset";
          if (!(await isSafeResponse(response, url, kind))) {
            throw new Error(`unsafe precache response: ${parsed.pathname}`);
          }
          await cache.put(url, response);
        }
      } catch (error) {
        // A unique staging cache makes installation atomic with respect to the
        // active worker. Delete partial data and reject install; the old worker stays.
        await caches.delete(CACHE_NAME);
        throw error;
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(APP_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data as { type?: unknown } | null;
  if (data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!isHandledGet(request)) return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (url.href === packUrl) {
    event.respondWith(cacheFirst(request, packUrl, "pack"));
    return;
  }
  if (precacheUrls.has(url.href)) {
    event.respondWith(cacheFirst(request, url.href, "asset"));
  }
  // Unknown same-origin requests pass through untouched and are never cached.
});

async function currentCache(): Promise<Cache> {
  return caches.open(CACHE_NAME);
}

async function networkFirstNavigation(request: Request): Promise<Response> {
  const cache = await currentCache();
  try {
    const fresh = await fetch(request);
    if (await isSafeResponse(fresh, request.url, "html")) {
      await cache.put(indexUrl, fresh.clone());
    }
    return fresh;
  } catch {
    return (await cache.match(indexUrl)) ?? Response.error();
  }
}

async function cacheFirst(
  request: Request,
  cacheKey: string,
  kind: "asset" | "pack",
): Promise<Response> {
  const cache = await currentCache();
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (await isSafeResponse(fresh, cacheKey, kind)) {
      await cache.put(cacheKey, fresh.clone());
    }
    return fresh;
  } catch {
    return Response.error();
  }
}
