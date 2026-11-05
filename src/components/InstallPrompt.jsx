import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { usePWAInstall } from '../hooks/usePWAInstall'

const IOS_HELP =
  'Toque no botão de compartilhar (o quadrado com uma seta, no menu do Safari) e depois em "Adicionar à Tela de Início".'
const ANDROID_HELP =
  'Abra o menu do navegador (⋮) e escolha "Instalar aplicativo" ou "Adicionar à tela inicial".'

// Pop-up de instalar o app: aparece a cada abertura do site no celular (iOS e
// Android) enquanto o app nao estiver instalado. Dentro do app instalado
// (display-mode standalone) nao aparece. "Agora nao" so vale ate recarregar.
export default function InstallPrompt() {
  const { install, canPrompt, isInstalled, isIOS } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  const isAndroid = /android/i.test(navigator.userAgent)
  if (isInstalled || dismissed || !(isIOS || isAndroid)) return null

  const handleInstall = async () => {
    await install()
    setDismissed(true)
  }

  return (
    <Dialog open onClose={() => setDismissed(true)}>
      <DialogTitle>Instale o RPPApp</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tenha o RPPApp na tela inicial do seu celular, com acesso rápido como um app.{' '}
          {!canPrompt && (isIOS ? IOS_HELP : ANDROID_HELP)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDismissed(true)}>Agora não</Button>
        {canPrompt && (
          <Button variant="contained" onClick={handleInstall}>
            Instalar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
