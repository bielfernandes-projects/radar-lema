import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Joyride, STATUS } from 'react-joyride'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { buildTourSteps } from './tourSteps'
import { isPhoneDevice } from './device'
import { TOUR_OPTIONS } from './tourOptions'
import { waitForTarget } from './waitForTarget'
import TourTooltip from './TourTooltip'

// Cada passo leva o usuario para a tela dele antes de aparecer (vale tambem para o "Voltar").
// Depois de navegar, espera o alvo existir: a tela carrega sob demanda e a lista busca dados.
// Sem essa espera o joyride acha o alvo ausente, pula o passo e, em cadeia, o tour inteiro.
function withNavigation(steps, navigate) {
  return steps.map((s) => ({
    ...s,
    before: async () => {
      if (window.location.pathname !== s.path) navigate(s.path)
      if (s.target !== 'body') await waitForTarget(s.target)
    }
  }))
}

// Montado no Layout (que persiste entre as telas), para o tour atravessar o app inteiro.
// Comeca na home: na 1a vez (tutorial_seen_at nulo) ou por "Ver o tutorial de novo" (state.tour).
export default function GuidedTour() {
  const { profile, refreshProfile } = useAuth()
  const { isInstalled } = usePWAInstall()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'))
  const [steps, setSteps] = useState(null) // null = parado
  // Evita recomecar entre o fim do tour e o perfil ser atualizado (ou se a gravacao falhar).
  const finished = useRef(false)

  const replay = Boolean(location.state?.tour)
  const eligible = Boolean(profile) && (replay || !profile.tutorial_seen_at)

  useEffect(() => {
    if (steps || location.pathname !== '/' || !eligible) return
    if (!replay && finished.current) return
    finished.current = false
    // Passos fixados ao comecar: instalar o app no meio do tour nao muda a lista.
    const showInstall = isPhoneDevice() && !isInstalled
    setSteps(withNavigation(buildTourSteps({ isMobile, showInstall }), navigate))
    if (replay) navigate('/', { replace: true, state: null })
  }, [steps, location.pathname, eligible, replay, isMobile, isInstalled, navigate])

  const finish = async (status) => {
    setSteps(null)
    finished.current = true
    if (status === STATUS.FINISHED) navigate('/')
    const { error } = await supabase.rpc('mark_tutorial_seen')
    if (error) console.error('Erro ao marcar tutorial como visto:', error.message)
    else await refreshProfile()
  }

  if (!steps) return null

  return (
    <Joyride
      continuous
      run
      steps={steps}
      tooltipComponent={TourTooltip}
      options={TOUR_OPTIONS}
      onEvent={(data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) finish(data.status)
      }}
    />
  )
}
