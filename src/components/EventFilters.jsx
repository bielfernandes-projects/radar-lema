import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from '@mui/material'

const UFs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

export default function EventFilters({ categories }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => ({
    categories: searchParams.getAll('categoria'),
    modalities: searchParams.getAll('modalidade'),
    price: searchParams.get('valor') || '',
    state: searchParams.get('uf') || '',
    datePresets: searchParams.getAll('data')
  }), [searchParams])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (Array.isArray(value)) {
      next.delete(key)
      value.forEach((v) => next.append(key, v))
    } else if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next)
  }

  const toggleChip = (key, value) => {
    const next = new URLSearchParams(searchParams)
    const current = next.get(key)
    if (current === value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next)
  }

  const toggleDatePreset = (value) => {
    const next = new URLSearchParams(searchParams)
    const current = next.getAll('data')
    if (current.includes(value)) {
      next.delete('data')
      current.filter((v) => v !== value).forEach((v) => next.append('data', v))
    } else {
      next.append('data', value)
    }
    setSearchParams(next)
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="stretch"
        >
          <Autocomplete
            multiple
            options={categories.map((c) => c.name)}
            value={filters.categories}
            onChange={(event, value) => updateParam('categoria', value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Categorias" inputProps={{ ...params.inputProps, readOnly: true }} />
            )}
            sx={{ minWidth: 200, flex: 1 }}
          />

          <Autocomplete
            multiple
            options={['Presencial', 'Online', 'Hibrido']}
            value={filters.modalities}
            onChange={(event, value) => updateParam('modalidade', value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Modalidade" inputProps={{ ...params.inputProps, readOnly: true }} />
            )}
            sx={{ minWidth: 160, flex: 1 }}
          />

          <FormControl sx={{ minWidth: 140, flex: 0.6 }}>
            <InputLabel id="state-label">Estado</InputLabel>
            <Select
              labelId="state-label"
              value={filters.state}
              label="Estado"
              onChange={(e) => updateParam('uf', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {UFs.map((uf) => (
                <MenuItem key={uf} value={uf}>
                  {uf}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label="Este mes"
            clickable
            color={filters.datePresets.includes('this-month') ? 'primary' : 'default'}
            variant={filters.datePresets.includes('this-month') ? 'filled' : 'outlined'}
            onClick={() => toggleDatePreset('this-month')}
          />
          <Chip
            label="Proximo mes"
            clickable
            color={filters.datePresets.includes('next-month') ? 'primary' : 'default'}
            variant={filters.datePresets.includes('next-month') ? 'filled' : 'outlined'}
            onClick={() => toggleDatePreset('next-month')}
          />
          <Chip
            label="Gratuito"
            clickable
            color={filters.price === 'free' ? 'primary' : 'default'}
            variant={filters.price === 'free' ? 'filled' : 'outlined'}
            onClick={() => toggleChip('valor', 'free')}
          />
          <Chip
            label="Pago"
            clickable
            color={filters.price === 'paid' ? 'primary' : 'default'}
            variant={filters.price === 'paid' ? 'filled' : 'outlined'}
            onClick={() => toggleChip('valor', 'paid')}
          />
        </Stack>
      </Stack>
    </Box>
  )
}
