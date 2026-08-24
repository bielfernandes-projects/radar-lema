import { fetchArticles } from '../services/articlesData'
import ArticleCard from '../components/ArticleCard'
import ListPage from '../components/ListPage'
import { BookOpen } from 'lucide-react'
import { SKELETON_HEIGHT } from '../theme/cardLayout'

export default function Articles() {
  return (
    <ListPage
      title="Artigos"
      subtitle="Análises, comparativos e estudos da Lema sobre RPPS e investimentos."
      fetchData={fetchArticles}
      renderItem={(article) => <ArticleCard article={article} />}
      skeletonHeight={SKELETON_HEIGHT.withMedia}
      emptyIcon={BookOpen}
      emptyTitle="Nenhum artigo publicado"
      emptyMessage="Análises, comparativos e estudos da Lema sobre RPPS e investimentos aparecem aqui."
      errorMessage="Erro ao carregar os artigos. Tente novamente."
    />
  )
}
