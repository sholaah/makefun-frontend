// serve.ts — a tiny zero-dependency static file server for fun.board.
//
// It serves the app/ directory, falls back to index.html for unknown
// paths so the hash-free deep links still load the SPA shell, and sets
// conservative cache headers: HTML is never cached, assets get an hour.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./app/", import.meta.url));

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function safeJoin(urlPath: string): string | null {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const full = join(root, clean);
  return full.startsWith(root) ? full : null;
}

async function sendFile(res: any, path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    if (!info.isFile()) return false;
    const body = await readFile(path);
    const type = MIME[extname(path)] ?? "application/octet-stream";
    const cache = path.endsWith(".html") ? "no-store" : "public, max-age=3600";
    res.writeHead(200, { "content-type": type, "cache-control": cache });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

export function startServer(port: number) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const wanted = url.pathname === "/" ? "/index.html" : url.pathname;
    const path = safeJoin(wanted);
    if (path && (await sendFile(res, path))) return;
    // SPA fallback: let the client router decide what to show.
    if (await sendFile(res, join(root, "index.html"))) return;
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
  server.listen(port);
  return {
    port,
    close: () => server.close(),
  };
}
