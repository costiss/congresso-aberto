import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import path from 'path'

const ECIDADANIA_ORIGIN = "https://www12.senado.leg.br";
const ECIDADANIA_PATH = "/ecidadania";
const DEV_PROXY_PATH = "/api/ecidadania";
const DEV_CACHE_TTL = 5 * 60 * 1000;
const DEV_TIMEOUT = 20_000;

interface CachedResponse {
  at: number;
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

function responseHeaders(upstream: Response, bodyLength: number): Record<string, string> {
  const headers: Record<string, string> = {};
  upstream.headers.forEach((value, key) => {
    if (
      ["set-cookie", "content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive"].includes(
        key.toLowerCase()
      )
    ) {
      return;
    }
    headers[key] = value;
  });
  headers["content-length"] = String(bodyLength);
  headers["cache-control"] = "public, max-age=300";
  return headers;
}

/**
 * Dev mirror of the production nginx proxy. Vite's http-proxy reuses a stuck
 * upstream keep-alive socket and hangs on the e-Cidadania pages, so this uses
 * Node's fetch instead, retries once and keeps a five-minute in-memory cache.
 */
function ecidadaniaDevProxy(): Plugin {
  const cache = new Map<string, CachedResponse>();

  return {
    name: "ecidadania-dev-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(DEV_PROXY_PATH, async (req, res) => {
        if (req.method !== "GET") {
          res.writeHead(405, { allow: "GET" });
          res.end();
          return;
        }

        const pathname = (req.url ?? "/").replace(/^\/?/, "/");
        const target = new URL(`${ECIDADANIA_ORIGIN}${ECIDADANIA_PATH}${pathname}`);
        const accept = String(req.headers.accept ?? "*/*");
        const key = `${target.toString()}|${accept}`;
        const cached = cache.get(key);
        const now = Date.now();

        if (cached && now - cached.at < DEV_CACHE_TTL) {
          res.writeHead(cached.status, { ...cached.headers, "x-cache-status": "HIT" });
          res.end(cached.body);
          return;
        }

        const buscar = () =>
          fetch(target, {
            headers: { accept, "user-agent": "congresso-aberto/1.0" },
            signal: AbortSignal.timeout(DEV_TIMEOUT),
            redirect: "follow",
          });

        try {
          let upstream: Response | undefined;
          let lastError: unknown;
          for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
              upstream = await buscar();
              if (upstream.status >= 500 && attempt === 0) continue;
              break;
            } catch (error) {
              lastError = error;
            }
          }
          if (!upstream) throw lastError ?? new Error("upstream unavailable");

          const body = Buffer.from(await upstream.arrayBuffer());
          const headers = responseHeaders(upstream, body.length);
          if (upstream.ok) cache.set(key, { at: now, status: upstream.status, headers, body });

          res.writeHead(upstream.status, {
            ...headers,
            "x-cache-status": upstream.ok ? "MISS" : "BYPASS",
          });
          res.end(body);
        } catch (error) {
          if (cached) {
            res.writeHead(cached.status, { ...cached.headers, "x-cache-status": "STALE" });
            res.end(cached.body);
            return;
          }
          res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
          res.end(`e-Cidadania upstream unavailable: ${(error as Error).message}`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ecidadaniaDevProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
