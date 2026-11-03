import { fetchUnoUpdates } from '../services/unoUpdatesData'
import { fetchUnoMelhorias } from '../services/unoProxy'
import UnoUpdateCard from '../components/UnoUpdateCard'
import UnoMelhoriaCard from '../components/UnoMelhoriaCard'
import { mergeNovidades } from '../utils/uno'
import ListPage from '../components/ListPage'
import { Megaphone } from '@phosphor-icons/react'
import { SKELETON_HEIGHT } from '../theme/cardLayout'
import UnoCta from '../components/UnoCta'

// Avisos do staff (uno_updates) + melhorias do sininho do UNO, lidas ao vivo da API
// (aviso manual repetido do UNO e escondido):
// o que o UNO publicar la aparece aqui sem nenhum passo manual. Se o UNO estiver fora
// do ar (ou sem sessao), os avisos do staff continuam aparecendo.
async function fetchNovidades() {
  const [avisos, melhorias] = await Promise.all([
    fetchUnoUpdates(),
    fetchUnoMelhorias().catch(() => [])
  ])
  return mergeNovidades(avisos, melhorias)
}

export default function UnoUpdates() {
  return (
    <ListPage
      title="Novidades UNO"
      subtitle="Atualizações e novas funcionalidades do sistema UNO."
      banner={<UnoCta />}
      fetchData={fetchNovidades}
      renderItem={({ kind, item }) =>
        kind === 'melhoria' ? <UnoMelhoriaCard melhoria={item} /> : <UnoUpdateCard update={item} />
      }
      skeletonHeight={SKELETON_HEIGHT.unoUpdate}
      emptyIcon={Megaphone}
      emptyTitle="Nenhuma novidade ainda"
      emptyMessage="Atualizações e novas funcionalidades do sistema UNO aparecem aqui."
      errorMessage="Erro ao carregar as novidades do UNO. Tente novamente."
    />
  )
}
