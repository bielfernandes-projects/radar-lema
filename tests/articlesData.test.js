import { describe, it, expect, vi } from 'vitest'
import {
  fetchArticles,
  fetchArticleById,
  saveArticle,
  deleteArticle
} from '../src/services/articlesData'
import {
  fetchMaterials,
  uploadMaterialFile,
  getMaterialUrl,
  deleteMaterialFile
} from '../src/services/materialsData'

function fakeSupabase(routes = {}) {
  return {
    from: vi.fn((table) => routes[table] || { select: () => Promise.resolve({ data: [], error: null }) }),
    storage: {
      from: (bucket) => (routes.storage && routes.storage[bucket]) || {
        upload: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: 'https://signed' }, error: null }),
        remove: async () => ({ error: null })
      }
    }
  }
}

describe('services/articlesData', () => {
  it('fetchArticles lista artigos', async () => {
    const supabase = fakeSupabase({
      articles: {
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: [{ id: 'a1' }], error: null }))
        }))
      }
    })
    const result = await fetchArticles({ supabase })
    expect(result).toHaveLength(1)
    expect(supabase.from).toHaveBeenCalledWith('articles')
  })

  it('fetchArticleById busca por id', async () => {
    const supabase = fakeSupabase({
      articles: {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'a1', body: 'x' }, error: null }))
          }))
        }))
      }
    })
    const result = await fetchArticleById('a1', { supabase })
    expect(result.body).toBe('x')
  })

  it('fetchArticleById lanca quando nao encontra', async () => {
    const supabase = fakeSupabase({
      articles: {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'vazio' } }))
          }))
        }))
      }
    })
    await expect(fetchArticleById('a1', { supabase })).rejects.toThrow(
      'Artigo não encontrado.'
    )
  })

  it('saveArticle faz upsert com select single', async () => {
    const upsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'a1' }, error: null }))
      }))
    }))
    const supabase = fakeSupabase({ articles: { upsert } })
    const result = await saveArticle({ id: 'a1', title: 'Novo' }, { supabase })
    expect(result.id).toBe('a1')
    expect(upsert).toHaveBeenCalledWith({ id: 'a1', title: 'Novo' })
  })

  it('deleteArticle deleta por id', async () => {
    const del = vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null }))
    }))
    const supabase = fakeSupabase({ articles: { delete: del } })
    await deleteArticle('a1', { supabase })
    expect(del).toHaveBeenCalled()
  })
})

describe('services/materialsData', () => {
  it('fetchMaterials lista materiais', async () => {
    const supabase = fakeSupabase({
      materials: {
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: [{ id: 'm1' }], error: null }))
        }))
      }
    })
    const result = await fetchMaterials({ supabase })
    expect(result).toHaveLength(1)
    expect(supabase.from).toHaveBeenCalledWith('materials')
  })

  it('fetchMaterials seleciona storage_path (necessario p/ download)', async () => {
    const select = vi.fn(() => ({
      order: vi.fn(() => ({ data: [{ id: 'm1' }], error: null }))
    }))
    const supabase = fakeSupabase({ materials: { select } })
    await fetchMaterials({ supabase })
    expect(select.mock.calls[0][0]).toContain('storage_path')
  })

  it('uploadMaterialFile sobe arquivo com path uuid', async () => {
    const upload = vi.fn(async () => ({ error: null }))
    const supabase = fakeSupabase({
      storage: { materials: { upload } }
    })
    const path = await uploadMaterialFile(new File(['a'], 'a.pdf'), { supabase })
    expect(path).toMatch(/^[0-9a-f-]{36}$/)
    expect(upload).toHaveBeenCalled()
  })

  it('getMaterialUrl devolve signedUrl com download', async () => {
    const createSignedUrl = vi.fn(async () => ({
      data: { signedUrl: 'https://signed' },
      error: null
    }))
    const supabase = fakeSupabase({
      storage: { materials: { createSignedUrl } }
    })
    const url = await getMaterialUrl('path', 'arquivo.pdf', { supabase })
    expect(url).toBe('https://signed')
    expect(createSignedUrl).toHaveBeenCalledWith('path', 3600, { download: 'arquivo.pdf' })
  })

  it('deleteMaterialFile remove arquivo', async () => {
    const remove = vi.fn(async () => ({ error: null }))
    const supabase = fakeSupabase({ storage: { materials: { remove } } })
    await deleteMaterialFile('path', { supabase })
    expect(remove).toHaveBeenCalledWith(['path'])
  })
})
