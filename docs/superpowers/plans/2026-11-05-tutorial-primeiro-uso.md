# Tutorial de primeiro uso — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tour guiado com spotlight na primeira abertura do app (primeiro assunto: instalar o app), mobile-first e acessível para público 50+.

**Architecture:** `react-joyride` v3 em modo não controlado, com cartão próprio. Passos vêm de uma função pura. O "já viu" fica em `profiles.tutorial_seen_at`, gravado por RPC. O `AppTour` mora no `Feed`.

**Tech Stack:** React 18, MUI 7, `react-joyride` 3.x (novo), Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-tutorial-primeiro-uso-design.md`

## Global Constraints

- Textos da interface em PT-BR com acentos corretos; sem jargão técnico (nada de "PWA").
- Alvos de toque ≥ 48 px; texto do cartão 18 px.
- "Já viu" no banco, nunca em `localStorage`.
- **Ordem obrigatória:** migração aplicada no banco ANTES de o `AuthContext` selecionar `tutorial_seen_at` (senão o perfil não carrega e o login quebra). A aplicação no banco remoto precisa de autorização explícita do Gabriel.
- Sem commit/push sem o Gabriel pedir (o push só depois do tutorial aprovado).

---

### Task 1: Migração `tutorial_seen_at`

**Files:**
- Create: `supabase/migrations/20261105000002_tutorial_seen.sql`

**Interfaces:**
- Produces: coluna `profiles.tutorial_seen_at timestamptz`; RPC `mark_tutorial_seen()`.

- [ ] **Step 1: Escrever a migração**

```sql
-- Tutorial de primeiro uso: marca de que o usuario ja viu o tour.
-- profiles bloqueia UPDATE direto (RLS), entao a escrita vai por RPC.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tutorial_seen_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_tutorial_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles SET tutorial_seen_at = now() WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.mark_tutorial_seen() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_tutorial_seen() TO authenticated;
```

- [ ] **Step 2: PARAR e pedir autorização ao Gabriel para `supabase db push`.** Depois de aplicar, conferir a coluna e a função (`supabase db query --linked -f <arquivo.sql>` com `information_schema.columns` e `pg_proc`).

- [ ] **Step 3:** Em `src/contexts/AuthContext.jsx`, acrescentar `, tutorial_seen_at` ao fim da string do `.select(...)` do `loadProfile` (hoje termina em `home_layout`). Só depois do Step 2.

- [ ] **Step 4:** `npm run test:run -- tests/AuthContext.test.jsx` → PASS.

---

### Task 2: Instalar `react-joyride` e criar os passos (`buildTourSteps`)

**Files:**
- Modify: `package.json`
- Create: `src/tour/tourSteps.jsx`
- Test: `tests/tourSteps.test.jsx`

**Interfaces:**
- Produces: `buildTourSteps({ isMobile: boolean, showInstall: boolean }): Step[]`, onde cada `Step` tem `id`, `target`, `title`, `content` (+ `placement`, `skipBeacon`).

- [ ] **Step 1: Instalar**

Run: `npm install react-joyride`

- [ ] **Step 2: Teste que falha** — `tests/tourSteps.test.jsx`

```jsx
import { describe, it, expect } from 'vitest'
import { buildTourSteps } from '../src/tour/tourSteps'

const ids = (steps) => steps.map((s) => s.id)

describe('buildTourSteps', () => {
  it('sem instalar: boas-vindas, menu, eventos, noticias, sino, personalizar, fim', () => {
    expect(ids(buildTourSteps({ isMobile: true, showInstall: false }))).toEqual([
      'boas-vindas', 'menu', 'eventos', 'noticias', 'sino', 'personalizar', 'fim'
    ])
  })

  it('com instalar: o passo de instalacao vem logo depois das boas-vindas', () => {
    expect(ids(buildTourSteps({ isMobile: true, showInstall: true })).slice(0, 3)).toEqual([
      'boas-vindas', 'instalar', 'menu'
    ])
  })

  it('o alvo do menu muda entre celular e computador', () => {
    const menu = (isMobile) =>
      buildTourSteps({ isMobile, showInstall: false }).find((s) => s.id === 'menu').target
    expect(menu(true)).toBe('[data-tour="menu-mobile"]')
    expect(menu(false)).toBe('[data-tour="menu-desktop"]')
  })

  it('todo passo tem titulo e conteudo; passos centrais usam body', () => {
    for (const s of buildTourSteps({ isMobile: true, showInstall: true })) {
      expect(s.title).toBeTruthy()
      expect(s.content).toBeTruthy()
    }
    const welcome = buildTourSteps({ isMobile: true, showInstall: false })[0]
    expect(welcome.target).toBe('body')
    expect(welcome.placement).toBe('center')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar** — `npm run test:run -- tests/tourSteps.test.jsx` → FAIL (módulo não existe).

- [ ] **Step 4: Implementar** — `src/tour/tourSteps.jsx`

```jsx
import InstallGuide from './InstallGuide'

const center = { target: 'body', placement: 'center', skipBeacon: true }

// Funcao pura: o AppTour fixa o resultado na montagem.
export function buildTourSteps({ isMobile, showInstall }) {
  const steps = [
    {
      id: 'boas-vindas',
      ...center,
      title: 'Bem-vindo ao RPPApp',
      content: 'Vamos conhecer o app em 1 minuto. Você pode parar quando quiser.'
    }
  ]

  if (showInstall) {
    steps.push({
      id: 'instalar',
      ...center,
      title: 'Coloque o app na sua tela inicial',
      content: <InstallGuide />
    })
  }

  steps.push(
    {
      id: 'menu',
      target: isMobile ? '[data-tour="menu-mobile"]' : '[data-tour="menu-desktop"]',
      placement: isMobile ? 'bottom' : 'right',
      skipBeacon: true,
      title: 'O menu',
      content: 'Por aqui você chega a tudo: notícias, artigos, materiais de apoio e eventos.'
    },
    {
      id: 'eventos',
      target: '[data-tour="eventos"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Próximos eventos',
      content: 'Aqui aparecem os próximos congressos e cursos de RPPS. Toque num evento para ver os detalhes.'
    },
    {
      id: 'noticias',
      target: '[data-tour="noticias"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Notícias de mercado',
      content: 'As notícias mais recentes sobre RPPS e investimentos, reunidas num só lugar.'
    },
    {
      id: 'sino',
      target: '[data-tour="sino"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Avisos',
      content: 'O sininho mostra os avisos para você. Ative as notificações para não perder nada.'
    },
    {
      id: 'personalizar',
      target: '[data-tour="personalizar"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Deixe do seu jeito',
      content: 'Aqui você escolhe o que aparece na sua tela inicial e em que ordem.'
    },
    {
      id: 'fim',
      ...center,
      title: 'Pronto!',
      content: 'Para ver este tutorial de novo, abra o menu, toque em Ajuda e depois em “Ver o tutorial de novo”.'
    }
  )

  return steps
}
```

(Depende da Task 3, `InstallGuide`; rodar o teste só depois dela.)

---

### Task 3: `InstallGuide` (passo de instalação)

**Files:**
- Create: `src/tour/InstallGuide.jsx`

**Interfaces:**
- Consumes: `usePWAInstall()` → `{ install, canPrompt, isInstalled, isIOS }` (`src/hooks/usePWAInstall.js`).
- Produces: `<InstallGuide />` (default export).

- [ ] **Step 1: Implementar**

```jsx
import { Box, Button, Stack, Typography } from '@mui/material'
import { usePWAInstall } from '../hooks/usePWAInstall'

const RING = '#d32f2f'

// Desenhos simples em SVG (nao prints): nao envelhecem com as versoes do iOS/Android.
function IOSBarMock() {
  return (
    <svg role="img" aria-label="Barra do Safari com o botão de compartilhar circulado" viewBox="0 0 240 64" width="100%" style={{ maxWidth: 300 }}>
      <rect x="4" y="12" width="232" height="44" rx="14" fill="#e6ebf2" />
      <text x="30" y="42" textAnchor="middle" fontSize="20" fill="#5b6575">‹</text>
      <text x="75" y="42" textAnchor="middle" fontSize="20" fill="#5b6575">›</text>
      {/* quadrado com seta para cima = compartilhar */}
      <rect x="110" y="30" width="20" height="16" rx="3" fill="none" stroke="#1565c0" strokeWidth="2.5" />
      <path d="M120 36 V16 M113 23 L120 16 L127 23" fill="none" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="32" r="22" fill="none" stroke={RING} strokeWidth="3" />
      <rect x="157" y="26" width="16" height="14" rx="2" fill="none" stroke="#5b6575" strokeWidth="2" />
      <rect x="200" y="26" width="14" height="14" rx="2" fill="none" stroke="#5b6575" strokeWidth="2" />
    </svg>
  )
}

function AndroidBarMock() {
  return (
    <svg role="img" aria-label="Barra do navegador com os três pontinhos circulados" viewBox="0 0 240 56" width="100%" style={{ maxWidth: 300 }}>
      <rect x="4" y="8" width="232" height="40" rx="10" fill="#e6ebf2" />
      <rect x="14" y="17" width="150" height="22" rx="11" fill="#ffffff" />
      <circle cx="208" cy="20" r="2.8" fill="#1565c0" />
      <circle cx="208" cy="28" r="2.8" fill="#1565c0" />
      <circle cx="208" cy="36" r="2.8" fill="#1565c0" />
      <circle cx="208" cy="28" r="19" fill="none" stroke={RING} strokeWidth="3" />
    </svg>
  )
}

function Step({ n, children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          flexShrink: 0, width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main',
          color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontWeight: 700
        }}
      >
        {n}
      </Box>
      <Typography sx={{ fontSize: 18, lineHeight: 1.45 }}>{children}</Typography>
    </Stack>
  )
}

export default function InstallGuide() {
  const { install, canPrompt, isInstalled, isIOS } = usePWAInstall()

  if (isInstalled) {
    return <Typography sx={{ fontSize: 18 }}>Pronto! O RPPApp já está na sua tela inicial.</Typography>
  }

  if (canPrompt) {
    return (
      <Stack spacing={2}>
        <Typography sx={{ fontSize: 18 }}>
          Tenha o RPPApp na tela inicial do celular, como um aplicativo. Toque no botão e confirme.
        </Typography>
        <Button variant="contained" size="large" onClick={install} sx={{ minHeight: 56, fontSize: 18 }}>
          Instalar agora
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      {isIOS ? <IOSBarMock /> : <AndroidBarMock />}
      {isIOS ? (
        <>
          <Step n={1}>Toque no botão de compartilhar (o quadrado com uma seta para cima), na barra de baixo do Safari.</Step>
          <Step n={2}>Role a lista e toque em “Adicionar à Tela de Início”.</Step>
          <Step n={3}>Toque em “Adicionar”. O ícone do RPPApp aparece na sua tela.</Step>
        </>
      ) : (
        <>
          <Step n={1}>Toque nos três pontinhos (⋮), no canto de cima do navegador.</Step>
          <Step n={2}>Toque em “Instalar aplicativo” ou “Adicionar à tela inicial”.</Step>
          <Step n={3}>Confirme. O ícone do RPPApp aparece na sua tela.</Step>
        </>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: Rodar o teste dos passos**

Run: `npm run test:run -- tests/tourSteps.test.jsx`
Expected: PASS (4 testes).

---

### Task 4: `TourTooltip` (cartão do tour)

**Files:**
- Create: `src/tour/TourTooltip.jsx`
- Test: `tests/tourTooltip.test.jsx`

**Interfaces:**
- Consumes: render props do joyride `{ backProps, primaryProps, skipProps, tooltipProps, index, size, step }`.
- Produces: `<TourTooltip {...renderProps} />` (default export).

- [ ] **Step 1: Teste que falha** — `tests/tourTooltip.test.jsx`

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TourTooltip from '../src/tour/TourTooltip'

function setup(index, size = 3) {
  const props = {
    index,
    size,
    step: { title: 'Menu', content: 'Texto do passo' },
    tooltipProps: { role: 'dialog' },
    backProps: { onClick: vi.fn() },
    primaryProps: { onClick: vi.fn() },
    skipProps: { onClick: vi.fn() }
  }
  render(<TourTooltip {...props} />)
  return props
}

describe('TourTooltip', () => {
  it('mostra o passo X de Y, titulo e conteudo', () => {
    setup(0)
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()
    expect(screen.getByText('Texto do passo')).toBeInTheDocument()
  })

  it('no primeiro passo nao tem Voltar e tem Proximo e Agora nao', () => {
    setup(0)
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agora não' })).toBeInTheDocument()
  })

  it('no ultimo passo o botao e Concluir e nao tem Agora nao', () => {
    setup(2)
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agora não' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- tests/tourTooltip.test.jsx` → FAIL.

- [ ] **Step 3: Implementar** — `src/tour/TourTooltip.jsx`

```jsx
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { DISPLAY_FONT } from '../theme/theme'

// Cartao do tour: texto grande e botoes grandes (publico 50+).
export default function TourTooltip({ backProps, index, primaryProps, size, skipProps, step, tooltipProps }) {
  const isLast = index === size - 1
  return (
    <Paper
      {...tooltipProps}
      elevation={8}
      sx={{ p: 3, borderRadius: 3, width: 'min(420px, calc(100vw - 32px))', maxHeight: '85vh', overflowY: 'auto' }}
    >
      <Typography variant="overline" color="text.secondary">
        {`Passo ${index + 1} de ${size}`}
      </Typography>
      {step.title && (
        <Typography variant="h5" component="h2" sx={{ fontFamily: DISPLAY_FONT, mb: 1 }}>
          {step.title}
        </Typography>
      )}
      <Box sx={{ fontSize: 18, lineHeight: 1.5 }}>{step.content}</Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
        {!isLast && (
          <Button {...skipProps} size="large" sx={{ minHeight: 48 }}>
            Agora não
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {index > 0 && (
          <Button {...backProps} variant="outlined" size="large" sx={{ minHeight: 48, minWidth: 96 }}>
            Voltar
          </Button>
        )}
        <Button {...primaryProps} variant="contained" size="large" sx={{ minHeight: 48, minWidth: 120 }}>
          {isLast ? 'Concluir' : 'Próximo'}
        </Button>
      </Stack>
    </Paper>
  )
}
```

- [ ] **Step 4: Rodar e ver passar** — `npm run test:run -- tests/tourTooltip.test.jsx` → PASS (3 testes).

---

### Task 5: `AppTour` e ligação nos elementos

**Files:**
- Create: `src/tour/AppTour.jsx`
- Modify: `src/pages/Feed.jsx`, `src/components/home/HomeBlocks.jsx`, `src/components/Layout/TopBar.jsx`, `src/components/Layout/Sidebar.jsx`, `src/components/NotificationBell.jsx`, `src/pages/Help.jsx`, `src/components/InstallPrompt.jsx`

**Interfaces:**
- Consumes: `buildTourSteps`, `TourTooltip`, `useAuth()` → `{ profile, loading, refreshProfile }`, `usePWAInstall()`, `supabase.rpc('mark_tutorial_seen')`.
- Produces: `<AppTour />` (default export); atributos `data-tour` = `menu-mobile`, `menu-desktop`, `eventos`, `noticias`, `sino`, `personalizar`.

- [ ] **Step 1: Criar `src/tour/AppTour.jsx`**

```jsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Joyride, STATUS } from 'react-joyride'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { buildTourSteps } from './tourSteps'
import TourTooltip from './TourTooltip'

const IS_PHONE = /iphone|ipad|ipod|android/i

// Roda na home: na 1a vez (tutorial_seen_at nulo) ou quando vem de "Ver o tutorial de novo".
export default function AppTour() {
  const { profile, refreshProfile } = useAuth()
  const { isInstalled } = usePWAInstall()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'))
  const [done, setDone] = useState(false)
  // Fixa os passos na montagem: se o usuario instalar o app no meio do tour, a lista nao muda.
  const [steps] = useState(() =>
    buildTourSteps({ isMobile, showInstall: IS_PHONE.test(navigator.userAgent) && !isInstalled })
  )

  const replay = Boolean(location.state?.tour)
  const run = !done && Boolean(profile) && (replay || !profile.tutorial_seen_at)

  const finish = async () => {
    setDone(true)
    if (replay) navigate(location.pathname, { replace: true, state: null })
    const { error } = await supabase.rpc('mark_tutorial_seen')
    if (error) console.error('Erro ao marcar tutorial como visto:', error.message)
    else await refreshProfile()
  }

  if (!run) return null

  return (
    <Joyride
      continuous
      run
      steps={steps}
      tooltipComponent={TourTooltip}
      options={{
        zIndex: 1400, // acima do AppBar do MUI (1201) e dos dialogs (1300)
        overlayColor: 'rgba(0,0,0,0.6)',
        primaryColor: '#1565c0',
        buttons: ['back', 'primary', 'skip'],
        blockTargetInteraction: true
      }}
      onEvent={(data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) finish()
      }}
    />
  )
}
```

- [ ] **Step 2: `Feed.jsx`** — importar `AppTour` (`import AppTour from '../tour/AppTour'`), renderizar `<AppTour />` logo antes de `<HomeCustomizeDialog .../>`, e no botão Personalizar acrescentar `data-tour="personalizar"`.

- [ ] **Step 3: `HomeBlocks.jsx`** — no `Stack` raiz de `SectionHeader`, acrescentar `data-tour={id}`.

- [ ] **Step 4: `TopBar.jsx`** — no `IconButton` com `aria-label="Abrir menu"`, acrescentar `data-tour="menu-mobile"`.

- [ ] **Step 5: `Sidebar.jsx`** — ler o arquivo; no contêiner da barra lateral **permanente** (a que aparece em ≥ md, não o drawer temporário) acrescentar `data-tour="menu-desktop"`. O elemento precisa ser visível em desktop e ter tamanho (para o spotlight).

- [ ] **Step 6: `NotificationBell.jsx`** — no `IconButton` que tem `aria-label` de notificações (linha ~69), acrescentar `data-tour="sino"`.

- [ ] **Step 7: `Help.jsx`** — importar `Button` do MUI e `useNavigate`; abaixo do texto de apresentação, acrescentar:

```jsx
<Button variant="outlined" size="large" sx={{ mb: 3, minHeight: 48 }} onClick={() => navigate('/', { state: { tour: true } })}>
  Ver o tutorial de novo
</Button>
```
(com `const navigate = useNavigate()` no componente).

- [ ] **Step 8: `InstallPrompt.jsx`** — importar `useAuth`; após os hooks existentes, antes do `return null`, tratar: `const { profile, loading } = useAuth()` junto aos outros hooks e trocar a condição por
`if (isInstalled || dismissed || loading || (profile && !profile.tutorial_seen_at) || !(isIOS || isAndroid)) return null`.

- [ ] **Step 9:** `npm run lint && npm run test:run && npm run build` → sem erros novos (o erro antigo de `LandingShowcase.jsx` é conhecido).

---

### Task 6: Verificação no navegador

- [ ] **Step 1:** Com a migração aplicada e o `AuthContext` lendo `tutorial_seen_at`, abrir `http://localhost:5173/` logado no Chrome. Como o usuário atual não tem a marca, o tour deve abrir sozinho.
- [ ] **Step 2:** Percorrer desktop: boas-vindas → menu (barra lateral) → eventos → notícias → sino → personalizar → fim. Conferir spotlight, botões grandes, "Voltar", "Agora não".
- [ ] **Step 3:** Repetir em largura de celular (janela ~390 px): passo de instalação aparece (se UA de celular) e o menu aponta o botão "Abrir menu". Se não der para simular o User-Agent, conferir o `InstallGuide` pelo teste/manual do Gabriel no aparelho.
- [ ] **Step 4:** Concluir, recarregar: o tour NÃO reaparece. Em Ajuda → "Ver o tutorial de novo": reaparece, e some ao terminar (sem reiniciar ao recarregar).
- [ ] **Step 5:** Informar o Gabriel do resultado, o que não foi possível comprovar, e perguntar sobre o commit (push só depois).
