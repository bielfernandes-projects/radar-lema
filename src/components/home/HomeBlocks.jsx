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

/**
 * Quantos itens cada carrossel mostra. No mobile e rolagem lateral, entao cabem
 * 5. No desktop o carrossel quebra em grade, e a contagem tem que fechar a
 * linha exatamente — 3 na faixa de 3 colunas, 4 na de 4 — senao sobra uma
 * segunda linha incompleta.
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
  const { icon: Icon, title } = HOME_BLOCKS.find((b) => b.id === id)
  return (
    <Stack data-tour={id} direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon size={22} />
        <Typography variant="h5" component="h2" sx={{ fontFamily: DISPLAY_FONT }}>
          {title}
        </Typography>
      </Stack>
      <Button size="small" endIcon={<CaretRight size={18} />} onClick={() => navigate(to)}>
        {moreLabel}
      </Button>
    </Stack>
  )
}

// Cada bloco busca os proprios dados: bloco escondido nao faz requisicao.
// `fetcher` precisa ser estavel (funcao de modulo).
function useBlockData(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch(
        () =>
          !cancelled &&
          setState({ data: null, loading: false, error: 'Não foi possível carregar este bloco.' })
      )
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
    : null
  return (
    <Block
      id="eventos"
      to="/eventos"
      state={{ ...state, data: upcoming }}
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
