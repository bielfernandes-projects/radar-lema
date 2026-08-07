import { Box, Button, Stack, Typography } from '@mui/material'

export default function EmptyState({ icon: Icon, title, message, actions = [] }) {
  return (
    <Box sx={{ textAlign: 'center', mt: 6, px: 2 }}>
      {Icon && (
        <Box sx={{ display: 'inline-flex', color: 'text.disabled', mb: 2 }}>
          <Icon size={48} strokeWidth={1.5} />
        </Box>
      )}
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}
      >
        {message}
      </Typography>
      {actions.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          flexWrap="wrap"
          useFlexGap
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'contained'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      )}
    </Box>
  )
}
