import { ArrowUpRight, CalendarClock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPct } from "@/lib/format";
import type { EcidadaniaItem } from "@/lib/types";

function IdeiaMeter({ item }: { item: EcidadaniaItem }) {
  const pct = Math.min(100, item.percentual);
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="fig text-[28px]">{formatNumber(item.apoios)}</span>
        <span className="text-[11px] text-fg-4">de {formatNumber(item.meta)} apoios</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-3" aria-hidden="true">
        <span className="block h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <span className="font-medium text-green">{formatPct(pct)} da meta</span>
        <span className="inline-flex items-center gap-1 text-fg-4">
          <Flame className="h-3 w-3 text-orange" />
          {formatNumber(item.recentes)} apoios nas últimas 24 h
        </span>
        {item.prazo && (
          <span className="inline-flex items-center gap-1 text-fg-5">
            <CalendarClock className="h-3 w-3" />
            até {item.prazo}
          </span>
        )}
      </div>
    </>
  );
}

function ConsultaMeter({ item }: { item: EcidadaniaItem }) {
  const pct = Math.max(0, Math.min(100, item.percentual));
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="fig text-[28px]">{formatPct(pct)}</span>
        <span className="text-[11px] text-fg-4">a favor</span>
      </div>
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-panel-3" aria-hidden="true">
        <span className="block h-full bg-green" style={{ width: `${pct}%` }} />
        <span className="block h-full bg-red" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <span className="font-medium text-green">Sim {formatNumber(item.votosFavor)}</span>
        <span className="font-medium text-red">Não {formatNumber(item.votosContra)}</span>
        <span className="text-fg-4">{formatNumber(item.totalVotos)} votos</span>
        <span className="ml-auto inline-flex items-center gap-1 text-fg-5">
          <Flame className="h-3 w-3 text-orange" />
          {formatNumber(item.recentes)} nas últimas 24 h
        </span>
      </div>
    </>
  );
}

export function PopularCard({
  item,
  posicao,
  onOpen,
  relator,
  relatorLoading,
  relatorError,
}: {
  item: EcidadaniaItem;
  posicao: number;
  onOpen: (item: EcidadaniaItem) => void;
  relator?: string | null;
  relatorLoading?: boolean;
  relatorError?: boolean;
}) {
  const ideia = item.tipo === "ideia";
  const titulo = ideia ? item.titulo : item.descricao || item.titulo;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      aria-label={`Abrir ${ideia ? "ideia" : "consulta"} ${titulo}`}
      className="surface surface-hover group block w-full cursor-pointer p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <span className="fig-m mt-0.5 w-5 shrink-0 text-center text-[18px] text-fg-5" aria-hidden="true">
          {posicao}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-fg-4">
              {ideia ? "Ideia legislativa" : "Consulta pública"}
            </span>
            {!ideia && item.identificacao && (
              <span className="tn text-[11px] font-semibold text-fg-2">{item.identificacao}</span>
            )}
            {item.aberta === false && <Badge tone="neutral">Encerrada</Badge>}
          </div>
          {ideia ? (
            <h3 className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-fg">
              {item.titulo}
            </h3>
          ) : (
            <>
              <div className="mt-1 max-h-10 overflow-hidden transition-[max-height] duration-200 ease-out group-hover:max-h-60 group-focus-visible:max-h-60">
                <p className="text-[11.5px] leading-relaxed text-fg-2">{item.descricao || item.titulo}</p>
              </div>
              {!relatorError && (
                <p className="mt-1.5 text-[10.5px] leading-snug text-fg-4">
                  Relator:{" "}
                  <span className="text-fg-2">
                    {relatorLoading ? "…" : relator || "aguardando designação"}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-fg-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg-3" />
      </div>
      <div className="mt-4 border-t border-line pt-3">
        {ideia ? <IdeiaMeter item={item} /> : <ConsultaMeter item={item} />}
      </div>
    </div>
  );
}

export function PopularCardSkeleton() {
  return (
    <div className="surface animate-pulse p-4" aria-hidden="true">
      <div className="flex gap-3">
        <div className="h-4 w-4 rounded bg-panel-3" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-24 rounded bg-panel-3" />
          <div className="h-3.5 w-4/5 rounded bg-panel-3" />
          <div className="h-2.5 w-3/5 rounded bg-panel-3" />
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-line pt-3">
        <div className="h-7 w-24 rounded bg-panel-3" />
        <div className="h-1.5 w-full rounded bg-panel-3" />
        <div className="h-2.5 w-2/3 rounded bg-panel-3" />
      </div>
    </div>
  );
}
