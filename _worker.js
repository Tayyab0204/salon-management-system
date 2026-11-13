// Cloudflare Pages advanced-mode gateway: direct-upload compatible.
// Configure BACKEND_ORIGIN=https://your-node-api.example.com in Pages settings.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "X-Robots-Tag": "noindex, nofollow"
    };

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const origin = String(env.BACKEND_ORIGIN || "").replace(/\/$/, "");
      if (!/^https:\/\/[^/]+$/i.test(origin)) {
        return new Response(JSON.stringify({
          success: false,
          message: "Salon backend is not configured. Contact the administrator."
        }), { status: 503, headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store", ...securityHeaders
        }});
      }
      const upstreamUrl = new URL(origin + url.pathname + url.search);
      const upstreamRequest = new Request(upstreamUrl, request);
      for (const name of ["host", "cf-connecting-ip", "x-forwarded-for", "x-forwarded-proto"]) {
        upstreamRequest.headers.delete(name);
      }
      try {
        const response = await fetch(upstreamRequest);
        const headers = new Headers(response.headers);
        headers.delete("set-cookie");
        headers.set("Cache-Control", "no-store");
        for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value);
        return new Response(response.body, { status: response.status, headers });
      } catch {
        return new Response(JSON.stringify({
          success: false, message: "Salon backend is temporarily unavailable."
        }), { status: 502, headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store", ...securityHeaders
        }});
      }
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value);
    if (url.pathname.endsWith(".html") || url.pathname === "/") {
      headers.set("Cache-Control", "no-cache, must-revalidate");
    }
    return new Response(response.body, { status: response.status, headers });
  }
};
