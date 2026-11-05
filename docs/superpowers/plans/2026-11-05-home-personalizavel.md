# Home personalizável — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O usuário logado escolhe quais blocos aparecem na home e em que ordem, incluindo um bloco novo "Dashboard do UNO" só para visualização.

**Architecture:** Registro de blocos (`homeBlocks.js`) + função pura que mescla o layout salvo com o registro (`resolveHomeLayout`). Layout salvo em `profiles.home_layout` (jsonb), gravado por RPC `SECURITY DEFINER`. O `Feed` desenha os blocos a partir do layout; cada bloco busca os próprios dados. O corpo de `DashboardUno` vira `UnoDashboardView` com prop `embedded`.

**Tech Stack:** React 18, MUI 7, Supabase, Vitest + Testing Library, `@dnd-kit` (novo).

**Spec:** `docs/superpowers/specs/2026-11-05-home-personalizavel-design.md`

## Global Constraints

- Idioma de textos da interface: PT-BR, com acentos corretos.
- Alvos de toque grandes (público 50+); sem texto técnico.
- `localStorage` NÃO guarda o layout (iOS separa o armazenamento do app instalado).
- Padrão: eventos, noticias, artigos, novidades-uno ligados; dashboard-uno desligado. Mínimo de 1 bloco ligado.
- O relatório de `/dashboard-uno` não pode mudar (CSS de impressão está escopado por `#uno-dashboard-report.report-print-mode`).
- **Ordem obrigatória:** migração aplicada no banco ANTES de o `AuthContext` passar a selecionar `home_layout` (senão `loadProfile` falha e o login quebra).
- Commits: só quando o Gabriel pedir. Mensagens em PT-BR, estilo `feat(home): ...`.

---

### Task 1: Migração + leitura do perfil

**Files:**
- Create: `supabase/migrations/20261105000001_home_layout.sql`
- Modify: `src/contexts/AuthContext.jsx:22-24` (string do `select`)

**Interfaces:**
- Produces: coluna `profiles.home_layout jsonb`; RPC `update_my_home_layout(new_layout jsonb)`; `profile.home_layout` disponível via `useAuth()`.

- [ ] **Step 1: Escrever a migração**

```sql
-- Home personalizavel: ordem e visibilidade dos blocos, por usuario.
-- profiles bloqueia UPDATE direto (RLS), entao a escrita vai por RPC (mesmo molde de update_my_profile_name).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_layout jsonb;

CREATE OR REPLACE FUNCTION public.update_my_home_layout(new_layout jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  item jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- NULL (ou JSON null) = voltar ao padrao
  IF new_layout IS NULL OR jsonb_typeof(new_layout) = 'null' THEN
    UPDATE public.profiles SET home_layout = NULL WHERE id = uid;
    RETURN;
  END IF;

  IF jsonb_typeof(new_layout) <> 'array' OR jsonb_array_length(new_layout) > 20 THEN
    RAISE EXCEPTION 'Layout invalido';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(new_layout) LOOP
    IF jsonb_typeof(item) <> 'object'
       OR jsonb_typeof(item->'id') <> 'string'
       OR char_length(item->>'id') > 40
       OR jsonb_typeof(item->'visible') <> 'boolean' THEN
      RAISE EXCEPTION 'Layout invalido';
    END IF;
  END LOOP;

  UPDATE public.profiles SET home_layout = new_layout WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.update_my_home_layout(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_home_layout(jsonb) TO authenticated;
```

- [ ] **Step 2: PARAR e pedir autorização ao Gabriel para aplicar no banco remoto** (`supabase db push`). Só seguir depois de aplicada. Confirmar com uma consulta: a coluna existe e a função `update_my_home_layout` existe.

- [ ] **Step 3: Incluir a coluna no select do perfil**

Em `src/contexts/AuthContext.jsx`, trocar
`.select('id, email, name, user_type, role, is_uno_client, uno_client_id')` por
`.select('id, email, name, user_type, role, is_uno_client, uno_client_id, home_layout')`.

- [ ] **Step 4: Rodar os testes existentes**

Run: `npm run test:run -- tests/AuthContext.test.jsx`
Expected: PASS (o mock de `select` ignora a string).

---

### Task 2: Registro de blocos e `resolveHomeLayout`

**Files:**
- Create: `src/config/homeBlocks.js`
- Create: `src/utils/homeLayout.js`
- Test: `tests/homeLayout.test.js`

**Interfaces:**
- Produces:
  - `HOME_BLOCKS: Array<{ id: string, title: string, icon: PhosphorIcon, defaultVisible: boolean }>`
  - `resolveHomeLayout(saved: unknown, registry: Array<{id, defaultVisible}>): Array<{ id: string, visible: boolean }>`

- [ ] **Step 1: Escrever o teste que falha** — `tests/homeLayout.test.js`

```js
import { describe, it, expect } from 'vitest'
import { resolveHomeLayout } from '../src/utils/homeLayout'

const registry = [
  { id: 'a', defaultVisible: true },
  { id: 'b', defaultVisible: true },
  { id: 'c', defaultVisible: false }
]

describe('resolveHomeLayout', () => {
  it('sem layout salvo devolve o padrao', () => {
    expect(resolveHomeLayout(null, registry)).toEqual([
      { id: 'a', visible: true },
      { id: 'b', visible: true },
      { id: 'c', visible: false }
    ])
  })

  it('respeita ordem e visibilidade salvas', () => {
    const saved = [
      { id: 'b', visible: true },
      { id: 'a', visible: false },
      { id: 'c', visible: true }
    ]
    expect(resolveHomeLayout(saved, registry)).toEqual(saved)
  })

  it('bloco novo no registro entra no fim com a visibilidade padrao', () => {
    const saved = [{ id: 'b', visible: true }, { id: 'a', visible: true }]
    expect(resolveHomeLayout(saved, registry).map((i) => i.id)).toEqual(['b', 'a', 'c'])
    expect(resolveHomeLayout(saved, registry)[2].visible).toBe(false)
  })

  it('descarta ids desconhecidos e duplicados', () => {
    const saved = [
      { id: 'x', visible: true },
      { id: 'a', visible: true },
      { id: 'a', visible: false }
    ]
    const ids = resolveHomeLayout(saved, registry).map((i) => i.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('se tudo ficou desligado, liga o primeiro bloco do registro', () => {
    const saved = registry.map((b) => ({ id: b.id, visible: false }))
    const result = resolveHomeLayout(saved, registry)
    expect(result.filter((i) => i.visible).map((i) => i.id)).toEqual(['a'])
  })

  it('valor invalido cai no padrao', () => {
    expect(resolveHomeLayout('lixo', registry)).toEqual(resolveHomeLayout(null, registry))
    expect(resolveHomeLayout([null, 5, {}], registry)).toEqual(resolveHomeLayout(null, registry))
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- tests/homeLayout.test.js`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar** — `src/utils/homeLayout.js`

```js
// Mescla o layout salvo do usuario com o registro de blocos. Funcao pura.
export function resolveHomeLayout(saved, registry) {
  const known = new Set(registry.map((b) => b.id))
  const seen = new Set()
  const result = []

  if (Array.isArray(saved)) {
    for (const item of saved) {
      if (!item || !known.has(item.id) || seen.has(item.id)) continue
      seen.add(item.id)
      result.push({ id: item.id, visible: item.visible === true })
    }
  }

  for (const block of registry) {
    if (!seen.has(block.id)) result.push({ id: block.id, visible: block.defaultVisible })
  }

  if (!result.some((i) => i.visible)) {
    result.find((i) => i.id === registry[0].id).visible = true
  }
  return result
}
```

- [ ] **Step 4: Criar o registro** — `src/config/homeBlocks.js`

```js
import { BookOpen, CalendarDots, ChartLineUp, Megaphone, Newspaper } from '@phosphor-icons/react'

// Ordem aqui = ordem padrao da home. Para um bloco novo: adicionar aqui e em
// HOME_BLOCK_COMPONENTS (src/components/home/HomeBlocks.jsx).
export const HOME_BLOCKS = [
  { id: 'eventos', title: 'Próximos eventos', icon: CalendarDots, defaultVisible: true },
  { id: 'noticias', title: 'Notícias de mercado', icon: Newspaper, defaultVisible: true },
  { id: 'artigos', title: 'Artigos', icon: BookOpen, defaultVisible: true },
  { id: 'novidades-uno', title: 'Novidades do UNO', icon: Megaphone, defaultVisible: true },
  { id: 'dashboard-uno', title: 'Dashboard do UNO', icon: ChartLineUp, defaultVisible: false }
]
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run -- tests/homeLayout.test.js`
Expected: PASS (6 testes).

---

### Task 3: Extrair `UnoDashboardView` com `embedded`

**Files:**
- Move: `src/pages/DashboardUno.jsx` → `src/components/UnoDashboardView.jsx`
- Move: `src/pages/dashboardPrint.css` → `src/components/dashboardPrint.css`
- Create: `src/pages/DashboardUno.jsx` (wrapper)

**Interfaces:**
- Produces: `UnoDashboardView({ embedded?: boolean })` (default export). `embedded` esconde título + botão "Gerar Relatório" e tira o `id="uno-dashboard-report"`.

- [ ] **Step 1: Mover os arquivos (preserva o histórico)**

```bash
git mv src/pages/DashboardUno.jsx src/components/UnoDashboardView.jsx
git mv src/pages/dashboardPrint.css src/components/dashboardPrint.css
```

- [ ] **Step 2: Ajustar `UnoDashboardView.jsx`**

- `import UnoCta from '../components/UnoCta'` → `import UnoCta from './UnoCta'`
- `export default function DashboardUno() {` → `export default function UnoDashboardView({ embedded = false }) {`
- Raiz: `<Box id="uno-dashboard-report" className={...}` → `<Box id={embedded ? undefined : 'uno-dashboard-report'} className={isPrinting ? 'report-print-mode' : undefined}`
- `<Container className="report-container" maxWidth="xl" sx={{ py: 3 }}>` →
  `<Container className="report-container" maxWidth={embedded ? false : 'xl'} disableGutters={embedded} sx={{ py: embedded ? 0 : 3 }}>`
- Envolver a linha de título + botão (o `<Box className="report-header-row" ...>` inteiro, hoje linhas ~415-459) em `{!embedded && ( ... )}`.

- [ ] **Step 3: Criar o wrapper** — `src/pages/DashboardUno.jsx`

```jsx
import UnoDashboardView from '../components/UnoDashboardView'

export default function DashboardUno() {
  return <UnoDashboardView />
}
```

- [ ] **Step 4: Conferir que nada mais quebrou**

Run: `npm run lint && npm run test:run`
Expected: sem erros novos; testes passam.

- [ ] **Step 5: Verificação manual (regressão do relatório)** — com o app rodando, abrir `/dashboard-uno`: o botão "Gerar Relatório" aparece e o relatório imprime como antes (`id` presente na raiz).

---

### Task 4: Hook `useHomeLayout`

**Files:**
- Create: `src/hooks/useHomeLayout.js`

**Interfaces:**
- Consumes: `useAuth()` → `{ profile, refreshProfile }`; `HOME_BLOCKS`; `resolveHomeLayout`.
- Produces: `useHomeLayout(): { layout: Array<{id, visible}>, save(next: Array<{id,visible}> | null): Promise<void> }` — `save(null)` volta ao padrão; lança erro se a RPC falhar.

- [ ] **Step 1: Implementar**

```js
import { useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { HOME_BLOCKS } from '../config/homeBlocks'
import { resolveHomeLayout } from '../utils/homeLayout'

export function useHomeLayout() {
  const { profile, refreshProfile } = useAuth()

  const layout = useMemo(
    () => resolveHomeLayout(profile?.home_layout, HOME_BLOCKS),
    [profile?.home_layout]
  )

  const save = useCallback(
    async (next) => {
      const { error } = await supabase.rpc('update_my_home_layout', { new_layout: next })
      if (error) throw error
      await refreshProfile()
    },
    [refreshProfile]
  )

  return { layout, save }
}
```

(Sem atualização otimista: o painel edita um rascunho e só grava em "Salvar" — YAGNI.)

---

### Task 5: Blocos da home e `Feed` guiado pelo layout

**Files:**
- Create: `src/components/home/HomeBlocks.jsx`
- Modify: `src/pages/Feed.jsx` (reescrever)

**Interfaces:**
- Consumes: `fetchAllEventsWithMeta`, `fetchNews`, `fetchUnoUpdates`, `fetchArticles`, `filterEvents`, `useFavorites`, `UnoDashboardView`.
- Produces: `HOME_BLOCK_COMPONENTS: Record<blockId, () => JSX>` (chaves = ids de `HOME_BLOCKS`).

- [ ] **Step 1: Criar `src/components/home/HomeBlocks.jsx`**

```jsx
import { Suspense, lazy, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Skeleton, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { CaretRight } from '@phosphor-icons/react'
import { DISPLAY_FONT } from '../../theme/theme'
import { CARD_HEIGHT_WITH_MEDIA } from '../../theme/cardLayout'
import { HOME_BLOCKS } from '../../config/homeBlocks'
import { fetchAllEventsWithMeta } from '../../services/eventData'
import { fetchNews } from '../../services/newsData'
import { fetchUnoUpdates } from '../../services/unoUpdatesData'
import { fetchArticles } from '../../services/articlesData'
import { filterEvents } from '../../utils/filterEvents'
import { useFavorites } from '../../hooks/useFavorites'
import EventCard from '../EventCard'
import NewsCard from '../NewsCard'
import UnoUpdateCard from '../UnoUpdateCard'
import ArticleCard from '../ArticleCard'
import HorizontalScroller from '../HorizontalScroller'

const UnoDashboardView = lazy(() => import('../UnoDashboardView'))

/** Quantas noticias o feed mostra, no carrossel mobile e na lista desktop. */
const NEWS_COUNT = 5

const iconOf = (id) => HOME_BLOCKS.find((b) => b.id === id).icon
const titleOf = (id) => HOME_BLOCKS.find((b) => b.id === id).title

/**
 * Quantos itens cada carrossel mostra. No mobile e rolagem lateral, entao cabem
 * 5. No desktop o carrossel quebra em grade, e a contagem tem que fechar a
 * linha exatamente — 3 na faixa de 3 colunas, 4 na de 4.
 */
function useFeedItemCount() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isWide = useMediaQuery(theme.breakpoints.up('lg'))
  if (isMobile) return 5
  return isWide ? 4 : 3
}

function SectionHeader({ id, to, moreLabel = 'Ver todos' }) {
  const navigate = useNavigate()
  const Icon = iconOf(id)
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon size={22} />
        <Typography variant="h5" component="h2" sx={{ fontFamily: DISPLAY_FONT }}>
          {titleOf(id)}
        </Typography>
      </Stack>
      <Button size="small" endIcon={<CaretRight size={18} />} onClick={() => navigate(to)}>
        {moreLabel}
      </Button>
    </Stack>
  )
}

// Cada bloco busca os proprios dados: bloco escondido nao faz requisicao.
function useBlockData(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch(() => !cancelled && setState({ data: null, loading: false, error: 'Não foi possível carregar este bloco.' }))
    return () => {
      cancelled = true
    }
  }, [fetcher])
  return state
}

function Block({ id, to, state, empty, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <SectionHeader id={id} to={to} />
      {state.loading ? (
        <Skeleton variant="rounded" height={CARD_HEIGHT_WITH_MEDIA} />
      ) : state.error ? (
        <Alert severity="error">{state.error}</Alert>
      ) : state.data.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {empty}
        </Typography>
      ) : (
        children(state.data)
      )}
    </Box>
  )
}

const loadEvents = () => fetchAllEventsWithMeta().then((r) => r.events)

function EventosBlock() {
  const itemCount = useFeedItemCount()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const state = useBlockData(loadEvents)
  const upcoming = state.data
    ? filterEvents(state.data, {}, [], { excludePast: true, excludeUnconfirmed: true }).slice(0, itemCount)
    : []
  return (
    <Block
      id="eventos"
      to="/eventos"
      state={state.data ? { ...state, data: upcoming } : state}
      empty="Nenhum evento confirmado por enquanto."
    >
      {(items) => (
        <HorizontalScroller columns={{ md: 3, lg: 4 }}>
          {items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isFavorite={favoriteIds.has(event.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </HorizontalScroller>
      )}
    </Block>
  )
}

function NoticiasBlock() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const state = useBlockData(fetchNews)
  return (
    <Block
      id="noticias"
      to="/noticias"
      state={state}
      empty="As notícias mais recentes sobre RPPS e investimentos aparecem aqui."
    >
      {(items) =>
        isMobile ? (
          <HorizontalScroller>
            {items.slice(0, NEWS_COUNT).map((item) => (
              <NewsCard key={item.id} news={item} layout="card" />
            ))}
          </HorizontalScroller>
        ) : (
          <Stack spacing={1.5}>
            {items.slice(0, NEWS_COUNT).map((item) => (
              <NewsCard key={item.id} news={item} layout="list" />
            ))}
          </Stack>
        )
      }
    </Block>
  )
}

function ArtigosBlock() {
  const itemCount = useFeedItemCount()
  const state = useBlockData(fetchArticles)
  return (
    <Block id="artigos" to="/artigos" state={state} empty="Análises e estudos da Lema sobre RPPS e investimentos.">
      {(items) => (
        <HorizontalScroller>
          {items.slice(0, itemCount).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </HorizontalScroller>
      )}
    </Block>
  )
}

function NovidadesUnoBlock() {
  const itemCount = useFeedItemCount()
  const state = useBlockData(fetchUnoUpdates)
  return (
    <Block
      id="novidades-uno"
      to="/novidades-uno"
      state={state}
      empty="Avisos do sistema UNO — atualizações, manutenções e instabilidades."
    >
      {(items) => (
        <HorizontalScroller>
          {items.slice(0, itemCount).map((update) => (
            <UnoUpdateCard key={update.id} update={update} />
          ))}
        </HorizontalScroller>
      )}
    </Block>
  )
}

function DashboardUnoBlock() {
  return (
    <Box sx={{ mb: 4 }}>
      <SectionHeader id="dashboard-uno" to="/dashboard-uno" moreLabel="Abrir relatório" />
      <Suspense fallback={<Skeleton variant="rounded" height={400} />}>
        <UnoDashboardView embedded />
      </Suspense>
    </Box>
  )
}

export const HOME_BLOCK_COMPONENTS = {
  eventos: EventosBlock,
  noticias: NoticiasBlock,
  artigos: ArtigosBlock,
  'novidades-uno': NovidadesUnoBlock,
  'dashboard-uno': DashboardUnoBlock
}
```

- [ ] **Step 2: Reescrever `src/pages/Feed.jsx`**

```jsx
import { useState } from 'react'
import { Button, Container, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { SlidersHorizontal } from '@phosphor-icons/react'
import { useHomeLayout } from '../hooks/useHomeLayout'
import { HOME_BLOCK_COMPONENTS } from '../components/home/HomeBlocks'
import HomeCustomizeDialog from '../components/home/HomeCustomizeDialog'

export default function Feed() {
  const { layout, save } = useHomeLayout()
  const [customizing, setCustomizing] = useState(false)

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* A home nao tem cabecalho visivel, mas a pagina precisa de um h1:
          sem ele as secoes (h2) ficariam orfas para leitor de tela. */}
      <Typography variant="h1" sx={visuallyHidden}>
        RPPApp
      </Typography>

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button startIcon={<SlidersHorizontal size={20} />} onClick={() => setCustomizing(true)}>
          Personalizar
        </Button>
      </Stack>

      {layout
        .filter((item) => item.visible)
        .map((item) => {
          const Block = HOME_BLOCK_COMPONENTS[item.id]
          return <Block key={item.id} />
        })}

      <HomeCustomizeDialog
        open={customizing}
        layout={layout}
        onSave={save}
        onClose={() => setCustomizing(false)}
      />
    </Container>
  )
}
```

(O painel é criado na Task 6; só rodar o app depois dela.)

---

### Task 6: Painel "Personalizar" (arrastar, ▲▼, liga/desliga)

**Files:**
- Modify: `package.json` (dependências `@dnd-kit/*`)
- Create: `src/components/home/HomeCustomizeDialog.jsx`
- Test: `tests/homeCustomizeDialog.test.jsx`

**Interfaces:**
- Consumes: `HOME_BLOCKS`, `resolveHomeLayout`.
- Produces: `<HomeCustomizeDialog open layout onSave onClose />` — `layout: Array<{id,visible}>`, `onSave(next | null): Promise<void>`. "Voltar ao padrão" só altera o rascunho; quem grava é o "Salvar".

- [ ] **Step 1: Instalar**

Run: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

- [ ] **Step 2: Teste que falha** — `tests/homeCustomizeDialog.test.jsx`

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomeCustomizeDialog from '../src/components/home/HomeCustomizeDialog'
import { HOME_BLOCKS } from '../src/config/homeBlocks'
import { resolveHomeLayout } from '../src/utils/homeLayout'

const defaults = resolveHomeLayout(null, HOME_BLOCKS)

function setup(layout = defaults) {
  const onSave = vi.fn().mockResolvedValue()
  const onClose = vi.fn()
  render(<HomeCustomizeDialog open layout={layout} onSave={onSave} onClose={onClose} />)
  return { onSave, onClose }
}

describe('HomeCustomizeDialog', () => {
  it('nao deixa desligar o ultimo bloco ligado', () => {
    const onlyOne = defaults.map((i) => ({ ...i, visible: i.id === 'noticias' }))
    setup(onlyOne)
    expect(screen.getByRole('checkbox', { name: /Notícias de mercado/ })).toBeDisabled()
  })

  it('desce um bloco com o botao e salva a nova ordem', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Descer Próximos eventos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0].slice(0, 2).map((i) => i.id)).toEqual(['noticias', 'eventos'])
  })

  it('liga o dashboard e salva', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('checkbox', { name: /Dashboard do UNO/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0].find((i) => i.id === 'dashboard-uno').visible).toBe(true)
  })

  it('"Voltar ao padrao" restaura o rascunho', async () => {
    const custom = defaults.map((i) => ({ ...i, visible: i.id === 'artigos' }))
    const { onSave } = setup(custom)
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao padrão' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toEqual(defaults)
  })

  it('mostra erro e mantem o painel aberto se salvar falhar', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('x'))
    const onClose = vi.fn()
    render(<HomeCustomizeDialog open layout={defaults} onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test:run -- tests/homeCustomizeDialog.test.jsx`
Expected: FAIL (componente não existe).

- [ ] **Step 4: Implementar** — `src/components/home/HomeCustomizeDialog.jsx`

```jsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import { CaretDown, CaretUp, DotsSixVertical } from '@phosphor-icons/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HOME_BLOCKS } from '../../config/homeBlocks'
import { resolveHomeLayout } from '../../utils/homeLayout'

function Row({ item, index, count, canTurnOff, onToggle, onMove }) {
  const block = HOME_BLOCKS.find((b) => b.id === item.id)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 0
      }}
    >
      <IconButton
        aria-label={`Arrastar ${block.title}`}
        {...attributes}
        {...listeners}
        sx={{ touchAction: 'none', cursor: 'grab' }}
      >
        <DotsSixVertical size={26} />
      </IconButton>
      <Typography sx={{ flex: 1, fontWeight: 600 }}>{block.title}</Typography>
      <IconButton aria-label={`Subir ${block.title}`} disabled={index === 0} onClick={() => onMove(index, -1)}>
        <CaretUp size={22} />
      </IconButton>
      <IconButton aria-label={`Descer ${block.title}`} disabled={index === count - 1} onClick={() => onMove(index, 1)}>
        <CaretDown size={22} />
      </IconButton>
      <Switch
        checked={item.visible}
        disabled={item.visible && !canTurnOff}
        onChange={() => onToggle(item.id)}
        inputProps={{ 'aria-label': block.title }}
      />
    </Stack>
  )
}

export default function HomeCustomizeDialog({ open, layout, onSave, onClose }) {
  const [draft, setDraft] = useState(layout)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(layout)
      setError('')
    }
  }, [open, layout])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const visibleCount = draft.filter((i) => i.visible).length

  const move = (index, delta) => setDraft((d) => arrayMove(d, index, index + delta))
  const toggle = (id) => setDraft((d) => d.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i)))
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setDraft((d) => {
      const from = d.findIndex((i) => i.id === active.id)
      const to = d.findIndex((i) => i.id === over.id)
      return arrayMove(d, from, to)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(draft)
      onClose()
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Personalizar tela inicial</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>
          Ligue ou desligue os blocos e arraste pela alça (ou use as setas) para mudar a ordem.
        </DialogContentText>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={draft.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <Box>
              {draft.map((item, index) => (
                <Row
                  key={item.id}
                  item={item}
                  index={index}
                  count={draft.length}
                  canTurnOff={visibleCount > 1}
                  onToggle={toggle}
                  onMove={move}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={() => setDraft(resolveHomeLayout(null, HOME_BLOCKS))}>Voltar ao padrão</Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Salvar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run -- tests/homeCustomizeDialog.test.jsx`
Expected: PASS (5 testes).

---

### Task 7: Verificação final

- [ ] **Step 1:** `npm run lint && npm run test:run && npm run build` — tudo verde. Se algum teste existente de `Feed` quebrar, ajustar o teste ao novo `Feed` (blocos agora buscam dados sozinhos).
- [ ] **Step 2:** Subir `npm run dev`, logar e verificar no Chrome (celular e desktop): home idêntica à de antes; "Personalizar" abre o painel; reordenar/ligar/desligar e Salvar refletem na home e persistem após recarregar; "Voltar ao padrão" funciona; ligar "Dashboard do UNO" mostra o dashboard **sem** botão "Gerar Relatório" e com "Abrir relatório" levando a `/dashboard-uno`, onde o botão existe e o relatório imprime como antes.
- [ ] **Step 3:** Informar o Gabriel do resultado e perguntar se quer o commit.
