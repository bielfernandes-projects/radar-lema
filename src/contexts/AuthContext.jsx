import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, user_type, role, is_uno_client')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao carregar perfil:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  useEffect(() => {
    let subscription = null

    const init = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      }

      setLoading(false)
    }

    init()

    const {
      data: { subscription: sub }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    subscription = sub

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        await loadProfile(data.user.id)
      }

      return { error: null }
    },
    [loadProfile]
  )

  const signOut = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id

    if (userId && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker?.ready
      const subscription = await registration?.pushManager?.getSubscription()
      await subscription?.unsubscribe()
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
    }

    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const signUp = useCallback(
    async ({ email, password, name }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, user_type: 'client', role: 'ROLE_VIEWER' }
        }
      })

      if (error) {
        return { error }
      }

      if (data.session) {
        setUser(data.session.user)
        await loadProfile(data.session.user.id)
      }

      return { error: null }
    },
    [loadProfile]
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signOut,
      signUp
    }),
    [user, profile, loading, signIn, signOut, signUp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
