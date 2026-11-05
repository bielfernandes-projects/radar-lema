import { useState } from 'react'
import { Button, Container, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { SlidersHorizontal } from '@phosphor-icons/react'
import { useHomeLayout } from '../hooks/useHomeLayout'
import { HOME_BLOCK_COMPONENTS } from '../components/home/HomeBlocks'
import HomeCustomizeDialog from '../components/home/HomeCustomizeDialog'

export default function Feed() {
  const { layout, save } = useHomeLayout()
  const [customizing, setCustomizing] = useState(false)

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* A home nao tem cabecalho visivel, mas a pagina ainda precisa de
          um h1: sem ele as secoes (h2) ficariam orfas para leitor de tela. */}
      <Typography variant="h1" sx={visuallyHidden}>
        RPPApp
      </Typography>

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button startIcon={<SlidersHorizontal size={20} />} onClick={() => setCustomizing(true)}>
          Personalizar
        </Button>
      </Stack>

      {layout
        .filter((item) => item.visible)
        .map((item) => {
          const Block = HOME_BLOCK_COMPONENTS[item.id]
          return <Block key={item.id} />
        })}

      <HomeCustomizeDialog
        open={customizing}
        layout={layout}
        onSave={save}
        onClose={() => setCustomizing(false)}
      />
    </Container>
  )
}
