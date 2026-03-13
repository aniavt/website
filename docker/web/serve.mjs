/**
 * Wrapper that serves static assets from dist/client (/_astro/, /images/, favicon)
 * then delegates to the Astro SSR handle. Use this instead of entry.mjs so that
 * CSS and hashed assets resolve (astro-bun only serves paths as /path/index.html).
 */
import { join } from "path";
import { pathToFileURL } from "url";

const MIME = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function getMime(pathname) {
  const ext = pathname.slice(pathname.lastIndexOf("."));
  return MIME[ext] ?? "application/octet-stream";
}

// Must run from repo root (e.g. /app in Docker) so dist/server/entry.mjs resolves
const root = process.cwd();
const clientDir = join(root, "dist", "client");

const entryPath = join(root, "dist", "server", "entry.mjs");
const { handle } = await import(pathToFileURL(entryPath).href);

const port = parseInt(process.env.PORT ?? "80", 10);

Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (
      pathname.startsWith("/_astro/") ||
      pathname.startsWith("/images/") ||
      pathname === "/favicon.svg"
    ) {
      const filePath = join(clientDir, pathname);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": getMime(pathname) },
        });
      }
    }

    return handle(req);
  },
  error(err) {
    console.error(err);
    return new Response(`<pre>${err.message}\n${err.stack}</pre>`, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`SSR server listening on port ${port}`);
