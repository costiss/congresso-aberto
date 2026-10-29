/** Pre-filled GitHub issue link for bug reports. */

const NOVA_ISSUE = "https://github.com/costiss/congresso-aberto/issues/new";

const TEMPLATE = `### O que aconteceu
<!-- Descreva o problema. Se puder, inclua o que apareceu na tela. -->

### O que você esperava
<!-- O que deveria ter acontecido. -->

### Como reproduzir
1. 
2. 

### Contexto
`;

/**
 * Page, browser and viewport are filled in for the bug reporter: they are the
 * first things whoever picks up the issue would ask for, and they cost the
 * person reporting nothing. The rest of the body is a template to fill in.
 */
function contexto(): string {
  const linhas = [
    `- Página: ${window.location.href}`,
    `- Navegador: ${navigator.userAgent}`,
    `- Tela: ${window.innerWidth}×${window.innerHeight}`,
  ];
  return linhas.join("\n");
}

/** GitHub's new-issue URL, with title and body pre-filled. */
export function bugReportHref(): string {
  const params = new URLSearchParams({
    title: "Bug: ",
    labels: "bug",
    body: `${TEMPLATE}\n${contexto()}\n`,
  });
  return `${NOVA_ISSUE}?${params.toString()}`;
}
