import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { DISPLAY_FONT } from '../theme/theme'

// Cartao do tour: texto grande e botoes grandes (publico 50+).
export default function TourTooltip({ backProps, index, primaryProps, size, skipProps, step, tooltipProps }) {
  const isLast = index === size - 1
  return (
    <Paper
      {...tooltipProps}
      elevation={8}
      sx={{ p: 3, borderRadius: 3, width: 'min(420px, calc(100vw - 32px))', maxHeight: '85vh', overflowY: 'auto' }}
    >
      <Typography variant="overline" color="text.secondary">
        {`Passo ${index + 1} de ${size}`}
      </Typography>
      {step.title && (
        <Typography variant="h5" component="h2" sx={{ fontFamily: DISPLAY_FONT, mb: 1 }}>
          {step.title}
        </Typography>
      )}
      <Box sx={{ fontSize: 18, lineHeight: 1.5 }}>{step.content}</Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
        {!isLast && (
          <Button {...skipProps} aria-label="Agora não" title="Agora não" size="large" sx={{ minHeight: 48 }}>
            Agora não
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {index > 0 && (
          <Button {...backProps} aria-label="Voltar" title="Voltar" variant="outlined" size="large" sx={{ minHeight: 48, minWidth: 96 }}>
            Voltar
          </Button>
        )}
        {/* O joyride poe aria-label em ingles nos *Props; o rotulo visivel em PT-BR tem que valer tambem para leitor de tela. */}
        <Button
          {...primaryProps}
          aria-label={isLast ? 'Concluir' : 'Próximo'}
          title={isLast ? 'Concluir' : 'Próximo'}
          variant="contained"
          size="large"
          sx={{ minHeight: 48, minWidth: 120 }}
        >
          {isLast ? 'Concluir' : 'Próximo'}
        </Button>
      </Stack>
    </Paper>
  )
}
