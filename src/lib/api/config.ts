/**
 * Official open-data API bases. The browser calls them directly: there is no
 * proxy or backend in between, so no server IP is exposed and every visitor
 * costs the government APIs exactly one request per browser fetch.
 */
export const CAMARA_BASE = "https://dadosabertos.camara.leg.br/api/v2";
export const SENADO_BASE = "https://legis.senado.leg.br/dadosabertos";
/**
 * e-Cidadania does not send CORS headers, so its JSON and pages are read
 * through the same-origin nginx reverse proxy (Vite proxies it in dev).
 */
export const ECIDADANIA_BASE = "/api/ecidadania";
/** The human-facing portal, always the official host. */
export const ECIDADANIA_SITE = "https://www12.senado.leg.br/ecidadania";
