import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import usePageMeta from '../src/hooks/usePageMeta'
import Landing from '../src/pages/Landing'
import LegalFooter from '../src/components/LegalFooter'
import { getConsent, setConsent } from '../src/lib/posthog'

vi.mock('../src/components/InstallAppButton', () => ({ default: () => null }))

function Meta(props) {
  usePageMeta(props)
  return null
}

afterEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
})

describe('usePageMeta', () => {
  it('define título, description e canonical', () => {
    render(<Meta title="Sobre" description="desc" path="/sobre" />)
    expect(document.title).toBe('Sobre | RPPapp')
    expect(document.head.querySelector('meta[name="description"]').content).toBe('desc')
    expect(document.head.querySelector('link[rel="canonical"]').href).toMatch(/\/sobre$/)
  })
})

describe('Landing', () => {
  it('tem um h1 e os CTAs de cadastro e login', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: /criar conta grátis/i })[0].getAttribute('href')).toBe('/criar-conta')
    expect(screen.getAllByRole('link', { name: /entrar/i })[0].getAttribute('href')).toBe('/login')
    expect(document.head.querySelector('script[type="application/ld+json"]')).not.toBeNull()
  })
})

describe('LegalFooter', () => {
  it('linka as páginas institucionais', () => {
    render(
      <MemoryRouter>
        <LegalFooter />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Privacidade' }).getAttribute('href')).toBe('/privacidade')
    expect(screen.getByRole('link', { name: 'Termos de Uso' }).getAttribute('href')).toBe('/termos')
  })
})

describe('consentimento', () => {
  it('começa sem escolha e guarda a decisão', () => {
    expect(getConsent()).toBeNull()
    setConsent(false)
    expect(getConsent()).toBe('denied')
  })
})
