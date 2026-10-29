import { fetchUnoUpdates } from '../services/unoUpdatesData'
import UnoUpdateCard from '../components/UnoUpdateCard'
import ListPage from '../components/ListPage'
import { Megaphone } from 'lucide-react'
import { SKELETON_HEIGHT } from '../theme/cardLayout'
import UnoCta from '../components/UnoCta'

export default function UnoUpdates() {
  return (
    <ListPage
      title="Novidades UNO"
      subtitle="Atualizações e novas funcionalidades do sistema UNO."
      banner={<UnoCta />}
      fetchData={fetchUnoUpdates}
      renderItem={(update) => <UnoUpdateCard update={update} />}
      skeletonHeight={SKELETON_HEIGHT.unoUpdate}
      emptyIcon={Megaphone}
      emptyTitle="Nenhuma novidade ainda"
      emptyMessage="Atualizações e novas funcionalidades do sistema UNO aparecem aqui."
      errorMessage="Erro ao carregar as novidades do UNO. Tente novamente."
    />
  )
}
