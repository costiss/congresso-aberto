/**
 * Official open-data API bases. The browser calls them directly: there is no
 * proxy or backend in between, so no server IP is exposed and every visitor
 * costs the government APIs exactly one request per browser fetch.
 */
export const CAMARA_BASE = "https://dadosabertos.camara.leg.br/api/v2";
export const SENADO_BASE = "https://legis.senado.leg.br/dadosabertos";
