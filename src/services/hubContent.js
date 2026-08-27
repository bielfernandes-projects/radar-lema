/**
 * Registro único dos tipos de conteúdo curável do hub (Gestão do hub).
 *
 * Antes, `ManageHub` tinha quatro cadeias `if (tab === 'articles') … else if …`
 * (abas, botão "Novo", botão "Editar", chaves de busca) e um dispatch de
 * exclusão à parte — e dois bugs já moraram nesse dispatch ("kind singular !=
 * valor da aba", "exclusão silenciosa por RLS"). Um só espaço de chaves (`kind`)
 * elimina essa classe de bug: adicionar um quinto tipo é uma entrada aqui.
 */
import { supabase as _supabase } from '../lib/supabase'
import { fetchArticles, deleteArticle } from './articlesData'
import { fetchUnoUpdates, deleteUnoUpdate } from './unoUpdatesData'
import { fetchMaterials, deleteMaterial, deleteMaterialFile } from './materialsData'
import { fetchNewsAdmin, deleteNews } from './newsData'

export const HUB_KINDS = [
  {
    kind: 'articles',
    label: 'Artigos',
    searchKeys: ['title', 'author'],
    newPath: '/gestao/artigos/novo',
    editPath: (id) => `/gestao/artigos/${id}/editar`,
    fetchList: fetchArticles,
    remove: (item, opts) => deleteArticle(item.id, opts)
  },
  {
    kind: 'uno_updates',
    label: 'Novidades UNO',
    searchKeys: ['title'],
    newPath: '/gestao/novidades-uno/novo',
    editPath: (id) => `/gestao/novidades-uno/${id}/editar`,
    fetchList: fetchUnoUpdates,
    remove: (item, opts) => deleteUnoUpdate(item.id, opts)
  },
  {
    kind: 'materials',
    label: 'Materiais',
    searchKeys: ['title', 'description'],
    newPath: '/gestao/materiais/novo',
    editPath: (id) => `/gestao/materiais/${id}/editar`,
    fetchList: fetchMaterials,
    remove: async (item, opts) => {
      await deleteMaterial(item.id, opts)
      // o arquivo no storage é acessório — se sumir a linha, o resto não bloqueia
      await deleteMaterialFile(item.storage_path, opts).catch(() => {})
    }
  },
  {
    kind: 'news',
    label: 'Notícias',
    searchKeys: ['title', 'source'],
    readOnly: true, // notícias vêm do agregador RSS; só dá pra excluir
    fetchList: fetchNewsAdmin,
    remove: (item, opts) => deleteNews(item.id, opts)
  }
]

export const hubKind = (kind) => HUB_KINDS.find((k) => k.kind === kind)

/**
 * removeHubContent: exclui um item de qualquer tipo pelo seu `kind`. Uma única
 * checagem de RLS-silenciosa (dentro de cada `delete*`), uma única mensagem.
 */
export function removeHubContent(kind, item, { supabase } = { supabase: _supabase }) {
  const entry = hubKind(kind)
  if (!entry) throw new Error(`Tipo de conteúdo desconhecido: ${kind}`)
  return entry.remove(item, { supabase })
}
