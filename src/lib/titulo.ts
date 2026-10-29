/** Type scale for a vote headline: the longer the title, the quieter it gets. */
export function classeTitulo(titulo: string): string {
  if (titulo.length > 80) return "titulo-voto titulo-voto-longo";
  if (titulo.length > 48) return "titulo-voto titulo-voto-medio";
  return "titulo-voto";
}
