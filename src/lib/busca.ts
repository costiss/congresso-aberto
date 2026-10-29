/**
 * Search over votes and proposals.
 *
 * Two things matter here: free text should ignore accents, case and word
 * order, and a proposal code should match even when the reader types it
 * without the exact spacing or punctuation the API uses ("pl1234/2026" must
 * find "PL 1234/2026", and "LC 12" must find "PLP 12/2024").
 */

/** Accent- and case-insensitive form, for comparisons. */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Letters and digits only: "PL 1.234/2026" → "pl12342026". */
function compactar(s: string): string {
  return normalizar(s).replace(/[^a-z0-9]/g, "");
}

/** Siglas we read as a proposal code; anything else stays free text. */
const SIGLAS = new Set([
  "PEC", "PLP", "PL", "PLS", "PLC", "MPV", "PLV", "PDL", "PDC",
  "REQ", "MSC", "PLN", "PRC", "PRS", "PDS", "MP", "LC",
]);

/** What people type on the left, what the data calls it on the right. */
const SINONIMOS: Record<string, string[]> = {
  LC: ["PLP", "PLC"],
  PLP: ["PLP", "LC"],
  MP: ["MPV", "MP"],
  MPV: ["MPV", "MP"],
  PDC: ["PDL", "PDC"],
  PDL: ["PDL", "PDC"],
};

export interface CodigoBusca {
  tipo: string;
  /** Every sigla this code may appear as in the data. */
  tipos: string[];
  numero: string;
  ano?: number;
  /** Four digits were typed, so the year is safe to use as a filter. */
  anoCompleto: boolean;
}

interface CodigoNoTexto {
  tipo: string;
  numero: string;
  ano?: number;
}

const CODIGO_NO_TEXTO = /\b([A-Z]{2,5})\s*([\d.]{1,11})\s*\/\s*(\d{4})\b/gi;

function numeroLimpo(bruto: string): string {
  return bruto.replace(/\./g, "").replace(/^0+(?=\d)/, "");
}

/** Reads "PL 1234/2026", "pl1234", "PEC 5/2025" or "LC 12" as a proposal code. */
export function lerCodigoBusca(termo: string): CodigoBusca | null {
  const m = /^\s*([a-z]{2,5})[\s.-]*(\d{1,7}(?:\.\d{3})*)(?:[/.-]?\s*(\d{2,4}))?\s*$/i.exec(
    termo
  );
  if (!m) return null;
  const tipo = m[1].toUpperCase();
  if (!SIGLAS.has(tipo)) return null;
  const numero = numeroLimpo(m[2]);
  if (!numero) return null;
  const anoBruto = m[3];
  const ano = anoBruto
    ? anoBruto.length === 2
      ? 2000 + Number(anoBruto)
      : Number(anoBruto)
    : undefined;
  return {
    tipo,
    tipos: SINONIMOS[tipo] ?? [tipo],
    numero,
    ano: ano && ano >= 1900 && ano <= 2100 ? ano : undefined,
    anoCompleto: anoBruto?.length === 4,
  };
}

function codigosDe(texto: string): CodigoNoTexto[] {
  const out: CodigoNoTexto[] = [];
  for (const m of texto.matchAll(CODIGO_NO_TEXTO)) {
    const numero = numeroLimpo(m[2]);
    if (!numero) continue;
    out.push({ tipo: m[1].toUpperCase(), numero, ano: Number(m[3]) });
  }
  return out;
}

function combinaCodigo(busca: CodigoBusca, texto: string): boolean {
  const codigos = codigosDe(texto);
  if (codigos.length > 0) {
    return codigos.some(
      (c) =>
        busca.tipos.includes(c.tipo) &&
        c.numero === busca.numero &&
        (busca.ano === undefined || c.ano === busca.ano)
    );
  }
  // A code written without the year, or with an unusual separator, still
  // counts: compare the letters-and-digits form.
  const alvo = compactar(texto);
  const ano = busca.ano === undefined ? "" : String(busca.ano);
  return busca.tipos.some((t) => alvo.includes(`${t.toLowerCase()}${busca.numero}${ano}`));
}

/**
 * True when every word of `termo` appears in the joined fields, or when the
 * term is a proposal code that matches one of the codes in the fields.
 */
export function combinaBusca(
  campos: Array<string | null | undefined>,
  termo: string
): boolean {
  const q = termo.trim();
  if (!q) return true;
  const alvo = campos.filter(Boolean).join(" \n ");

  const codigo = lerCodigoBusca(q);
  if (codigo) return combinaCodigo(codigo, alvo);

  const palavras = normalizar(q).split(/\s+/).filter(Boolean);
  const texto = normalizar(alvo);
  return palavras.every((palavra) => texto.includes(palavra));
}
