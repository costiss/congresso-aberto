import type { ElementType, ReactNode } from "react";
import { ArrowUpRight, CalendarClock, FileText, Flame, Gavel, Landmark, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useEcidadaniaDetalhe, useEcidadaniaRelator } from "@/hooks/useEcidadania";
import { ECIDADANIA_SITE } from "@/lib/api/config";
import { formatDate, formatNumber, formatPct } from "@/lib/format";
import type { EcidadaniaDetalhe, EcidadaniaTipo } from "@/lib/types";

function urlOficial(item: { id: number; tipo: EcidadaniaTipo }): string {
  const pagina = item.tipo === "ideia" ? "visualizacaoideia" : "visualizacaomateria";
  return `${ECIDADANIA_SITE}/${pagina}?id=${item.id}`;
}

function urlAbsoluta(href?: string): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href, ECIDADANIA_SITE);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    // The portal still emits some http:// links; the sites support https.
    return url.toString().replace(/^http:/, "https:");
  } catch {
    return undefined;
  }
}

function LinkExterno({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-fg-2 underline decoration-line-2 underline-offset-4 transition-colors hover:text-fg hover:decoration-fg-3"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

function Campo({ icon: Icon, label, children }: { icon: ElementType; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-5" />
      <div className="min-w-0">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-fg-5">{label}</p>
        <div className="mt-0.5 text-[12px] leading-relaxed text-fg-2">{children}</div>
      </div>
    </div>
  );
}

function BarraIdeia({ item }: { item: EcidadaniaDetalhe }) {
  const pct = Math.min(100, item.percentual);
  return (
    <div className="rounded-xl border border-line bg-panel-2/70 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label">Apoios confirmados</p>
          <p className="fig mt-1">{formatNumber(item.apoios)}</p>
        </div>
        <p className="text-right text-[12px] text-fg-3">
          <span className="block font-medium text-green">{formatPct(pct)}</span>
          da meta de {formatNumber(item.meta)}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel-3" aria-hidden="true">
        <span className="block h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-fg-4">
        {item.recentes ? `${formatNumber(item.recentes)} apoios nas últimas 24 h · ` : ""}
        Meta de {formatNumber(item.meta)} apoios em até 4 meses.
      </p>
    </div>
  );
}

function BarraConsulta({ item }: { item: EcidadaniaDetalhe }) {
  const pct = Math.max(0, Math.min(100, item.percentual));
  return (
    <div className="rounded-xl border border-line bg-panel-2/70 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label">Votação dos cidadãos</p>
          <p className="fig mt-1">{formatPct(pct)}</p>
        </div>
        <p className="text-right text-[12px] text-fg-3">
          <span className="block font-medium text-fg">{formatNumber(item.totalVotos)}</span>
          votos registrados
        </p>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-panel-3" aria-hidden="true">
        <span className="block h-full bg-green" style={{ width: `${pct}%` }} />
        <span className="block h-full bg-red" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px]">
        <span className="font-medium text-green">Sim {formatNumber(item.votosFavor)}</span>
        <span className="font-medium text-red">Não {formatNumber(item.votosContra)}</span>
        {item.recentes ? (
          <span className="ml-auto inline-flex items-center gap-1 text-fg-4">
            <Flame className="h-3 w-3 text-orange" />
            {formatNumber(item.recentes)} nas últimas 24 h
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Conteudo({
  item,
  relator,
  relatorLoading,
  relatorError,
}: {
  item: EcidadaniaDetalhe;
  relator?: string | null;
  relatorLoading?: boolean;
  relatorError?: boolean;
}) {
  const ideia = item.tipo === "ideia";
  const texto = urlAbsoluta(item.textoUrl);
  const tramitacao = urlAbsoluta(item.tramitacaoUrl);
  return (
    <div className="space-y-6">
      {item.descricao && (
        <section aria-label={ideia ? "Descrição da ideia" : "Ementa da proposição"}>
          <h3 className="label">{ideia ? "A ideia" : "Ementa"}</h3>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-fg-2">{item.descricao}</p>
        </section>
      )}

      {ideia ? <BarraIdeia item={item} /> : <BarraConsulta item={item} />}

      <section className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2" aria-label="Informações">
        {item.autor && <Campo icon={User} label={ideia ? "Proposta por" : "Autoria"}>{item.autor}</Campo>}
        {!ideia && !relatorError && (
          <Campo icon={Gavel} label="Relator">
            {relatorLoading ? "…" : relator || "Aguardando designação"}
          </Campo>
        )}
        {ideia && item.dataPublicacao && (
          <Campo icon={Landmark} label="Publicada em">{formatDate(item.dataPublicacao)}</Campo>
        )}
        {ideia && item.prazo && (
          <Campo icon={CalendarClock} label="Apoios até">{item.prazo}</Campo>
        )}
        {!ideia && item.atualizadoEm && (
          <Campo icon={CalendarClock} label="Votos apurados até">{item.atualizadoEm}</Campo>
        )}
        <Campo icon={Landmark} label="Situação">
          {item.aberta === false ? "Encerrada" : "Recebendo participação"}
        </Campo>
      </section>

      {(texto || tramitacao) && (
        <section className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4" aria-label="Documentos">
          {texto && <LinkExterno href={texto}><FileText className="h-3.5 w-3.5" />Ler o texto inicial</LinkExterno>}
          {tramitacao && <LinkExterno href={tramitacao}>Ver tramitação e mais informações</LinkExterno>}
        </section>
      )}

      <section className="rounded-xl border border-line bg-panel-2/50 p-4">
        <p className="text-[12px] leading-relaxed text-fg-3">
          {ideia
            ? "Apoie esta ideia no portal oficial. Se ela alcançar 20 mil apoios em até quatro meses, será avaliada pela Comissão de Direitos Humanos e Legislação Participativa (CDH)."
            : "Vote e acompanhe esta consulta no portal oficial. O resultado é enviado aos senadores como contribuição da sociedade."}
        </p>
        <a
          href={urlOficial(item)}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-accent mt-3"
        >
          {ideia ? "Apoiar no e-Cidadania" : "Votar no e-Cidadania"}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </div>
  );
}

function DetalheSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

export function DetalheSheet({
  tipo,
  id,
  onClose,
}: {
  tipo: EcidadaniaTipo;
  id: number;
  onClose: () => void;
}) {
  const q = useEcidadaniaDetalhe(tipo, id);
  const relatorQ = useEcidadaniaRelator(tipo === "consulta" ? id : undefined);
  const ideia = tipo === "ideia";
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[min(640px,100vw)]">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{ideia ? "Ideia legislativa" : "Consulta pública"}</Badge>
            {q.data?.aberta === false && <Badge tone="neutral">Encerrada</Badge>}
          </div>
          <SheetTitle className="mt-2 font-serif text-[24px] font-normal leading-tight tracking-[-0.01em]">
            {q.data?.titulo ?? (ideia ? "Ideia legislativa" : "Consulta pública")}
          </SheetTitle>
          <SheetDescription className="mt-1 text-[12px] text-fg-4">
            {ideia ? "Proposta por um cidadão no portal e-Cidadania, do Senado Federal." : "Consulta pública do Senado Federal sobre uma proposição em tramitação."}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {q.isLoading && <DetalheSkeleton />}
          {q.isError && (
            <ErrorState
              title="Não foi possível abrir a página do e-Cidadania"
              description={(q.error as Error | null)?.message}
              onRetry={() => q.refetch()}
            />
          )}
          {q.data && (
            <Conteudo
              item={q.data}
              relator={relatorQ.data}
              relatorLoading={relatorQ.isLoading}
              relatorError={relatorQ.isError}
            />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
