import {
  ArrowUpRight,
  Flame,
  Lightbulb,
  MessagesSquare,
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
  useQueryEnum,
  useRoute,
} from "@/hooks/useUi";
import { useEcidadaniaConsultas, useEcidadaniaIdeias, useEcidadaniaRelatores } from "@/hooks/useEcidadania";
import { DetalheSheet } from "./DetalheSheet";
import { PopularCard, PopularCardSkeleton } from "./PopularCard";

type Aba = "ideias" | "consultas";
const ABAS: readonly Aba[] = ["ideias", "consultas"];

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
          href={`${ECIDADANIA_SITE}/principalideia`}
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
          href={`${ECIDADANIA_SITE}/principalmateria`}
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
        Dados oficiais do portal e-Cidadania, do Senado Federal. As listas mostram o
        movimento das últimas 24 horas e são atualizadas a cada cinco minutos.
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
  const { param } = useRoute();
  const [aba, setAba] = useQueryEnum<Aba>("aba", ABAS, "ideias");
  const detalhe = parseParticipacaoParam(param);
  const tipoAtivo: Aba = detalhe ? (detalhe.tipo === "consulta" ? "consultas" : "ideias") : aba;

  const ideiasQ = useEcidadaniaIdeias();
  const consultasQ = useEcidadaniaConsultas();
  const ideias = ideiasQ.data ?? [];
  const consultas = consultasQ.data ?? [];
  const q = tipoAtivo === "ideias" ? ideiasQ : consultasQ;
  const lista = tipoAtivo === "ideias" ? ideias : consultas;

  // The rapporteur lives on the Senate matter page, so it is only fetched
  // when the consultations are actually on screen.
  const idsConsultas = tipoAtivo === "consultas" ? consultas.map((c) => c.id) : [];
  const relatores = useEcidadaniaRelatores(idsConsultas);
  const relatorDe = new Map(idsConsultas.map((id, i) => [id, relatores[i]]));

  const trocarAba = (proxima: Aba) => {
    if (detalhe) {
      router.go("participacao", undefined, { aba: proxima === "consultas" ? "consultas" : undefined });
      return;
    }
    setAba(proxima);
  };

  const abrir = (item: EcidadaniaItem) => {
    router.abrir(
      participacaoHref(item, {
        aba: item.tipo === "consulta" ? "consultas" : undefined,
      })
    );
  };

  const fechar = () => {
    router.go("participacao", undefined, {
      aba: detalhe?.tipo === "consulta" ? "consultas" : undefined,
    });
  };

  const conteudo = (
    <section className="card flex h-full min-h-[520px] flex-col" aria-label="e-Cidadania">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label">Senado Federal · e-Cidadania</p>
          <h1 className="manchete mt-2">O que o país está apoiando agora</h1>
          <p className="mt-2 max-w-[56ch] text-[12.5px] leading-relaxed text-fg-3">
            As ideias e consultas públicas mais movimentadas nas últimas 24 horas.
            Abra uma para ler o texto completo, os apoios e os votos — e participe no portal oficial.
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
          <button type="button" aria-pressed={tipoAtivo === "ideias"} onClick={() => trocarAba("ideias")}>
            Ideias
            {ideias.length > 0 && <span className="tn text-[10.5px] text-fg-4">{ideias.length}</span>}
          </button>
          <button type="button" aria-pressed={tipoAtivo === "consultas"} onClick={() => trocarAba("consultas")}>
            Consultas
            {consultas.length > 0 && <span className="tn text-[10.5px] text-fg-4">{consultas.length}</span>}
          </button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-fg-4">
          <Flame className="h-3 w-3 text-orange" />
          Mais movimentadas nas últimas 24 h
        </p>
      </div>

      <div className="quiet-scroll mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {q.isLoading && (
          <div className="space-y-2.5" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <PopularCardSkeleton key={i} />
            ))}
          </div>
        )}
        {q.isError && !q.data && (
          <ErrorState
            title="Não foi possível carregar o e-Cidadania"
            description={(q.error as Error | null)?.message}
            onRetry={() => q.refetch()}
          />
        )}
        {!q.isLoading && !q.isError && lista.length === 0 && (
          <EmptyState
            icon={tipoAtivo === "ideias" ? Lightbulb : MessagesSquare}
            title="Nenhum item em destaque agora"
            description="O portal não retornou itens para as últimas 24 horas. Tente atualizar em alguns minutos."
          />
        )}
        {lista.map((item, index) => {
          const relator = item.tipo === "consulta" ? relatorDe.get(item.id) : undefined;
          return (
            <PopularCard
              key={`${item.tipo}-${item.id}`}
              item={item}
              posicao={index + 1}
              onOpen={abrir}
              relator={relator?.data}
              relatorLoading={relator?.isLoading}
              relatorError={relator?.isError}
            />
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      <HudGrid
        centroAntes
        left={
          <>
            <ResumoCard
              ideias={ideias}
              consultas={consultas}
              isLoading={ideiasQ.isLoading || consultasQ.isLoading}
              isError={ideiasQ.isError || consultasQ.isError}
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
