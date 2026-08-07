import { Box } from '@mui/material'

export default function MapEmbed({ address }) {
  if (!address) return null

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <Box
      sx={{
        width: '100%',
        height: 300,
        borderRadius: '14px',
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <iframe
        title="Mapa do endereço"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={src}
      />
    </Box>
  )
}
