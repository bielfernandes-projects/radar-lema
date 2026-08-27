import { supabase as _supabase } from '../lib/supabase'

/**
 * Cancela a assinatura de Web Push deste dispositivo: desinscreve no navegador
 * e apaga a linha em `push_subscriptions`. Usado no logout (`AuthContext`) e no
 * toggle de notificações (`usePushNotifications`) — antes a mesma lógica vivia
 * duplicada nos dois, e no `signOut` misturava ciclo de vida de push com auth.
 */
export async function unsubscribePushForDevice(
  userId,
  { supabase } = { supabase: _supabase }
) {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker?.ready
    const subscription = await registration?.pushManager?.getSubscription()
    await subscription?.unsubscribe()
  }
  if (userId) {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
  }
}
