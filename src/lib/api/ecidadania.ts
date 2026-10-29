/**
 * e-Cidadania adapter.
 *
 * The Senate's participation portal has no open-data API: its "most popular
 * today" lists are small JSON endpoints, the full listings and detail pages
 * are server-rendered Plone HTML. The same-origin nginx reverse proxy fronts
 * `www12.senado.leg.br/ecidadania` so the browser can read all of them without
 * CORS; this adapter normalises the payloads and extracts the fields from the
 * page markup.
 */
import type { EcidadaniaDetalhe, EcidadaniaItem, EcidadaniaPagina, EcidadaniaTipo } from "../types";
import { ECIDADANIA_BASE, SENADO_BASE } from "./config";
import { ApiError, getJson, getText } from "./http";

interface RawIdeiaPopular {
  id: number;
  titulo: string;
  apoiamentos: string;
  count: string;
  dataLimite: string;
  habilitadaVotacao: boolean;
  porcentagemFavor: number;
}

interface RawConsultaPopular {
  id: number;
  identificacaoBasica: string;
  ementa: string;
  votosFavor: string;
  votosContra: string;
  totalVotos: string;
  totalVotosRecentes: string;
  porcentagemFavor: number;
}

const META_IDEIA = 20_000;

/** "1.234.567" and "48,12%" both become numbers. */
function numeroBR(value?: string | number | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const limpo = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? n : 0;
}

function texto(el?: Element | null): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function percentual(styleWidth?: string | null, fallback = 0): number {
  if (!styleWidth) return fallback;
  const n = Number.parseFloat(styleWidth.replace("%", "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function mapIdeia(r: RawIdeiaPopular): EcidadaniaItem {
  return {
    id: r.id,
    tipo: "ideia",
    titulo: r.titulo,
    apoios: numeroBR(r.apoiamentos),
    meta: META_IDEIA,
    recentes: numeroBR(r.count),
    percentual: Math.max(0, r.porcentagemFavor),
    prazo: r.dataLimite,
    aberta: r.habilitadaVotacao,
  };
}

function mapConsulta(r: RawConsultaPopular): EcidadaniaItem {
  return {
    id: r.id,
    tipo: "consulta",
    titulo: r.identificacaoBasica,
    identificacao: r.identificacaoBasica,
    descricao: r.ementa,
    votosFavor: numeroBR(r.votosFavor),
    votosContra: numeroBR(r.votosContra),
    totalVotos: numeroBR(r.totalVotos),
    recentes: numeroBR(r.totalVotosRecentes),
    percentual: Math.max(0, Math.min(100, r.porcentagemFavor)),
  };
}

/** Ideas with the most confirmed supports in the last 24 hours. */
export async function getEcidadaniaIdeias(): Promise<EcidadaniaItem[]> {
  const raw = await getJson<RawIdeiaPopular[]>(`${ECIDADANIA_BASE}/restcolecaomaisideia`);
  return (raw ?? []).map(mapIdeia);
}

/** Public consultations with the most votes in the last 24 hours. */
export async function getEcidadaniaConsultas(): Promise<EcidadaniaItem[]> {
  const raw = await getJson<RawConsultaPopular[]>(`${ECIDADANIA_BASE}/restcolecaomaismateria`);
  return (raw ?? []).map(mapConsulta);
}

/* --------------------- full, paginated listings --------------------- */

/** "8 de novembro de 2017" from a listing's status paragraph. */
function dataPorExtenso(text: string): string | undefined {
  return text.match(/(\d{1,2} de [a-zà-ú]+ de \d{4})/i)?.[1];
}

/** The last page number from the portal's pagination bar. */
function totalDePaginas(doc: Document, pagina: number): number {
  const ultima = doc.querySelector<HTMLAnchorElement>('a.page-link[title="último"]');
  const daUltima = Number(/[?&]p=(\d+)/.exec(ultima?.getAttribute("href") ?? "")?.[1]);
  if (daUltima > 0) return daUltima;

  let maior = pagina;
  for (const link of doc.querySelectorAll<HTMLAnchorElement>("ul.pagination a.page-link")) {
    const n = Number(/[?&]p=(\d+)/.exec(link.getAttribute("href") ?? "")?.[1]);
    if (n > maior) maior = n;
  }
  return maior;
}

function parseItensIdeia(doc: Document): EcidadaniaItem[] {
  return [...doc.querySelectorAll("li.resumo-ideia")].flatMap((li) => {
    const href = li.querySelector<HTMLAnchorElement>('a[href*="visualizacaoideia"]')?.getAttribute("href") ?? "";
    const id = Number(/[?&]id=(\d+)/.exec(href)?.[1]);
    const titulo = texto(li.querySelector("h4"));
    if (!id || !titulo) return [];

    const apoios = numeroBR(texto(li.querySelector(".contabilizacao")));
    const metaTexto = texto(li.querySelector(".grafico-legenda span:not(.contabilizacao)"));
    const meta = numeroBR(/meta de ([\d.]+)/i.exec(metaTexto)?.[1]) || META_IDEIA;
    const barra = li.querySelector<HTMLElement>(".part-barra");
    const situacao = texto(li.querySelector("p"));

    return [
      {
        id,
        tipo: "ideia" as const,
        titulo,
        apoios,
        meta,
        recentes: 0,
        percentual: percentual(barra?.style.width, meta > 0 ? (apoios / meta) * 100 : 0),
        prazo: dataPorExtenso(situacao),
        aberta: /abertos?\s+até/i.test(situacao)
          ? true
          : /encerraram/i.test(situacao)
            ? false
            : undefined,
      },
    ];
  });
}

function parseItensConsulta(doc: Document): EcidadaniaItem[] {
  return [...doc.querySelectorAll("div.resumo-materia")].flatMap((el) => {
    const href = el.querySelector<HTMLAnchorElement>('header a[href*="visualizacaomateria"]')?.getAttribute("href") ?? "";
    const id = Number(/[?&]id=(\d+)/.exec(href)?.[1]);
    if (!id) return [];

    const identificacao = texto(el.querySelector("header a"));
    const descricao = texto(el.querySelector("section a")) || texto(el.querySelector("section"));
    const votos = [...el.querySelectorAll("figure header span")].map(texto);
    const votosFavor = numeroBR(votos[0]);
    const votosContra = numeroBR(votos[1]);
    const totalVotos = votosFavor + votosContra;
    const barra = el.querySelector<HTMLElement>("figure section div");

    return [
      {
        id,
        tipo: "consulta" as const,
        titulo: identificacao || "Consulta pública",
        identificacao: identificacao || undefined,
        descricao: descricao || undefined,
        votosFavor,
        votosContra,
        totalVotos,
        recentes: 0,
        percentual: percentual(barra?.style.width, totalVotos > 0 ? (votosFavor / totalVotos) * 100 : 0),
        // The default listing only returns propositions still open for votes.
        aberta: true,
      },
    ];
  });
}

const TIPOS_CONSULTA = new Set([
  "ECD",
  "EDS",
  "MPV",
  "PDL",
  "PDS",
  "PEC",
  "PL",
  "PLC",
  "PLP",
  "PLS",
  "PLV",
  "PRS",
  "SCD",
  "SDS",
  "SUG",
]);

/**
 * The listing forms accept different search parameters per section. Ideas
 * search their title; consultations search by proposition number, year or
 * author. A free text that looks like a proposition code is split into the
 * portal's `tipo`/`numero`/`ano` fields.
 */
function parametrosDeBusca(tipo: EcidadaniaTipo, busca: string): Record<string, string> {
  const termo = busca.trim();
  if (!termo) return {};
  if (tipo === "ideia") return { pesquisa: termo };

  const codigo = /^([A-Za-z]{2,5})\s*(\d{1,6})(?:\s*\/\s*(\d{4}))?$/.exec(termo);
  const sigla = codigo?.[1].toUpperCase();
  if (codigo && sigla && TIPOS_CONSULTA.has(sigla)) {
    return {
      tipo: sigla,
      numero: codigo[2],
      ...(codigo[3] ? { ano: codigo[3] } : {}),
    };
  }
  if (/^(19|20)\d{2}$/.test(termo)) return { ano: termo };
  if (/^\d{1,6}$/.test(termo)) return { numero: termo };
  return { nomeAutor: termo };
}

/**
 * One page of the full portal listing, 100 items at a time. The ideas page
 * (`pesquisaideia`) contains every idea ever submitted; the consultations page
 * (`pesquisamateria`) lists the propositions currently open for voting.
 */
export async function getEcidadaniaPagina(
  tipo: EcidadaniaTipo,
  pagina = 1,
  busca = ""
): Promise<EcidadaniaPagina> {
  const alvo = Math.max(1, Math.trunc(pagina) || 1);
  const caminho = tipo === "ideia" ? "pesquisaideia" : "pesquisamateria";
  const params = new URLSearchParams({ p: String(alvo) });
  for (const [chave, valor] of Object.entries(parametrosDeBusca(tipo, busca))) {
    params.set(chave, valor);
  }
  const html = await getText(`${ECIDADANIA_BASE}/${caminho}?${params}`, undefined, 25_000);
  const doc = new DOMParser().parseFromString(html, "text/html");

  return {
    tipo,
    pagina: alvo,
    totalPaginas: totalDePaginas(doc, alvo),
    items: tipo === "ideia" ? parseItensIdeia(doc) : parseItensConsulta(doc),
  };
}

function parseIdeia(html: string, id: number): EcidadaniaDetalhe {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const raiz = doc.querySelector("#ideia-legislativa");
  if (!raiz) throw new ApiError("Ideia não encontrada no e-Cidadania.", 404);

  const titulo =
    texto(raiz.querySelector(".col-sm-12 > b > div")) ||
    texto(raiz.querySelector("b > div")) ||
    "Ideia legislativa";
  const descricao = texto(raiz.querySelector(".col-sm-12 > b + div"));
  const apoios = numeroBR(texto(raiz.querySelector(".contabilizacao")));
  const barra = raiz.querySelector<HTMLElement>(".part-barra");
  const pct = percentual(barra?.style.width, numeroBR(texto(barra)));
  const prazo = texto(raiz).match(/receber apoios até\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1];

  const autorP = [...raiz.querySelectorAll("p")].find((p) => /ideia proposta por/i.test(texto(p)));
  const autor = texto(autorP?.querySelector("strong")).replace(/\s*\(/g, " (") || undefined;
  const dataPublicacao = raiz.querySelector("time")?.getAttribute("datetime") ?? undefined;

  const contagem = texto(raiz.querySelector(".legenda-grafico-ideia-qm")).match(/meta de ([\d.]+)/i)?.[1];
  const meta = contagem ? numeroBR(contagem) : META_IDEIA;

  return {
    id,
    tipo: "ideia",
    titulo,
    descricao: descricao || titulo,
    apoios,
    meta,
    recentes: 0,
    percentual: pct || (meta > 0 ? Math.min(100, (apoios / meta) * 100) : 0),
    prazo,
    aberta: !!raiz.querySelector(".ideia-btn-apoio"),
    autor,
    dataPublicacao,
    atualizadoEm: dataPublicacao,
  };
}

function parseConsulta(html: string, id: number): EcidadaniaDetalhe {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const raiz = doc.querySelector("#materia-legislativa");
  if (!raiz) throw new ApiError("Consulta não encontrada no e-Cidadania.", 404);

  const identificacao = texto(raiz.querySelector(".materia-identificacao section span"));
  const tituloCompleto = texto(raiz.querySelector(".materia-identificacao header"));
  const secoes = [...raiz.querySelectorAll(".materia-autor")];
  const autor = secoes
    .map(texto)
    .find((t) => /^autoria:/i.test(t))
    ?.replace(/^autoria:\s*/i, "")
    .trim();
  const ementa = secoes
    .map(texto)
    .find((t) => /^ementa:/i.test(t))
    ?.replace(/^ementa:\s*/i, "")
    .trim();
  const votosFavor = numeroBR(texto(raiz.querySelector(".contabilizacao-favor")));
  const votosContra = numeroBR(texto(raiz.querySelector(".contabilizacao-contra")));
  const total = votosFavor + votosContra;
  const barra = raiz.querySelector<HTMLElement>(".grafico-consulta-publica section div");
  const pct = percentual(barra?.style.width, total > 0 ? (votosFavor / total) * 100 : 0);
  const atualizadoEm = texto(raiz.querySelector("#msg-contabilizacao-voto")).replace(
    /^votos apurados até\s*/i,
    ""
  );

  const links = [...raiz.querySelectorAll<HTMLAnchorElement>("a.lnk")];
  const textoUrl = raiz.querySelector<HTMLAnchorElement>(".link-consulta-publica-box a.lnk")?.href;
  const tramitacaoUrl = links.find((a) => /ver tramitação/i.test(texto(a)))?.href;

  return {
    id,
    tipo: "consulta",
    titulo: identificacao || tituloCompleto || "Consulta pública",
    identificacao: identificacao || undefined,
    descricao: ementa || tituloCompleto || "",
    autor: autor || undefined,
    votosFavor,
    votosContra,
    totalVotos: total,
    recentes: 0,
    percentual: pct,
    aberta: !!raiz.querySelector("#barra-voto a[data-voto]"),
    atualizadoEm: atualizadoEm || undefined,
    textoUrl,
    tramitacaoUrl,
  };
}

/** The full official page, parsed into the same shape as the popular list. */
export async function getEcidadaniaDetalhe(
  tipo: EcidadaniaItem["tipo"],
  id: number
): Promise<EcidadaniaDetalhe> {
  const pagina = tipo === "ideia" ? "visualizacaoideia" : "visualizacaomateria";
  const html = await getText(`${ECIDADANIA_BASE}/${pagina}?id=${id}`, undefined, 20_000);
  return tipo === "ideia" ? parseIdeia(html, id) : parseConsulta(html, id);
}

/**
 * The rapporteur (relator) of a matter. e-Cidadania does not publish it, but
 * the Senate open data does — and that API sends CORS headers.
 */
interface RawRelatoria {
  nomeParlamentar?: string;
  siglaPartidoParlamentar?: string;
  ufParlamentar?: string;
  dataDestituicao?: string | null;
  dataFimColegiado?: string | null;
}

export async function getEcidadaniaRelator(id: number): Promise<string | null> {
  const raw = await getJson<RawRelatoria | RawRelatoria[]>(
    `${SENADO_BASE}/processo/relatoria?codigoMateria=${id}`
  );
  const lista = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const atuais = lista.filter((r) => !r.dataDestituicao && !r.dataFimColegiado);
  const nomes = atuais
    .map((r) => {
      if (!r.nomeParlamentar) return "";
      const partido = r.siglaPartidoParlamentar
        ? ` (${r.siglaPartidoParlamentar}${r.ufParlamentar ? `/${r.ufParlamentar}` : ""})`
        : "";
      return `${r.nomeParlamentar}${partido}`;
    })
    .filter(Boolean);
  return nomes.length ? [...new Set(nomes)].join(" · ") : null;
}
