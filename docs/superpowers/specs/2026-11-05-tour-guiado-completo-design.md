# Tour guiado completo (todas as telas) — design

Data: 2026-11-05 · Status: implementado e testado no navegador
Substitui: o desenho de "mini-tour por tela" (descartado) e amplia `2026-11-05-tutorial-primeiro-uso-design.md`,
que cobria só a home.

## Decisão

O tutorial de primeiro uso é **um tour só, que mostra o app inteiro** na ordem do menu. Terminou os passos
de uma tela, segue sozinho para a próxima (Início → Notícias → Artigos → Materiais de apoio → Eventos →
Favoritos → Novidades do UNO → Dashboard do UNO → Configurações → Ajuda). "Ver o tutorial de novo", em Ajuda,
refaz tudo. Quem abre o app pela primeira vez não precisa abrir cada aba para ver a explicação dela.

Descartado: mini-tour por tela na primeira visita, botão "?" por tela e "Não mostrar mais dicas" (os dois
últimos só faziam sentido com mini-tours).

## Quando aparece

- Automático, quando o usuário logado chega à home (`/`) com `profiles.tutorial_seen_at` nulo.
- Sob demanda: Ajuda → "Ver o tutorial de novo" (navega para `/` com `state.tour`).
- Terminar (último passo) **ou** "Agora não" em qualquer passo grava `tutorial_seen_at`. Terminar leva de volta
  à home; "Agora não" deixa o usuário onde está.
- `InstallPrompt` fica calado enquanto o tour não foi visto (o passo de instalação o substitui).

## Passos (25 no computador; 26 no celular não instalado)

Início (boas-vindas, **instalar o app** só em celular não instalado, menu, tela inicial, sino, personalizar),
Notícias (2), Artigos (2), Materiais de apoio (2), Eventos (3), Favoritos (1), Novidades do UNO (2),
Dashboard do UNO (3), Configurações (2, incluindo a aba **Instalar app**), Ajuda (2) e um passo final.
Foco de produto: o passo final **repete o guia de instalação** se o app ainda não está instalado.

## Como funciona

- `GuidedTour` fica no `Layout` (que persiste entre telas) e monta um único `<Joyride>` com todos os passos.
- Cada passo conhece a rota (`path`). O hook `before` navega até ela e **espera o alvo existir**
  (`waitForTarget`, até 10 s). Sem essa espera, o joyride procura o alvo antes de a tela carregar sob demanda,
  pula o passo e, em cadeia, o tour inteiro — foi o bug encontrado nos testes ("já pula pro concluído").
- "Voltar" também atravessa telas, porque todo passo navega para a sua rota.
- Passos fixados ao começar (instalar o app no meio do tour não muda a lista).
- O cartão (`TourTooltip`) mostra a tela atual e uma barra de progresso (o número "Passo 14 de 25" fica só no
  `aria-label`, para não desanimar). Texto de 18 px, botões de 48 px+, `aria-label` em PT-BR.

## Dados

Só `profiles.tutorial_seen_at` e a RPC `mark_tutorial_seen()`. A migração `20261105000003` (tours por tela)
ficou sem uso; `20261105000004` a desfaz.

## Testes

- `tourSteps`: ordem das telas, ids únicos, passo de instalação logo após as boas-vindas, alvo do menu por
  dispositivo, passo final, e cada `data-tour` existe no código-fonte.
- `waitForTarget`, `TourTooltip` e `InstallGuide`.
- Manual no Chrome (feito): percurso completo de 25 passos pelas 10 telas, "Voltar" entre telas, replay por Ajuda.
- Não comprovado: passo de instalação visto num celular de verdade.
