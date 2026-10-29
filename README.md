# Congresso Aberto

A dark, editorial single-page app for following the Brazilian National Congress:
floor votes, agendas and the composition of the **Câmara dos Deputados**
and the **Senado Federal** — built from the official open-data APIs.

Layout and visual language follow [seuimposto.com](https://seuimposto.com/)'s
HUD: a fixed top bar with a pill switcher, three glass columns around a central
Brazil map, Faustina serif figures and a timeline dock at the bottom.

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** (design tokens in `src/index.css`)
- **Radix UI** primitives (`src/components/ui`)
- **TanStack Query** for caching, retries and background refresh
- State outlines from the IBGE malhas API, pre-projected into `src/lib/geo/brazilShapes.ts`

## Views

- **Votações** (`#/votacoes/<id>`) — the latest nominal floor vote by default.
  The vote is the centre of the page: verdict, plain-language title, score,
  required majority, what was being decided, and how each party voted. A bar
  on top goes back to the list and steps to the next newer/older vote. The
  left column is the menu (steps of this vote, latest votes) — while a floor is
  in session, the items still to be decided lead that latest-votes list, stamped
  **ao vivo** — and the map and the hemicycle sit in a small corner card that
  expands into a dialog.
- **Para leigos** (on the vote and inspect pages, collapsed by default, `leigos=1`)
  — where the proposal stands today (e.g. "virou a Lei Complementar 237/2026,
  com vetos parciais", from the Câmara/Senado status), what voting Sim or Não
  meant in this step, why that many votes were needed, what happens next,
  themes, authors, the full text and a glossary of the terms on the page.
- **Inspecionar** (`#/inspecionar/<id>`) — everything about one vote: what was
  voted, every vote category, quorum, each leader's orientation, a party or
  state table (with how faithfully each party followed its orientation) and
  the roll-call with name, party, state and vote filters plus CSV export.
  Party names in the panel and in the table jump to that party's members.
- **Parlamentar** (`#/parlamentar/camara-<id>` or `senado-<código>`) — a
  deputy's or senator's page: profile, authored bills (Câmara), and how they
  voted in every nominal floor vote of the period. It shows turnout, how often
  they followed their party (the leader's orientation, or the majority of the
  party when there is none) and the government (Câmara only), and each vote
  with their position, what party and government asked for, and divergences.
  Every member name in the app links here. A second tab, **Propostas de
  autoria** (`aba=propostas`), lists every bill they authored or co-authored
  (Câmara and Senado): totals by year and type, status in plain words
  ("virou lei", "aguardando a escolha de um relator"), filters by type, year,
  status (Senado) and text, and a "Ver votação" button that opens the bill's
  main vote inside the app.
- **Lista** (`#/lista`) — every floor deliberation of both houses in a period
  (30/90 days, a year or a custom date range picked on a calendar), faceted by
  result and bill type, with search and paging. A row opens the Votações panel on that vote. While a floor is in
  session, the items still to be decided head the list as its first rows,
  stamped **ao vivo**, ahead of the recorded deliberations.
- **Agenda** — upcoming and past Câmara events with their pauta. While either
  floor is in session, the left column shows that session's order paper live,
  refreshed on a timer and flagged by an **Ao vivo** badge in the header (naming
  the houses that are live). Each item carries its state: **decided** (with the
  announced verdict), **under consideration** (the item the floor is on, marked
  as the focal point), or **pending**. Only the decided items, the one on the
  floor and a few pending ones are listed, so the panel stays short on a phone.
  A **Pautas** tab lists every session that has an order paper in the period —
  both houses, live and past — each opening in place to its full pauta, so the
  official site is not needed to read it.
- **Participação** (`#/participacao`) — the e-Cidadania portal's most active
  ideas and public consultations in the last 24 hours. A switch toggles between
  the two; each row shows support progress or the SIM/NÃO split, activity in the
  last 24 hours, the support deadline, and the consultation's rapporteur.
  Opening a row shows the full text, the current tally and the link to
  participate on the official portal. Detail links are shareable:
  `#/participacao/ideia-<id>` and `#/participacao/consulta-<id>`.

Ctrl K searches deputies, senators and recent votes.

## URL parameters

Every filter lives in the hash query, so any screen can be linked as it is.
Defaults are left out of the URL.

| Route | Parameters |
| --- | --- |
| `#/votacoes/<id>` | `uf`, `modo=plenario`, `mapa=1` (map expanded), `nominal=1` (feed keeps only nominal votes), `chamada=1` (roll-call open), `voto` (`sim`, `nao`, …), `nome`, `data` (Senate session date) |
| `#/inspecionar/<id>` | `voto`, `partido`, `uf`, `nome`, `contra=1` (voted against the party), `ordem=partido\|uf\|voto`, `grupo=estado`, `secao=votos\|grupos` (scrolls to that section), `data` |
| `#/parlamentar/<id>` | `periodo=30d\|90d\|<ano>\|<ini>..<fim>`, `merito=0` (include procedural votes), `filtro=partido\|governo\|ausencias`, `q`; with `aba=propostas`: `tipo`, `ano`, `fase`, `busca`, `pagina` |
| `#/lista` | `casa=camara\|senado`, `periodo=30d\|90d\|<ano>\|<ini>..<fim>`, `tipo` (`PEC`, `PL`, …), `resultado=aprovada\|rejeitada\|outros`, `nominal=1`, `q`, `ordem=antigas`, `pagina` |
| `#/camara`, `#/senado` | `uf`, `partido`, `q` |
| `#/agenda` | `periodo=realizados`, `tipo=plenario\|comissoes` |
| `#/participacao` | `aba=ideias\|consultas` |
| `#/participacao/ideia-<id>`, `#/participacao/consulta-<id>` | `aba` (keeps the list behind the detail open) |

Example: `#/lista?casa=senado&periodo=2025&tipo=PEC&resultado=aprovada`.
Old links such as `#/pecs` are rewritten to their list equivalent.

One filter is a *preference*, not a link: **Só com votação nominal**. It is
remembered in `localStorage` (`congresso-aberto:nominal`), so the feed and the
list keep the visitor's choice between visits. When the URL carries `nominal`
explicitly, it wins for that screen — a shared link keeps its meaning — and the
value is only written back to the URL when it differs from the screen's default.

## How votes are read

- Titles are written in everyday language from the official summary
  (`src/lib/linguagem.ts`): legal boilerplate such as "Altera a Lei nº …, para"
  or "Dispõe sobre" is dropped, extra credits read "Crédito extra de R$ 10
  bilhões para …", urgency requests name the bill they speed up. The code
  (`PLP 74/2026`) stays visible as secondary text next to the type in words,
  and the official text is one click away.
- Each vote is labelled by what it decided (texto principal, emenda, destaque,
  urgência, redação final…), with a one-line explanation.

- A Câmara vote id is `{idProposicao}-{seq}`: the prefix is the bill being voted,
  even when the description cites another numbering (e.g. the Senate's).
- Votes are grouped into **deliberações** (same bill, same day); the principal
  one is the nominal merit vote, ahead of destaques and requerimentos.
- `aprovacao` is null for destaques ("Mantido o texto") and the description is
  the source of truth for the result.
- Senate results come from `resultadoVotacao`, and its roll-call is inline;
  codes such as `AP`, `LS`, `MIS`, `P-NRV` become absent/present-without-vote.
- Party orientations come from the party's own leader or, failing that, its
  federation (`Fdr PT-PCdoB-PV`). Bloc names are abbreviated by the API
  (`Bl UniPpPsd...`) and are not resolved to parties.
- The Câmara API caps date ranges at 3 months, so longer periods are fetched
  in quarterly windows; the Senate takes the whole range in one request.

## Data sources

| Source | Base URL | Notes |
| --- | --- | --- |
| Câmara dos Deputados | `https://dadosabertos.camara.leg.br/api/v2` | Deputies (513), parties, propositions, tramitações, autores, votações + votos, eventos + pauta. Sends `X-Total-Count`, used for historical counts. The plenary is live when an event reads `Em Andamento`; its order paper (`/eventos/{id}/pauta`) gives each item's `situacaoItem` and, once voted, its `uriVotacao`. |
| Senado Federal | `https://legis.senado.leg.br/dadosabertos` | Senators (81), senator votes, recent floor votes (`/votacao`), propositions (`/processo`) and the rapporteur of a matter (`/processo/relatoria?codigoMateria=…`). The day's plenário is live at `/plenario/agenda/dia/{AAAAMMDD}` (session status) and `/plenario/resultado/{AAAAMMDD}` (each item's result as it is decided). |
| e-Cidadania | `https://www12.senado.leg.br/ecidadania` (via `/api/ecidadania` on the same origin) | Popular ideas and public consultations (`restcolecaomaisideia`, `restcolecaomaismateria`), their detail pages, and the official links. The portal sends no CORS headers, so the app's nginx forwards `/api/ecidadania/*` to a host-network sidecar; Vite mirrors the proxy in development. |

The consultation's rapporteur is not in the e-Cidadania payload; it comes from
the Senate open-data `/processo/relatoria?codigoMateria=…`. A matter with no
open relatoria is shown as **aguardando designação**.

The Câmara and Senate APIs normally return `Access-Control-Allow-Origin: *`, so
the browser can call them directly. Some Câmara nodes intermittently omit the
header (the browser then reports a network error), so the fetch helper retries
bypassing the HTTP cache and the query client retries with backoff. The Câmara
API also rate-limits bursts, so the adapter runs its requests through a small
concurrency limiter.

Neither API pushes: "live" means polling. Both floors are polled every 30 s only
while a session is running (every 90 s otherwise, and never in a background tab),
and TanStack Query keeps each answer cached in the browser until its stale time
expires, so repeated renders and revisits reuse the data instead of fetching
again. The Câmara names the item on the floor directly (`situacaoItem`); the
Senate has no such field, so the first undecided item is taken as the one under
consideration. The nominal roll-call still only arrives once the vote is
recorded.

The API layer lives in `src/lib/api`:

- `camara.ts` / `senado.ts` — adapters that normalise the two very different
  payloads into the shared model in `src/lib/types.ts`.
- `ecidadania.ts` — normalises the portal's popular lists and parses the detail
  pages into the same model.
- `http.ts` — fetch helpers, `X-Total-Count` parsing and the limiter.

## Project structure

```
src/
├── components/
│   ├── hud/        header, search, Brazil map, feed, timeline dock, grid
│   ├── shared/     hemicycle, avatars, badges, states
│   ├── detail/     proposition / member sheets
│   └── ui/         Radix-based primitives
├── views/          votacoes, inspecao, lista, casa (Câmara/Senado), agenda, participacao
├── hooks/          TanStack Query hooks + hash router
└── lib/            api adapters, vote semantics, breakdowns, geo shapes
```

## Deployment

There is no application backend. The production build is a static site: nginx
serves the files and every visitor's browser calls the Câmara and Senate APIs
directly. The one exception is **e-Cidadania**, which sends no CORS headers:
the app's nginx forwards `/api/ecidadania/*` to a small **host-network nginx
sidecar** that talks to the portal and keeps a short in-memory cache.

- **Static app**: hashed `/assets/*` cached for a year, `index.html`
  revalidated, unknown paths fall back to `index.html` (see
  `deploy/nginx.conf`).
- **e-Cidadania sidecar**: the app's nginx forwards `/api/ecidadania/*` to
  `192.168.1.2:8084`, where `deploy/ecidadania-proxy.conf` runs. The sidecar
  runs on the host network because the portal's WAF blocks nginx requests
  coming from Docker's overlay network. It holds each URL for five minutes in
  a `/dev/shm` cache, collapses concurrent misses, caps the portal at two
  concurrent connections, and serves the last good copy when the portal is
  slow. The app's nginx applies the per-visitor limits (5 req/s, 8 concurrent,
  keyed by `CF-Connecting-IP` behind Cloudflare). Vite mirrors the proxy in
  development.
- **Client caching**: TanStack Query deduplicates and caches requests in the
  browser; the Câmara adapter also caps in-flight requests so a burst from one
  visitor does not trip the API's limiter.
- **Health check**: the container answers on `/` (there is no `/healthz`).

```bash
# App (static site + proxy to the sidecar)
docker build -t camara .
docker run -p 8080:8080 camara

# e-Cidadania sidecar (host network, port 8084)
docker build -f deploy/ecidadania-proxy.Dockerfile -t congresso-ecidadania-proxy .
docker run -d --name ecidadania-proxy --network host --restart unless-stopped congresso-ecidadania-proxy

npm run dev                           # Vite on :5173, with the e-Cidadania dev proxy
```

The app's `proxy_pass` points at `192.168.1.2:8084`; change that address in
`deploy/nginx.conf` if the host's LAN address changes. Firewall port 8084 so
only the host/Docker network can reach the sidecar.

### Dokploy behind Cloudflare

1. Create an application from this repository with build type **Dockerfile**
   (`./Dockerfile`); the container listens on `8080`.
2. Add the domain in Dokploy pointing to container port `8080`; enable HTTPS.
3. In Cloudflare, proxy the DNS record (orange cloud) and use SSL mode
   **Full (strict)**.
4. Create a **Compose** service in the same project/environment for the
   e-Cidadania sidecar:
   - Source: this GitHub repo, branch `main`.
   - Compose path: `deploy/dokploy-compose.yml`.
   - Compose type: `docker-compose` (not `stack`).
   - Enable auto-deploy.

   The compose file builds `deploy/ecidadania-proxy.Dockerfile` and runs it
   with `network_mode: host`, so it listens on the host's `8084`. The app's
   nginx reaches it at the host's LAN address.

The app can run multiple replicas; they all point at the single sidecar. The
cache is per-sidecar and is only a cache, not shared state. Cloudflare's cache
covers this site's own files; the Câmara and Senate API calls go from the
visitor's browser to the government domains, and only e-Cidadania passes
through the sidecar.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
```

No API keys are required. nginx (or Vite in development) proxies only
e-Cidadania, which does not send CORS headers; every other call goes from the
browser to the official open-data APIs. The production proxy to e-Cidadania is
the host-network sidecar described above.
