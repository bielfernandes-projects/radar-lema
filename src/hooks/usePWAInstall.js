import { useCallback, useEffect, useMemo, useState } from 'react'

function isStandalone() {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (navigator.standalone === true) return true
  return false
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

// O navegador dispara beforeinstallprompt uma unica vez. O evento fica guardado
// aqui (fora do hook) para que o pop-up e o botao de Configuracoes, montados em
// momentos diferentes, enxerguem o mesmo prompt.
let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function usePWAInstall() {
  const [, rerender] = useState(0)
  const [isInstalled, setIsInstalled] = useState(isStandalone)

  useEffect(() => {
    const onChange = () => {
      setIsInstalled(isStandalone())
      rerender((n) => n + 1)
    }
    listeners.add(onChange)
    onChange()
    window.addEventListener('appinstalled', onChange)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('appinstalled', onChange)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    const prompt = deferredPrompt
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredPrompt = null
    notify()
    return outcome
  }, [])

  const canPrompt = Boolean(deferredPrompt)

  return useMemo(
    () => ({ install, canPrompt, isInstalled, isIOS: isIOS() }),
    [install, canPrompt, isInstalled]
  )
}
