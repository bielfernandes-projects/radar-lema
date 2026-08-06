import { useCallback, useEffect, useMemo, useState } from 'react'

function isStandalone() {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (navigator.standalone === true) return true
  return false
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(isStandalone)
  const [canPrompt, setCanPrompt] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanPrompt(true)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setCanPrompt(false)
      setDeferredPrompt(null)
    }

    setIsInstalled(isStandalone())

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanPrompt(false)
    return outcome
  }, [deferredPrompt])

  return useMemo(
    () => ({
      install,
      canPrompt,
      isInstalled,
      isIOS: isIOS()
    }),
    [install, canPrompt, isInstalled]
  )
}