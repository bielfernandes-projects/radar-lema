import { fetchNews } from '../services/newsData'
import NewsCard from '../components/NewsCard'
import ListPage from '../components/ListPage'
import { Newspaper } from 'lucide-react'
import { SKELETON_HEIGHT } from '../theme/cardLayout'

export default function News() {
  return (
    <ListPage
      title="Notícias de Mercado"
      fetchData={fetchNews}
      renderItem={(news) => <NewsCard news={news} layout="list" />}
      variant="list"
      skeletonHeight={SKELETON_HEIGHT.newsRow}
      emptyIcon={Newspaper}
      emptyTitle="Nenhuma notícia ainda"
      emptyMessage="As notícias de mercado sobre RPPS e investimentos aparecem aqui automaticamente, atualizadas ao longo do dia."
      countLabel={(n) => n === 1 ? 'notícia disponível' : 'notícias disponíveis'}
      errorMessage="Erro ao carregar notícias de mercado. Tente novamente."
    />
  )
}
