import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lightbulb,
  List,
  MessagesSquare,
  Search,
  Vote,
} from "lucide-react";
import { HudGrid } from "@/components/hud/HudGrid";
import { EmptyState, ErrorState } from "@/components/shared";
import { ECIDADANIA_SITE } from "@/lib/api/config";
import { formatNumber } from "@/lib/format";
import type { EcidadaniaItem } from "@/lib/types";
import {
  parseParticipacaoParam,
  participacaoHref,
  router,
  useDebouncedValue,
  useQueryEnum,
  useQueryParam,
  useRoute,
} from "@/hooks/useUi";
import {
  useEcidadaniaConsultas,
  useEcidadaniaIdeias,
  useEcidadaniaPagina,
} from "@/hooks/useEcidadania";
import { DetalheSheet } from "./DetalheSheet";
import { EcidadaniaCard, EcidadaniaCardSkeleton } from "./EcidadaniaCard";

type Aba = "consultas" | "ideias";
const ABAS: readonly Aba[] = ["consultas", "ideias"];
/** The portal returns 100 items per page; keep the source pagination intact. */
const POR_PAGINA = 100;

function somaRecentes(itens: EcidadaniaItem[]): number {
  return itens.reduce((total, item) => total + (item.recentes ?? 0), 0);
}

function ResumoCard({
  ideias,
  consultas,
  isLoading,
  isError,
}: {
  ideias: EcidadaniaItem[];
  consultas: EcidadaniaItem[];
  isLoading: boolean;
  isError: boolean;
}) {
  const apoios = somaRecentes(ideias);
  const votos = somaRecentes(consultas);
  const vazio = isLoading || isError;
  return (
    <section className="card" aria-labelledby="resumo-participacao">
      <div className="card-head">
        <h2 id="resumo-participacao">Movimento de hoje</h2>
        <span className="meta">24 h</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-line bg-panel-2/60 p-3">
          <p className="label">Apoios</p>
          <p className="fig-m mt-1 text-green">{vazio ? "—" : formatNumber(apoios)}</p>
          <p className="mt-1 text-[10px] leading-tight text-fg-5">nas ideias em alta</p>
        </div>
        <div className="rounded-lg border border-line bg-panel-2/60 p-3">
          <p className="label">Votos</p>
          <p className="fig-m mt-1">{vazio ? "—" : formatNumber(votos)}</p>
          <p className="mt-1 text-[10px] leading-tight text-fg-5">nas consultas em alta</p>
        </div>
      </div>
      <ul className="mt-3 text-[11.5px]">
        <li className="flex items-center justify-between border-t border-line py-2">
          <span className="flex items-center gap-2 text-fg-4">
            <Lightbulb className="h-3.5 w-3.5 text-yellow" />
            Ideias em alta
          </span>
          <span className="tn font-medium text-fg-2">{vazio ? "—" : ideias.length}</span>
        </li>
        <li className="flex items-center justify-between border-t border-line py-2">
          <span className="flex items-center gap-2 text-fg-4">
            <MessagesSquare className="h-3.5 w-3.5 text-blue" />
            Consultas em alta
          </span>
          <span className="tn font-medium text-fg-2">{vazio ? "—" : consultas.length}</span>
        </li>
      </ul>
      <p className="mt-2 text-[10.5px] leading-relaxed text-fg-5">
        Somatório entre as cinco mais populares de cada tipo, para dimensionar o movimento do dia.
      </p>
    </section>
  );
}

function SobreCard() {
  return (
    <section className="card" aria-labelledby="sobre-ecidadania">
      <h2 id="sobre-ecidadania" className="section-title">Participação no Senado</h2>
      <p className="mt-2 text-[12px] leading-relaxed text-fg-3">
        O e-Cidadania é o canal do Senado para ouvir a população entre uma eleição e outra.
        Cidadãos propõem ideias de lei e opinam sobre proposições que já estão em tramitação.
      </p>
      <a
        href={ECIDADANIA_SITE}
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm mt-3"
      >
        Conhecer o portal
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}

function ComoFuncionaCard() {
  return (
    <section className="card" aria-labelledby="como-funciona">
      <div className="card-head">
        <h2 id="como-funciona">Como funciona</h2>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow" />
          <h3 className="text-[12.5px] font-medium text-fg">Ideia legislativa</h3>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-fg-3">
          Qualquer cidadão pode propor. Se a ideia receber 20 mil apoios em até quatro meses,
          vai para a CDH, que pode transformá-la em proposição ou arquivá-la.
        </p>
        <a
          href={`${ECIDADANIA_SITE}/pesquisaideia`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fg-2 transition-colors hover:text-fg"
        >
          Ver todas as ideias
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-center gap-2">
          <Vote className="h-4 w-4 text-blue" />
          <h3 className="text-[12.5px] font-medium text-fg">Consulta pública</h3>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-fg-3">
          O Senado abre proposições para votação popular. Os resultados são enviados aos
          senadores como contribuição da sociedade durante a tramitação.
        </p>
        <a
          href={`${ECIDADANIA_SITE}/pesquisamateria`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fg-2 transition-colors hover:text-fg"
        >
          Ver todas as consultas
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}

function FonteCard() {
  return (
    <section className="card" aria-labelledby="fonte-participacao">
      <h2 id="fonte-participacao" className="section-title">Fonte</h2>
      <p className="mt-2 text-[11.5px] leading-relaxed text-fg-3">
        Dados oficiais do portal e-Cidadania, do Senado Federal. A lista completa é
        paginada, com 100 itens por página, e atualizada a cada cinco minutos. Os
        destaques ao lado mostram o movimento das últimas 24 horas.
      </p>
      <a
        href="https://www12.senado.leg.br/ecidadania"
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fg-2 transition-colors hover:text-fg"
      >
        www12.senado.leg.br/ecidadania
        <ArrowUpRight className="h-3 w-3" />
      </a>
    </section>
  );
}

export function ParticipacaoView() {
  const { param, query } = useRoute();
  const [aba] = useQueryEnum<Aba>("aba", ABAS, "consultas");
  const [paginaParam, setPagina] = useQueryParam("pagina", "1");
  const busca = query.get("q") ?? "";
  const buscaDebounced = useDebouncedValue(busca.trim(), 400);
  const detalhe = parseParticipacaoParam(param);
  const tipoAtivo: Aba = detalhe ? (detalhe.tipo === "consulta" ? "consultas" : "ideias") : aba;
  const pagina = Math.max(1, Number(paginaParam) || 1);
  const tipo = tipoAtivo === "consultas" ? "consulta" : "ideia";

  // The 24-hour highlights are a separate, small signal and keep using the
  // portal's popular endpoints. The list below is the complete archive.
  const destaquesIdeiasQ = useEcidadaniaIdeias();
  const destaquesConsultasQ = useEcidadaniaConsultas();
  const ideiasDestaque = destaquesIdeiasQ.data ?? [];
  const consultasDestaque = destaquesConsultasQ.data ?? [];

  const paginaQ = useEcidadaniaPagina(tipo, pagina, buscaDebounced);
  // keepPreviousData makes paging smooth, but a tab switch must not show the
  // previous type's items under the new heading.
  const trocandoTipo = paginaQ.isPlaceholderData && paginaQ.data?.tipo !== tipo;
  const lista = trocandoTipo ? [] : (paginaQ.data?.items ?? []);
  const totalPaginas = trocandoTipo ? 1 : (paginaQ.data?.totalPaginas ?? 1);
  const paginaExibida = paginaQ.data?.pagina ?? pagina;
  const carregando = paginaQ.isLoading || trocandoTipo;
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: 0 });
  }, [tipo, pagina]);

  useEffect(() => {
    if (paginaQ.data && pagina > paginaQ.data.totalPaginas) {
      setPagina(String(paginaQ.data.totalPaginas));
    }
  }, [pagina, paginaQ.data, setPagina]);

  const trocarAba = (proxima: Aba) => {
    if (!detalhe && proxima === tipoAtivo) return;
    const manterBusca = !!detalhe && proxima === tipoAtivo;
    const mudancas = {
      aba: proxima === "ideias" ? "ideias" : null,
      pagina: manterBusca && pagina > 1 ? String(pagina) : null,
      q: manterBusca && busca ? busca : null,
    };
    if (detalhe) router.go("participacao", undefined, mudancas);
    else router.patch(mudancas);
  };

  const irParaPagina = (destino: number) =>
    setPagina(String(Math.min(Math.max(1, destino), totalPaginas)));

  const definirBusca = (valor: string) => router.patch({ q: valor || null, pagina: null });

  const abrir = (item: EcidadaniaItem) => {
    router.abrir(
      participacaoHref(item, {
        aba: tipoAtivo === "ideias" ? "ideias" : undefined,
        pagina: paginaExibida > 1 ? String(paginaExibida) : undefined,
        q: busca || undefined,
      })
    );
  };

  const fechar = () => {
    router.go("participacao", undefined, {
      aba: tipoAtivo === "ideias" ? "ideias" : undefined,
      pagina: paginaExibida > 1 ? String(paginaExibida) : undefined,
      q: busca || undefined,
    });
  };

  const conteudo = (
    <section className="card flex h-full min-h-[520px] flex-col" aria-label="e-Cidadania">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label">Senado Federal · e-Cidadania</p>
          <h1 className="manchete mt-2">Todas as consultas e ideias</h1>
          <p className="mt-2 max-w-[56ch] text-[12.5px] leading-relaxed text-fg-3">
            Percorra a lista completa de consultas públicas e ideias legislativas do portal
            e-Cidadania. Abra qualquer item para ler o texto completo, os apoios e os votos —
            e participe no portal oficial.
          </p>
        </div>
        <a
          href={ECIDADANIA_SITE}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm hidden shrink-0 sm:inline-flex"
        >
          Abrir o portal
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-2.5">
        <div className="switch switch-sm" role="group" aria-label="Tipo de participação">
          <button type="button" aria-pressed={tipoAtivo === "consultas"} onClick={() => trocarAba("consultas")}>
            Consultas
          </button>
          <button type="button" aria-pressed={tipoAtivo === "ideias"} onClick={() => trocarAba("ideias")}>
            Ideias
          </button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-fg-4">
          <List className="h-3 w-3 text-fg-5" />
          {buscaDebounced ? `Resultados para “${buscaDebounced}”` : `Lista completa · ${POR_PAGINA} por página`}
        </p>
        <label className="relative ml-auto min-w-[210px] flex-1 sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-5" />
          <input
            type="search"
            value={busca}
            onChange={(event) => definirBusca(event.target.value)}
            placeholder={
              tipoAtivo === "consultas"
                ? "Buscar por nº, autor ou ano"
                : "Buscar ideias por título"
            }
            className="field pl-9"
            aria-label={`Buscar na lista de ${tipoAtivo}`}
          />
        </label>
      </div>

      <div
        ref={listaRef}
        className={`scroll-visible mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1.5 transition-opacity ${
          paginaQ.isFetching && !carregando ? "opacity-60" : ""
        }`}
        aria-busy={carregando || paginaQ.isFetching}
      >
        {carregando && (
          <div className="space-y-2.5" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <EcidadaniaCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!carregando && paginaQ.isError && !paginaQ.data && (
          <ErrorState
            title="Não foi possível carregar a lista do e-Cidadania"
            description={(paginaQ.error as Error | null)?.message}
            onRetry={() => paginaQ.refetch()}
          />
        )}
        {!carregando &&
          !paginaQ.isError &&
          lista.length === 0 &&
          (buscaDebounced ? (
            <EmptyState
              icon={Search}
              title={`Nenhum resultado para “${buscaDebounced}”`}
              description={
                tipoAtivo === "consultas"
                  ? "A busca oficial não encontrou consultas com esse número, autor ou ano."
                  : "A busca oficial não encontrou ideias com esse título."
              }
              action={
                <button type="button" className="btn btn-sm" onClick={() => definirBusca("")}>
                  Limpar busca
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={tipoAtivo === "ideias" ? Lightbulb : MessagesSquare}
              title="Nenhum item nesta página"
              description="A lista oficial não retornou itens para esta página. Tente voltar uma página ou atualizar."
            />
          ))}
        {!carregando &&
          lista.map((item, index) => (
            <EcidadaniaCard
              key={`${item.tipo}-${item.id}`}
              item={item}
              posicao={(paginaExibida - 1) * POR_PAGINA + index + 1}
              onOpen={abrir}
            />
          ))}
      </div>

      {!carregando && paginaQ.data && lista.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12px] text-fg-3">
          <span className="tn">
            {formatNumber((paginaExibida - 1) * POR_PAGINA + 1)}–
            {formatNumber((paginaExibida - 1) * POR_PAGINA + lista.length)}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="tn">
              Página {formatNumber(paginaExibida)} de {formatNumber(totalPaginas)}
            </span>
            <button
              type="button"
              className="icon-btn h-8 w-8"
              aria-label="Primeira página"
              disabled={paginaQ.isFetching || paginaExibida <= 1}
              onClick={() => irParaPagina(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="icon-btn h-8 w-8"
              aria-label="Página anterior"
              disabled={paginaQ.isFetching || paginaExibida <= 1}
              onClick={() => irParaPagina(paginaExibida - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="icon-btn h-8 w-8"
              aria-label="Próxima página"
              disabled={paginaQ.isFetching || paginaExibida >= totalPaginas}
              onClick={() => irParaPagina(paginaExibida + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="icon-btn h-8 w-8"
              aria-label="Última página"
              disabled={paginaQ.isFetching || paginaExibida >= totalPaginas}
              onClick={() => irParaPagina(totalPaginas)}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <>
      <HudGrid
        centroAntes
        left={
          <>
            <ResumoCard
              ideias={ideiasDestaque}
              consultas={consultasDestaque}
              isLoading={destaquesIdeiasQ.isLoading || destaquesConsultasQ.isLoading}
              isError={destaquesIdeiasQ.isError || destaquesConsultasQ.isError}
            />
            <SobreCard />
          </>
        }
        center={conteudo}
        right={
          <>
            <ComoFuncionaCard />
            <FonteCard />
          </>
        }
      />
      {detalhe && <DetalheSheet tipo={detalhe.tipo} id={detalhe.id} onClose={fechar} />}
    </>
  );
}
