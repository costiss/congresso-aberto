import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar, type DateRange } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, startOfDay } from "@/lib/format";
import { Periodo } from "@/lib/periodo";
import { cn } from "@/lib/utils";

function comoData(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/**
 * A calendar button for the period filters. Named periods (last 30 days, a
 * year) open with their dates already selected; picking two days applies a
 * custom range. Bounded to the same four years the period tabs offer, so the
 * button can never trigger an unbounded history fetch.
 */
export function PeriodoPicker({ valor, onChange, className }: {
  valor: string;
  onChange: (valor: string) => void;
  className?: string;
}) {
  const [hoje] = useState(() => startOfDay(new Date()));
  const periodo = useMemo(() => Periodo.de(valor), [valor]);
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState(() => comoData(periodo.fim));
  const [intervalo, setIntervalo] = useState<DateRange | undefined>(() => ({
    from: comoData(periodo.ini),
    to: comoData(periodo.fim),
  }));

  const personalizado = periodo.valor.includes(Periodo.SEPARADOR);
  const limite = useMemo(() => new Date(hoje.getFullYear() - 3, 0, 1), [hoje]);

  const atalhos = useMemo(() => {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return [
      { label: "7 dias", de: addDays(hoje, -6), ate: hoje },
      { label: "30 dias", de: addDays(hoje, -29), ate: hoje },
      { label: "Este mês", de: inicioMes, ate: hoje },
      { label: "Mês passado", de: inicioMesPassado, ate: addDays(inicioMes, -1) },
    ];
  }, [hoje]);

  const aoAbrir = (aberto: boolean) => {
    if (aberto) {
      const atual = Periodo.de(valor);
      setIntervalo({ from: comoData(atual.ini), to: comoData(atual.fim) });
      setMes(comoData(atual.fim));
    }
    setAberto(aberto);
  };

  const aplicar = (de: Date, ate: Date) => {
    onChange(Periodo.intervalo(de, ate).valor);
    setAberto(false);
  };

  const selecionar = (r: DateRange | undefined) => {
    setIntervalo(r);
    if (r?.from && r.to) onChange(Periodo.intervalo(r.from, r.to).valor);
  };

  return (
    <Popover open={aberto} onOpenChange={aoAbrir}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("btn btn-sm gap-1.5", personalizado && "btn-accent", className)}
          aria-label={personalizado ? `Período ${periodo.label}. Escolher outro no calendário` : "Escolher um período no calendário"}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          <span className={cn("max-w-[170px] truncate", !personalizado && "text-fg-3")}>
            {personalizado ? periodo.label : "Datas"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Escolher período" className="w-[292px] max-w-[calc(100vw-1.5rem)] p-0">
        <Calendar
          mode="range"
          selected={intervalo}
          onSelect={selecionar}
          month={mes}
          onMonthChange={setMes}
          numberOfMonths={1}
          startMonth={limite}
          endMonth={hoje}
          disabled={[{ before: limite }, { after: hoje }]}
        />
        <div className="border-t border-line p-3">
          <p className="label">Atalhos</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {atalhos.map((a) => (
              <button
                key={a.label}
                type="button"
                className="btn btn-sm justify-center"
                onClick={() => aplicar(a.de, a.ate)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-fg-4">Clique na data inicial e depois na final.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
