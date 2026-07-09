import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Chip,
  Autocomplete
} from '@mui/material'

const UFs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

const PRICE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'free', label: 'Gratuito' },
  { value: 'paid', label: 'Pago' }
]

export default function EventFilters({ categories }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    categories: searchParams.getAll('categoria'),
    modalities: searchParams.getAll('modalidade'),
    price: searchParams.get('valor') || 'all',
    city: searchParams.get('cidade') || '',
    state: searchParams.get('uf') || '',
    datePreset: searchParams.get('data') || '',
    dateFrom: searchParams.get('de') || '',
    dateTo: searchParams.get('ate') || ''
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

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = Array.from(searchParams.keys()).length > 0

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        <TextField
          label="Buscar eventos"
          placeholder="Titulo ou descricao"
          value={filters.q}
          onChange={(event) => updateParam('q', event.target.value)}
          fullWidth
        />

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
              <TextField {...params} label="Categorias" />
            )}
            sx={{ minWidth: 240, flex: 1 }}
          />

          <Autocomplete
            multiple
            options={['Presencial', 'Online', 'Híbrido']}
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
              <TextField {...params} label="Modalidade" />
            )}
            sx={{ minWidth: 200, flex: 1 }}
          />

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel id="price-label">Valor</InputLabel>
            <Select
              labelId="price-label"
              value={filters.price}
              label="Valor"
              onChange={(event) => updateParam('valor', event.target.value)}
            >
              {PRICE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="stretch"
        >
          <TextField
            label="Cidade"
            value={filters.city}
            onChange={(event) => updateParam('cidade', event.target.value)}
            sx={{ flex: 1 }}
          />

          <FormControl sx={{ minWidth: 100 }}>
            <InputLabel id="state-label">UF</InputLabel>
            <Select
              labelId="state-label"
              value={filters.state}
              label="UF"
              onChange={(event) => updateParam('uf', event.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {UFs.map((uf) => (
                <MenuItem key={uf} value={uf}>
                  {uf}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="date-label">Data</InputLabel>
            <Select
              labelId="date-label"
              value={filters.datePreset}
              label="Data"
              onChange={(event) => {
                const value = event.target.value
                const next = new URLSearchParams(searchParams)
                if (value) {
                  next.set('data', value)
                } else {
                  next.delete('data')
                }
                next.delete('de')
                next.delete('ate')
                setSearchParams(next)
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="this-month">Este mes</MenuItem>
              <MenuItem value="next-month">Proximo mes</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {filters.datePreset === '' && (
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="De"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateParam('de', event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Ate"
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateParam('ate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>
        )}

        {hasFilters && (
          <Box>
            <Button variant="outlined" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
