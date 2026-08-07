---
name: Radar Lema
description: Centralizador de eventos para RPPS — PWA sóbrio e confiável, ancorado em um azul de confiança.
colors:
  primary: "#1976d2"
  primary-light: "#8ec6fa"
  primary-dark: "#155494"
  primary-50: "#eef6ff"
  primary-100: "#d9ecfe"
  primary-200: "#bcdcfd"
  primary-400: "#59a8f4"
  primary-500: "#2f8be8"
  primary-700: "#1563b4"
  primary-900: "#174a7a"
  favorite: "#e0436f"
  favorite-light: "#f07497"
  favorite-dark: "#bf3357"
  neutral-50: "#f7f8fa"
  neutral-100: "#eef0f4"
  neutral-200: "#dfe2ea"
  neutral-300: "#c6cbd8"
  neutral-400: "#a6adbe"
  neutral-500: "#82899e"
  neutral-600: "#6b738a"
  neutral-700: "#565d73"
  neutral-800: "#3b4155"
  neutral-900: "#232840"
  surface-light: "#ffffff"
  background-light: "#f6f7f9"
  surface-dark: "#1e293b"
  background-dark: "#0f172a"
  text-light: "#1e293b"
  text-muted-light: "#5f6b7e"
  text-dark: "#f1f5f9"
  text-muted-dark: "#94a3b8"
typography:
  display:
    fontFamily: "Manrope"
    fontWeight: 800
  headline:
    fontFamily: "Manrope"
    fontWeight: 800
  title:
    fontFamily: "Manrope"
    fontWeight: 700
  subtitle:
    fontFamily: "Manrope"
    fontWeight: 600
  body:
    fontFamily: "Manrope"
  button:
    fontFamily: "Manrope"
    fontWeight: 700
rounded:
  sm: "10px"
  md: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    typography: "{typography.button}"
  button-ghost:
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    typography: "{typography.button}"
  card:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.md}"
  chip:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.neutral-800}"
    rounded: "{rounded.md}"
  nav-appbar:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
  nav-active:
    backgroundColor: "rgba(255, 255, 255, 0.2)"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  favorite-icon:
    textColor: "{colors.favorite}"
  bottomnav-selected:
    textColor: "{colors.primary}"
    typography: "{typography.button}"
  bottomnav-admin:
    backgroundColor: "rgba(25, 118, 210, 0.12)"
---

# Design System: Radar Lema

## Overview

**Creative North Star: "O Farol Azul"**

O Radar Lema é o farol do ecossistema RPPS: um azul estável, sóbrio e de
confiança navega o usuário pelos eventos da Lema. A direção do redesign foi
explícita — **"manter azul, só recompor"**. A identidade herdada (o azul
âncora `#1976d2`) permanece intocada em matiz; o que mudou foi o tom: uma
escala azul completa com brilhos mais frios, uma escala neutra dedicada para
texto/superfície, tipografia Manrope em uma única voz, cantos generosos e
sombra de card discreta. O rosa dos favoritos é a única concessão — um sinal
de afeto que não compete com o azul da marca.

Densidade média-baixa, ar limpo e um único acento. A estética não grita:
é o material de quem cuida de previdência.

**Key Characteristics:**
- Um único acento de marca (azul) em todas as telas; o rosa é reservado ao coração de favorito.
- Manrope como única família tipográfica, com peso e hierarquia claros (800 display/título, 700 botões, 600 subtítulos).
- Cantos generosos e consistentes: 10px em controles, 14px em cards.
- Cards flutuam com sombra suave; o resto da interface é plana, sem bordas duras.
- Barra de navegação desktop usa pills brancas semitransparentes no item ativo.

## Colors

Paleta sóbria, fria e de alto contraste: um azul único de marca apoiado por
neutros dedicados. **O azul é a marca; os neutros são o palco; o rosa é o
afeto.**

### Primary
- **Azul Radar** (`#1976d2`): o único acento da marca. Usado em AppBar, botão primário, itens selecionados do menu inferior, links, foco e gráficos "Usuários" do dashboard. Nunca é substituído por outro matiz.
- **Azul Radar Claro** (`#8ec6fa`): hover/efeitos claros sobre azul no modo claro.
- **Azul Radar Escuro** (`#155494`): hover/pressionado sobre superfícies no modo escuro.

### Secondary (omitido — o sistema tem um só acento)

### Tertiary (omitido)

### Neutral
- **Grafite Tinta** (`#232840` → `#565d73`): texto primário e secundário no modo claro (`#1e293b` / `#5f6b7e`).
- **Papel Frio** (`#f7f8fa`): fundo de página (`#f6f7f9`) e superfícies (`#ffffff`) no modo claro.
- **Tinta Noturna** (`#232840`): texto primário do modo escuro (`#f1f5f9` / `#94a3b8`).
- **Noite** (`#0f172a`): fundo de página do modo escuro; superfícies em `#1e293b`.

### Favorito
- **Rosa Radar** (`#e0436f`): cor exclusiva do coração de favorito (card, detalhe) e do gráfico "Favoritos" no dashboard. Não usar `error`/cinza para estado favoritado.

### Named Rules
**The Blue Anchor Rule.** `#1976d2` é a única cor de marca. Toda recomposição
muda tom, tipo e espaço — nunca o matiz. Se uma cor de marca nova for
necessária, a decisão é de produto, não de estilo.
**The Favorite Rose Rule.** O coração favoritado usa `favorite.main`
(`#e0436f`). Nunca usar vermelho de `error` nem cinza para expressar favorito.

## Typography

**Display Font:** Manrope (com fallback Helvetica Neue / Arial)
**Body Font:** Manrope
**Label/Mono Font:** nenhuma — uma única voz tipográfica

**Character:** Manrope é geométrica, moderna e neutra, com peso forte em
títulos. O Radar a usa em uma só família para soar coeso e confiável — a
Roboto foi removida do carregamento; não há segunda família.

### Hierarchy
- **Display** (800, ~34px, 1.2): capas de seção e o título do evento no topo do detalhe. Uso raro — reservado a momentos de leitura.
- **Headline** (800, ~28px, 1.25): título das páginas principais (Listagem, Gestão, Admin).
- **Title** (700, ~20px, 1.3): títulos de card (`h6`) e de seção do formulário.
- **Body** (400, ~14px, 1.5): texto corrente e descrições. Linha de ~65ch.
- **Label** (600, 12–13px): metadados, chips, itens de menu, tabs.

### Named Rules
**The Single Voice Rule.** Manrope em todos os níveis. Não misturar com outra
família (Roboto foi removida de `index.html`).

## Layout

Layout de coluna única em mobile com `maxWidth` centralizado em telas
maiores; grid de cards responsivo na listagem (1 coluna mobile, 2–3
desktop). Densidade média-baixa: `gap` de 8–16px entre blocos, 24px entre
seções. A barra inferior de navegação é o shell mobile (abaixo de `md`); a
navbar desktop aparece em `md+`. Filtros colapsam em um botão "Filtros" no
mobile para preservar o espaço vertical.

## Elevation & Depth

Sistema híbrido: superfícies planas em repouso e elevação suave apenas nos
cards. Não há sombras em botões ou chips — eles se diferenciam por cor e
estado, não por profundidade.

### Shadow Vocabulary
- **Card** (modo claro, `0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)`): a única sombra do sistema; flutuação leve e ambiental.
- **Card** (modo escuro, `0 1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.25)`): mesma leitura de profundidade sobre o fundo noturno.
- **Drawer** (mobile): superfície plana do tema; a navegação mobile não eleva — ela desliza da borda esquerda sobre o conteúdo.

### Named Rules
**The Quiet Elevation Rule.** Cards flutuam; todo o resto é plano. Bordas
duras em cards são desencorajadas — profundidade é sinalizada por sombra, não
por contorno.

## Shapes

Linguagem de formas generosa e consistente: raio base de **10px** em todos
os controles (botões, campos, chips) e **14px** em cards. Pill branca
semitransparente para o item ativo da navbar desktop; grupo staff
(Categorias+Gestão) num contêiner com borda `primary.light` (raio 12px).

## Components

### Buttons
- **Shape:** cantos suaves (10px), sem `textTransform` — rótulos em sentence case.
- **Primary:** azul Radar (`#1976d2`) com texto branco, peso 700.
- **Hover / Focus:** tom mais escuro/claro conforme o modo (blue-800 no claro, blue-400 no escuro) via tokens `primary.dark`/`primary.light`.
- **Ghost:** texto em `primary.main`, sem fundo.

### Chips
- **Style:** fundo neutro-100 no claro, texto neutro-800; peso 600.
- **State:** chip selecionado de filtro com fundo azul e texto branco; chip "Lema Edu" sem brilho animado (sem shimmer).

### Cards / Containers
- **Corner Style:** cantos generosos (14px).
- **Background:** superfície do tema (`#ffffff` claro / `#1e293b` escuro).
- **Shadow Strategy:** sombra suave ambiental (ver Elevation).
- **Border:** nenhuma borda estrutural.
- **Internal Padding:** escala de 8–16px (16px no conteúdo).

### Inputs / Fields
- **Style:** stroke fino neutro, raio 10px, fundo da superfície.
- **Focus:** borda azul Radar (`primary.main`), sem glow exagerado.

### Navigation
- **Desktop:** AppBar azul (`primary.main`) com texto branco. Item ativo = pill branca `rgba(255,255,255,0.2)` + peso 800; hover = pill mais forte. Grupo staff (Categorias + Gestão) agrupado num contêiner com borda `primary.light` e fundo translúcido; item admin (Painel Admin) = pill com fundo azul claro (`rgba(142,198,250,0.28)`, ativo `0.45`) e borda branca para separar o bloco. Rótulos com `whiteSpace: nowrap`.
- **Mobile:** botão hambúrguer na AppBar abre um `Drawer` lateral com todas as seções (ícone + rótulo) separadas por `Divider` entre os grupos (client / staff / admin), item ativo destacado, toggle de tema e Sair/Entrar no rodapé.

### Favorito (coração)
- Ícone coração: rosa Radar (`favorite.main`) quando favoritado, cinza quando não. `aria-label` dinâmico ("Favoritar" / "Remover dos favoritos").

## Do's and Don'ts

### Do:
- **Do** usar `primary.main` (`#1976d2`) para todo acento de marca: AppBar, botão primário, seleção, links, gráficos de usuários.
- **Do** reservar `favorite.main` (`#e0436f`) exclusivamente para o estado favoritado e o gráfico de favoritos.
- **Do** usar Manrope em tudo, com pesos 800 (títulos), 700 (botões) e 600 (labels/chips).
- **Do** manter cantos de 10px em controles e 14px em cards.
- **Do** sinalizar profundidade com sombra suave de card; o resto permanece plano.

### Don't:
- **Don't** trocar o matiz azul por outra cor de marca (a recomposição é de tom, tipo e espaço).
- **Don't** usar `error` ou cinza para o coração favoritado — favorito é rosa.
- **Don't** adicionar uma segunda família tipográfica (Roboto foi removida).
- **Don't** colocar bordas duras em cards — elevação vem da sombra.
- **Don't** animar chips institucionais com shimmer; o tom é sóbrio.
