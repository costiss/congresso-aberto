/**
 * e-Cidadania adapter.
 *
 * The Senate's participation portal has no open-data API: its "most popular
 * today" lists are small JSON endpoints and the detail pages are server-
 * rendered Plone HTML. The same-origin nginx reverse proxy fronts
 * `www12.senado.leg.br/ecidadania` so the browser can read both without CORS;
 * this adapter normalises the payloads and extracts the detail fields from the
 * page markup.
 */
import type { EcidadaniaDetalhe, EcidadaniaItem } from "../types";
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
