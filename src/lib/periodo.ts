import { addDays, formatDate, isoDate } from "./format";

export interface Intervalo {
  ini: string;
  fim: string;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** A named time window (last N days or a calendar year) or a custom range. */
export class Periodo implements Intervalo {
  static readonly PADRAO = "90d";
  /** Separates the ends of a custom range in the URL: `2026-01-01..2026-03-31`. */
  static readonly SEPARADOR = "..";
  private static readonly DIAS: Record<string, number> = { "30d": 30, "90d": 90 };

  readonly valor: string;
  readonly label: string;
  readonly ini: string;
  readonly fim: string;

  private constructor(valor: string, label: string, ini: string, fim: string) {
    this.valor = valor;
    this.label = label;
    this.ini = ini;
    this.fim = fim;
  }

  static opcoes(hoje = new Date()): Periodo[] {
    const ano = hoje.getFullYear();
    return [
      ...Object.keys(Periodo.DIAS).map((v) => Periodo.de(v, hoje)),
      ...[0, 1, 2, 3].map((i) => Periodo.de(String(ano - i), hoje)),
    ];
  }

  static de(valor: string, hoje = new Date()): Periodo {
    const intervalo = Periodo.intervaloDe(valor);
    if (intervalo) return intervalo;

    const dias = Periodo.DIAS[valor];
    if (dias) return new Periodo(valor, `${dias} dias`, isoDate(addDays(hoje, -(dias - 1))), isoDate(hoje));
    const ano = Number(valor);
    if (/^\d{4}$/.test(valor) && ano >= 2000 && ano <= hoje.getFullYear()) {
      const fim = ano === hoje.getFullYear() ? isoDate(hoje) : `${ano}-12-31`;
      return new Periodo(valor, valor, `${ano}-01-01`, fim);
    }
    return Periodo.de(Periodo.PADRAO, hoje);
  }

  /** A custom window between two dates, ends inclusive. */
  static intervalo(inicio: Date, fim: Date): Periodo {
    const [ini, termino] = [isoDate(inicio), isoDate(fim)].sort();
    return new Periodo(
      `${ini}${Periodo.SEPARADOR}${termino}`,
      rotuloIntervalo(ini, termino),
      ini,
      termino
    );
  }

  private static intervaloDe(valor: string): Periodo | null {
    const [ini, fim] = valor.split(Periodo.SEPARADOR);
    if (!ini || !fim || !ISO.test(ini) || !ISO.test(fim) || !dataValida(ini) || !dataValida(fim)) return null;
    const [a, b] = ini <= fim ? [ini, fim] : [fim, ini];
    return new Periodo(valor, rotuloIntervalo(a, b), a, b);
  }

  /** Splits the window into pieces the Câmara API accepts (at most 3 months each). */
  janelasTrimestrais(): Intervalo[] {
    const out: Intervalo[] = [];
    let ini = new Date(`${this.ini}T12:00:00`);
    const fim = new Date(`${this.fim}T12:00:00`);
    while (ini <= fim) {
      const limite = new Date(ini);
      limite.setMonth(limite.getMonth() + 3);
      const corte = addDays(limite, -1) < fim ? addDays(limite, -1) : fim;
      out.push({ ini: isoDate(ini), fim: isoDate(corte) });
      ini = addDays(corte, 1);
    }
    return out;
  }
}

function dataValida(iso: string): boolean {
  const d = new Date(`${iso}T12:00:00`);
  return !Number.isNaN(d.getTime()) && isoDate(d) === iso;
}

/** "01/01/2026 – 31/03/2026", shortened to "01/01 – 31/03/2026" inside one year. */
function rotuloIntervalo(ini: string, fim: string): string {
  if (ini === fim) return formatDate(ini);
  const a = formatDate(ini);
  const b = formatDate(fim);
  const [dia, mes, anoA] = a.split("/");
  const [, , anoB] = b.split("/");
  return anoA === anoB ? `${dia}/${mes} – ${b}` : `${a} – ${b}`;
}
