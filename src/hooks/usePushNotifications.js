import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { urlBase64ToUint8Array } from '../lib/vapid'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

async function getUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || null
}

export function usePushNotifications() {
  const [subscribed, setSubscribed] = useState(false)
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supportedHere = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(supportedHere)

    const checkExisting = async () => {
      setLoading(true)
      const userId = await getUserId()
      if (!userId || !supportedHere) {
        setSubscribed(false)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      setSubscribed(data && data.length > 0)
      setLoading(false)
    }

    checkExisting()
  }, [])

  const enable = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VITE_VAPID_PUBLIC_KEY nao definido.')
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Seu navegador nao suporta notificacoes push web.')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Permissao de notificacao negada.')
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
      } catch (e) {
        if (e.name === 'InvalidStateError') {
          throw new Error('Assinatura de push ja cadastrada em outro contexto.')
        }
        throw e
      }
    }

    const subJson = subscription.toJSON()
    const userId = await getUserId()
    if (!userId) throw new Error('Usuario nao autenticado.')

    const { error } = await supabase.rpc('upsert_my_push_subscription', {
      p_endpoint: subJson.endpoint,
      p_p256dh: subJson.keys.p256dh,
      p_auth: subJson.keys.auth,
      p_user_agent: navigator.userAgent
    })

    if (error) throw error
    setSubscribed(true)
    return { success: true }
  }, [])

  const disable = useCallback(async () => {
    const registration = await navigator.serviceWorker?.ready
    const subscription = await registration?.pushManager?.getSubscription()
    await subscription?.unsubscribe()

    const userId = await getUserId()
    if (userId) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
    }

    setSubscribed(false)
    return { success: true }
  }, [])

  return { subscribed, supported, loading, enable, disable }
}