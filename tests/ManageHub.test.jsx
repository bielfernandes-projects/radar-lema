import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ManageHub from '../src/pages/ManageHub'

const deleteArticle = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/services/articlesData', () => ({
  fetchArticles: vi.fn().mockResolvedValue([
    { id: 'a1', title: 'Artigo manual', visibility: 'public', created_at: '2026-08-13' }
  ]),
  deleteArticle: (...args) => deleteArticle(...args)
}))

vi.mock('../src/services/unoUpdatesData', () => ({
  fetchUnoUpdates: vi.fn().mockResolvedValue([]),
  deleteUnoUpdate: vi.fn()
}))

vi.mock('../src/services/materialsData', () => ({
  fetchMaterials: vi.fn().mockResolvedValue([]),
  deleteMaterial: vi.fn(),
  deleteMaterialFile: vi.fn()
}))

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  }
}))

describe('ManageHub exclusao', () => {
  it('chama deleteArticle (kind bate com o valor da aba "articles") ao confirmar exclusao', async () => {
    render(
      <BrowserRouter>
        <ManageHub />
      </BrowserRouter>
    )

    const deleteButton = await screen.findByLabelText('Excluir')
    fireEvent.click(deleteButton)

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(deleteArticle).toHaveBeenCalledWith('a1')
    })
  })
})
