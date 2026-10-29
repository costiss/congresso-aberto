import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getEcidadaniaConsultas,
  getEcidadaniaDetalhe,
  getEcidadaniaIdeias,
  getEcidadaniaPagina,
  getEcidadaniaRelator,
} from "@/lib/api";
import type { EcidadaniaTipo } from "@/lib/types";

const STALE = 5 * 60 * 1000;

/** The five ideas with the most supports in the last 24 hours. */
export function useEcidadaniaIdeias() {
  return useQuery({
    queryKey: ["ecidadania-ideias"],
    queryFn: getEcidadaniaIdeias,
    staleTime: STALE,
  });
}

/** The five public consultations with the most votes in the last 24 hours. */
export function useEcidadaniaConsultas() {
  return useQuery({
    queryKey: ["ecidadania-consultas"],
    queryFn: getEcidadaniaConsultas,
    staleTime: STALE,
  });
}

/** One page (100 items) of the portal's full ideas or consultations listing. */
export function useEcidadaniaPagina(tipo: EcidadaniaTipo, pagina: number) {
  return useQuery({
    queryKey: ["ecidadania-pagina", tipo, pagina],
    queryFn: () => getEcidadaniaPagina(tipo, pagina),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  });
}

export function useEcidadaniaDetalhe(tipo?: EcidadaniaTipo, id?: number) {
  return useQuery({
    queryKey: ["ecidadania-detalhe", tipo, id],
    queryFn: () => getEcidadaniaDetalhe(tipo as EcidadaniaTipo, id as number),
    enabled: !!tipo && !!id,
    staleTime: STALE,
    retry: 1,
  });
}

/** Rapporteur of one consultation, read from the Senate open-data API. */
export function useEcidadaniaRelator(id?: number) {
  return useQuery({
    queryKey: ["ecidadania-relator", id],
    queryFn: () => getEcidadaniaRelator(id as number),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
