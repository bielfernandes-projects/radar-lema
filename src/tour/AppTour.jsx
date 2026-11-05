import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Joyride, STATUS } from 'react-joyride'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { buildTourSteps } from './tourSteps'
import TourTooltip from './TourTooltip'

const IS_PHONE = /iphone|ipad|ipod|android/i

// Roda na home: na 1a vez (tutorial_seen_at nulo) ou quando vem de "Ver o tutorial de novo".
export default function AppTour() {
  const { profile, refreshProfile } = useAuth()
  const { isInstalled } = usePWAInstall()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'))
  const [done, setDone] = useState(false)
  // Fixa os passos na montagem: se o usuario instalar o app no meio do tour, a lista nao muda.
  const [steps] = useState(() =>
    buildTourSteps({ isMobile, showInstall: IS_PHONE.test(navigator.userAgent) && !isInstalled })
  )

  const replay = Boolean(location.state?.tour)
  const run = !done && Boolean(profile) && (replay || !profile.tutorial_seen_at)

  const finish = async () => {
    setDone(true)
    if (replay) navigate(location.pathname, { replace: true, state: null })
    const { error } = await supabase.rpc('mark_tutorial_seen')
    if (error) console.error('Erro ao marcar tutorial como visto:', error.message)
    else await refreshProfile()
  }

  if (!run) return null

  return (
    <Joyride
      continuous
      run
      steps={steps}
      tooltipComponent={TourTooltip}
      options={{
        zIndex: 1400, // acima do AppBar do MUI (1201) e dos dialogs (1300)
        scrollOffset: 96, // o AppBar fixo tem 64px: sem folga, o alvo rola para tras dele
        overlayColor: 'rgba(0,0,0,0.6)',
        primaryColor: '#1565c0',
        buttons: ['back', 'primary', 'skip'],
        blockTargetInteraction: true
      }}
      onEvent={(data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) finish()
      }}
    />
  )
}
