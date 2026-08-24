import { fetchMaterials } from '../services/materialsData'
import MaterialCard from '../components/MaterialCard'
import ListPage from '../components/ListPage'
import { FileStack } from 'lucide-react'
import { SKELETON_HEIGHT } from '../theme/cardLayout'

export default function Materials() {
  return (
    <ListPage
      title="Materiais de Apoio"
      subtitle="Documentos, manuais e resoluções para o dia a dia do RPPS."
      fetchData={fetchMaterials}
      renderItem={(material) => <MaterialCard material={material} />}
      skeletonHeight={SKELETON_HEIGHT.textOnly}
      emptyIcon={FileStack}
      emptyTitle="Nenhum material disponível"
      emptyMessage="Documentos, manuais e resoluções aparecem aqui."
      errorMessage="Erro ao carregar os materiais de apoio. Tente novamente."
    />
  )
}
