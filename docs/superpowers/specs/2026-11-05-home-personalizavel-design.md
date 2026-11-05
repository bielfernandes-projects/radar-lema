# Home personalizável — design

Data: 2026-11-05 · Status: aprovado em conversa, aguardando revisão do arquivo

## Objetivo

O usuário logado escolhe **quais blocos** aparecem na página inicial e **em que ordem**.
Inclui um bloco novo, "Dashboard do UNO", em modo só leitura (sem exportar relatório).
É a 1ª de duas funcionalidades; a 2ª é o tutorial de primeiro uso, que ensina o botão
"Personalizar" no último passo (spec própria, depois).

## Fora de escopo

- Personalizar a landing pública (anônimo em `/` continua vendo a `Landing`).
- Exportar/imprimir o relatório a partir da home (continua só em `/dashboard-uno`).
- Qualquer mudança no layout do relatório impresso.

## Blocos

Registro único em `src/config/homeBlocks.js`:

| id | título | ligado por padrão |
|----|--------|-------------------|
| `eventos` | Próximos eventos | sim |
| `noticias` | Notícias de mercado | sim |
| `artigos` | Artigos | sim |
| `novidades-uno` | Novidades do UNO | sim |
| `dashboard-uno` | Dashboard do UNO | **não** |

A ordem do registro é a ordem padrão (a de hoje, com o dashboard no fim).
O padrão deixa a home de quem já usa idêntica à atual.

## Dados

- Coluna `profiles.home_layout jsonb` (nula = padrão). Formato: `[{"id":"eventos","visible":true}, ...]`.
- RLS de `profiles` bloqueia `UPDATE` direto; a escrita vai por RPC
  `update_my_home_layout(layout jsonb)` (`SECURITY DEFINER`, mesmo molde de
  `update_my_profile_name`). Valida: é array, até 20 itens, cada `id` é texto de até 40
  caracteres, `visible` é booleano. Não valida contra a lista de blocos (o front descarta ids
  desconhecidos), para novos blocos não exigirem migração.
- `AuthContext.loadProfile` passa a selecionar `home_layout`, e o contexto expõe um jeito de
  atualizar o perfil local depois de salvar (definir no plano: `refreshProfile` ou `setProfile`).
- Armazenado no banco, não no `localStorage`: o app instalado no iPhone tem armazenamento
  separado do Safari e perderia a preferência.

## Regra de mesclagem (função pura, testada)

`resolveHomeLayout(saved, registry)` → lista final `[{id, visible}]`:

1. Mantém, na ordem salva, os itens cujo `id` existe no registro (descarta desconhecidos e duplicados).
2. Acrescenta no fim os blocos do registro que não estão salvos, com a visibilidade padrão deles.
3. Se nenhum item ficou visível, liga o primeiro bloco do registro (mínimo de 1 ligado).
4. `saved` nulo/inválido → padrão.

## Front

- `src/hooks/useHomeLayout.js`: lê `profile.home_layout`, devolve o layout resolvido, `save(layout)`
  (RPC, atualização otimista, reverte e mostra erro se falhar) e `reset()` (grava `null`).
- `src/components/HomeCustomizeDialog.jsx`: painel aberto pelo botão "Personalizar" no topo da home.
  Lista os blocos, cada um com alça de arrastar, chave liga/desliga e botões ▲▼ (alternativa
  ao arrastar, para toque e teclado). Reordenação com `@dnd-kit` (`sortable`), alça como único
  ponto de arrasto e atraso curto no toque, para não competir com a rolagem. Rodapé: "Voltar ao
  padrão" e "Salvar". A última chave ligada fica desabilitada. Textos e alvos de toque grandes.
- `src/pages/Feed.jsx`: passa a desenhar os blocos do layout resolvido. Cada bloco vira um
  componente que busca os próprios dados (eventos, notícias, artigos, novidades), então bloco
  escondido não faz requisição. O estado de erro e os esqueletos de carregamento ficam por bloco.
  O `h1` oculto e o `HorizontalScroller` continuam como hoje.
- Bloco `dashboard-uno`: `React.lazy` de `UnoDashboardView` com `embedded`, com fallback de esqueleto.

## Dashboard em modo `embedded`

- Extrair o corpo de `DashboardUno.jsx` para `UnoDashboardView({ embedded })` (mover, não reescrever).
  A página `/dashboard-uno` renderiza `<UnoDashboardView />` sem `embedded`: comportamento idêntico ao de hoje.
- Com `embedded`: sem botão de imprimir/exportar, sem `id="uno-dashboard-report"` e sem classes de
  impressão (`report-print-mode`), então o `dashboardPrint.css` e o `window.print()` não se aplicam à home.
  Filtros de mês/ano/cliente continuam (são de visualização). Inclui um link "Abrir relatório completo"
  para `/dashboard-uno`.
- Quem não é Cliente Lema continua vendo o cliente de demonstração e o `UnoCta`, como na página.

## Erros e casos de borda

- Falha ao salvar: mantém o painel aberto, mostra aviso, não altera a home.
- `home_layout` corrompido: cai no padrão (regra 4).
- Dashboard falhou ao carregar na home: mostra a mensagem de erro dentro do bloco, sem afetar os outros.

## Testes

- Unit (vitest) de `resolveHomeLayout`: bloco novo no registro, bloco removido, duplicados,
  tudo desligado, nulo/inválido.
- Teste do `HomeCustomizeDialog`: não permite desligar o último bloco; "Voltar ao padrão" restaura.
- Verificação manual: relatório de `/dashboard-uno` imprime igual a antes; home com dashboard ligado não tem botão de exportar.

## Perguntas em aberto para o plano

- Como o `AuthContext` vai refletir o `home_layout` salvo (expor `refreshProfile` vs. `setProfile`).
- Se `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` entram como dependências novas (sim, a menos que se prefira só ▲▼).
