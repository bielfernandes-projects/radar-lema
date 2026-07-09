import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EventCard from '../src/components/EventCard'

const baseEvent = {
  id: 'event-1',
  title: 'Congresso de RPPS',
  modality: 'presencial',
  city: 'Sao Paulo',
  state: 'SP',
  is_free: false,
  price_from: 500,
  min_date: '2026-09-15',
  max_date: '2026-09-16',
  cover_photo: { public_url: 'https://example.com/photo.jpg' },
  is_past: false,
  is_ongoing: false
}

describe('EventCard favoritar', () => {
  it('alterna favorito ao clicar no coracao', async () => {
    const toggle = vi.fn().mockResolvedValue({ favorited: true })

    const { rerender } = render(
      <BrowserRouter>
        <EventCard event={baseEvent} isFavorite={false} onToggleFavorite={toggle} />
      </BrowserRouter>
    )

    const button = screen.getByLabelText('Favoritar')
    expect(button.querySelector('svg')).not.toBeNull()

    fireEvent.click(button)

    await waitFor(() => {
      expect(toggle).toHaveBeenCalledWith('event-1')
    })

    rerender(
      <BrowserRouter>
        <EventCard event={baseEvent} isFavorite={true} onToggleFavorite={toggle} />
      </BrowserRouter>
    )

    expect(screen.getByLabelText('Favoritar').querySelector('svg')).not.toBeNull()
  })
})
