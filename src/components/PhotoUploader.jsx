import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

const MAX_FILES = 5
const MAX_SIZE_MB = 3
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function PhotoUploader({ photos = [], onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const handleSelect = (event) => {
    const files = Array.from(event.target.files || [])
    setError('')

    if (photos.length + files.length > MAX_FILES) {
      setError(`Limite de ${MAX_FILES} fotos por evento.`)
      event.target.value = ''
      return
    }

    const validFiles = []
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Formato invalido. Use JPG, PNG ou WEBP.')
        event.target.value = ''
        return
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Cada foto deve ter no maximo ${MAX_SIZE_MB}MB.`)
        event.target.value = ''
        return
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        order: photos.length + validFiles.length
      })
    }

    onChange([...photos, ...validFiles])
    event.target.value = ''
  }

  const removePhoto = (index) => {
    const next = [...photos]
    const removed = next.splice(index, 1)[0]
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview)
    }
    onChange(next.map((photo, i) => ({ ...photo, order: i })))
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Fotos
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        {photos.map((photo, index) => (
          <Paper
            key={photo.id || photo.preview || index}
            variant="outlined"
            sx={{ position: 'relative', width: 120, height: 120 }}
          >
            <Box
              component="img"
              src={photo.preview || photo.public_url || '/placeholder-event.png'}
              alt={`Foto ${index + 1}`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => removePhoto(index)}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'background.paper'
              }}
              aria-label="Remover foto"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Paper>
        ))}
      </Box>

      <Button
        variant="outlined"
        disabled={photos.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
      >
        Adicionar foto
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handleSelect}
      />

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        Ate {MAX_FILES} fotos, {MAX_SIZE_MB}MB cada.
      </Typography>
    </Box>
  )
}
