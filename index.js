// Cloudflare Worker entry. Static assets are served by the platform; this Worker only runs
// for /sitemap.xml (see "run_worker_first" in wrangler.jsonc) so the sitemap can be generated
// dynamically by the backend (it knows every scanned report) while staying on the main domain.

const FETCH_TIMEOUT_MS = 8000; // backend may be cold-starting; don't make crawlers wait long
const EDGE_TTL_SECONDS = 3600;

async function handleSitemap(request, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(new URL("/sitemap.xml", request.url).toString(), { method: "GET" });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const origin = (env.API_ORIGIN || "https://traceroot-be.onrender.com").replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${origin}/sitemap.xml`, {
      signal: controller.signal,
      headers: { Accept: "application/xml" },
    });
    const body = await upstream.text();
    const looksValid = upstream.ok && body.trimStart().startsWith("<?xml") && body.includes("<urlset");
    if (looksValid) {
      const response = new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": `public, max-age=600, s-maxage=${EDGE_TTL_SECONDS}`,
          "X-Sitemap-Source": "dynamic",
        },
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }
  } catch {
    // fall through to the static copy generated at build time
  } finally {
    clearTimeout(timer);
  }

  const fallback = await env.ASSETS.fetch(request);
  const headers = new Headers(fallback.headers);
  headers.set("Content-Type", "application/xml; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=300");
  headers.set("X-Sitemap-Source", "static-fallback");
  return new Response(fallback.body, { status: fallback.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      return handleSitemap(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};
