import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } }
}))

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb) => mockOnAuthStateChange(cb)
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    })
  }
}))

function TestComponent() {
  const { loading, user, profile } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.email : 'no-user'}</span>
      <span data-testid="type">{profile?.user_type || 'no-type'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('inicia no estado de carregamento e depois fica pronto', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('type')).toHaveTextContent('no-type')
  })
})
