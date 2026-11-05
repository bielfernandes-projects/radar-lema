# Tutorial de primeiro uso — design

Data: 2026-11-05 · Status: desenho aprovado em conversa; aguardando revisão do arquivo

## Objetivo

Um tour guiado, tela a tela, com foco (spotlight) no que está sendo explicado, na primeira
vez que o usuário logado abre o app. O público são servidores de RPPS, em geral mais velhos e
com pouca desenvoltura com tecnologia, usando principalmente o celular (mobile-first).
O primeiro assunto é **instalar o app**.

## Fora de escopo

- Tour de outras páginas além da home (Notícias, Materiais, Dashboard etc.).
- Tour para visitante anônimo (a landing pública não tem tour).
- Vídeo, imagens reais (prints) de iOS/Android, ou analytics do tour.

## Quando aparece

- Automaticamente, na home, para usuário logado cujo `profiles.tutorial_seen_at` é nulo.
- Termina (concluir **ou** "Agora não") → grava `tutorial_seen_at = now()` e não reaparece.
- "Ver o tutorial de novo": botão em Ajuda → Dúvidas, que navega para `/` com `state { tour: true }`.
- Ninguém recebe a marca por retroação: **todo usuário atual verá o tour uma vez** (útil como teste
  antes do Go Live). Reversível: bastaria marcar os atuais como vistos.
- Enquanto o tour não foi visto (e o perfil ainda está carregando), o pop-up `InstallPrompt` fica
  escondido, porque o passo de instalação do tour o substitui. Depois, volta a funcionar como hoje.

## Passos (mobile-first)

| id | alvo | observação |
|----|------|-----------|
| `boas-vindas` | centro | "Vamos conhecer o RPPApp em 1 minuto" |
| `instalar` | centro | só se celular **e** não instalado; ver abaixo |
| `menu` | `[data-tour="menu-mobile"]` (celular) ou `menu-desktop` | botão do menu / barra lateral |
| `eventos` | `[data-tour="eventos"]` | cabeçalho do bloco na home |
| `noticias` | `[data-tour="noticias"]` | cabeçalho do bloco na home |
| `sino` | `[data-tour="sino"]` | "ative os avisos" |
| `personalizar` | `[data-tour="personalizar"]` | liga com a home personalizável |
| `fim` | centro | "Para rever, vá em Ajuda" |

Passo cujo alvo não existe (ex.: bloco escondido por quem personalizou a home) é pulado pelo
próprio `react-joyride` (modo não controlado).

### Passo de instalação (`InstallGuide`)

- Já instalado → mensagem "Pronto! O RPPApp já está na sua tela inicial."
- Navegador oferece instalação (`canPrompt`) → botão grande "Instalar agora" (usa `usePWAInstall().install`).
- Senão, 3 quadros numerados com texto grande + um desenho em SVG (feito por nós) mostrando a barra do
  navegador com o botão certo circulado: **iPhone** (Compartilhar → Adicionar à Tela de Início → Adicionar)
  ou **Android** (⋮ → Instalar aplicativo → confirmar). Sem prints: eles envelhecem a cada versão de iOS/Android.

## Acessibilidade e público 50+

- Cartão com texto de 18 px, um assunto por tela, "Passo X de Y".
- Botões "Próximo"/"Voltar" com 48 px ou mais; "Agora não" (pular) visível em todo passo menos o último.
- Sem avanço automático; sem sinalizador pulsante; `role="dialog"` do próprio joyride.
- Linguagem de gente: nada de "PWA", "instalar PWA", "service worker".

## Dados

- Coluna `profiles.tutorial_seen_at timestamptz` (nula = não viu).
- RPC `mark_tutorial_seen()` (`SECURITY DEFINER`, mesmo molde de `update_my_home_layout`): define
  `tutorial_seen_at = now()` do usuário logado. Sem argumento, sem validação extra.
- `AuthContext.loadProfile` passa a selecionar `tutorial_seen_at`.
- No banco, não no `localStorage`: o iOS separa o armazenamento do app instalado do Safari, e o tour
  recomeçaria na primeira abertura do app instalado.

## Código

- Dependência nova: `react-joyride` 3.x (peer React 16.8–19).
- `src/tour/tourSteps.jsx`: `buildTourSteps({ isMobile, showInstall })` → lista de passos (função pura, testada).
- `src/tour/InstallGuide.jsx`: conteúdo do passo de instalação + os SVGs.
- `src/tour/TourTooltip.jsx`: cartão próprio (`tooltipComponent`) em PT-BR, alvos de toque grandes.
- `src/tour/AppTour.jsx`: decide se roda, monta o `<Joyride>`, e no fim chama a RPC + `refreshProfile`.
  A lista de passos é fixada na montagem (não muda se o usuário instalar o app no meio do tour).
  `options.zIndex` acima do `AppBar` do MUI (1201).
- `data-tour` nos elementos: botão de menu do `TopBar`, barra lateral, `NotificationBell`,
  cabeçalho de cada bloco da home, botão "Personalizar".
- `Feed.jsx` renderiza `<AppTour />`; `Help.jsx` ganha "Ver o tutorial de novo"; `InstallPrompt.jsx`
  fica quieto enquanto o tour não foi visto.

## Erros e bordas

- Falha ao gravar "visto": o erro é registrado no console; no pior caso o tour reaparece no próximo acesso.
- Usuário personalizou a home: passos de blocos escondidos são pulados.
- Replay (`state.tour`): roda mesmo com `tutorial_seen_at` preenchido; ao terminar, limpa o `state` da
  navegação para não reiniciar ao recarregar.
- Anônimo: não há perfil, o tour não roda.

## Testes

- `buildTourSteps`: ordem dos ids, passo de instalação só quando pedido, alvo do menu muda com `isMobile`.
- `TourTooltip`: "Passo X de Y", rótulo "Concluir" no último, "Agora não" ausente no último.
- Manual no Chrome: tour completo na home (desktop e largura de celular), pular, concluir, recarregar (não reaparece),
  replay por Ajuda, e `InstallPrompt` calado durante o tour.
