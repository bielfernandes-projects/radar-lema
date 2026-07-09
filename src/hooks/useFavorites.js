import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id

    if (!userId) {
      setFavoriteIds(new Set())
      setLoading(false)
      return
    }

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao carregar favoritos:', error.message)
      setFavoriteIds(new Set())
    } else {
      setFavoriteIds(new Set(favorites.map((f) => f.event_id)))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFavorites()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchFavorites()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [fetchFavorites])

  const toggleFavorite = useCallback(
    async (eventId) => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return { error: new Error('Usuario nao autenticado') }
      }

      const isFavorited = favoriteIds.has(eventId)

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('event_id', eventId)

        if (error) {
          console.error('Erro ao remover favorito:', error.message)
          return { error }
        }

        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(eventId)
          return next
        })
        return { favorited: false }
      }

      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        event_id: eventId
      })

      if (error) {
        console.error('Erro ao adicionar favorito:', error.message)
        return { error }
      }

      setFavoriteIds((prev) => new Set(prev).add(eventId))
      return { favorited: true }
    },
    [favoriteIds]
  )

  return useMemo(
    () => ({
      favoriteIds,
      loading,
      toggleFavorite,
      refresh: fetchFavorites
    }),
    [favoriteIds, loading, toggleFavorite, fetchFavorites]
  )
}
