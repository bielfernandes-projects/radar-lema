import { describe, it, expect, vi } from 'vitest'

const deleteArticle = vi.fn().mockResolvedValue(undefined)
const deleteUnoUpdate = vi.fn().mockResolvedValue(undefined)
const deleteMaterial = vi.fn().mockResolvedValue(undefined)
const deleteMaterialFile = vi.fn().mockResolvedValue(undefined)
const deleteNews = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/services/articlesData', () => ({ fetchArticles: vi.fn(), deleteArticle: (...a) => deleteArticle(...a) }))
vi.mock('../src/services/unoUpdatesData', () => ({ fetchUnoUpdates: vi.fn(), deleteUnoUpdate: (...a) => deleteUnoUpdate(...a) }))
vi.mock('../src/services/materialsData', () => ({
  fetchMaterials: vi.fn(),
  deleteMaterial: (...a) => deleteMaterial(...a),
  deleteMaterialFile: (...a) => deleteMaterialFile(...a)
}))
vi.mock('../src/services/newsData', () => ({ fetchNewsAdmin: vi.fn(), deleteNews: (...a) => deleteNews(...a) }))
vi.mock('../src/lib/supabase', () => ({ supabase: {} }))

const { HUB_KINDS, hubKind, removeHubContent } = await import('../src/services/hubContent')

describe('hubContent registry', () => {
  it('todo kind bate com o valor da aba (um só espaço de chaves)', () => {
    expect(HUB_KINDS.map((k) => k.kind)).toEqual(['articles', 'uno_updates', 'materials', 'news'])
  })

  it('só notícias é readOnly', () => {
    expect(hubKind('news').readOnly).toBe(true)
    expect(hubKind('articles').readOnly).toBeUndefined()
  })

  it('removeHubContent despacha por kind', async () => {
    await removeHubContent('articles', { id: 'a1' })
    expect(deleteArticle).toHaveBeenCalledWith('a1', expect.anything())

    await removeHubContent('uno_updates', { id: 'u1' })
    expect(deleteUnoUpdate).toHaveBeenCalledWith('u1', expect.anything())

    await removeHubContent('news', { id: 'n1' })
    expect(deleteNews).toHaveBeenCalledWith('n1', expect.anything())
  })

  it('materiais: exclui a linha e depois tenta remover o arquivo do storage', async () => {
    await removeHubContent('materials', { id: 'm1', storage_path: 'path/x' })
    expect(deleteMaterial).toHaveBeenCalledWith('m1', expect.anything())
    expect(deleteMaterialFile).toHaveBeenCalledWith('path/x', expect.anything())
  })

  it('kind desconhecido lança', () => {
    expect(() => removeHubContent('foo', {})).toThrow('desconhecido')
  })
})
