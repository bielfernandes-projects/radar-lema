import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'

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

const DATE_CHIPS = [
  { value: 'this-month', label: 'Este mes' },
  { value: 'next-month', label: 'Proximo mes' }
]

export default function EventFilters({ categories }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [anchorEl, setAnchorEl] = useState(null)

  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    categories: searchParams.getAll('categoria'),
    modalities: searchParams.getAll('modalidade'),
    price: searchParams.get('valor') || 'all',
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

  const clearFilters = () => {
    setSearchParams({})
    setAnchorEl(null)
  }

  const advancedFiltersCount = useMemo(() => {
    let count = 0
    if (filters.price !== 'all') count += 1
    if (filters.state) count += 1
    return count
  }, [filters])

  const hasFilters =
    filters.q.trim() ||
    filters.categories.length > 0 ||
    filters.modalities.length > 0 ||
    filters.price !== 'all' ||
    filters.state ||
    filters.datePresets.length > 0

  const open = Boolean(anchorEl)

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
              <TextField {...params} label="Categorias" inputProps={{ ...params.inputProps, readOnly: true }} />
            )}
            sx={{ minWidth: 240, flex: 1 }}
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
            sx={{ minWidth: 200, flex: 1 }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{ minWidth: 160, alignSelf: { md: 'flex-end' } }}
          >
            <Badge
              badgeContent={advancedFiltersCount}
              color="primary"
              invisible={advancedFiltersCount === 0}
            >
              <Box component="span" sx={{ mr: advancedFiltersCount > 0 ? 2 : 0 }}>
                Mais filtros
              </Box>
            </Badge>
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          {DATE_CHIPS.map((chip) => {
            const active = filters.datePresets.includes(chip.value)
            return (
              <Chip
                key={chip.value}
                label={chip.label}
                clickable
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                onClick={() => toggleDatePreset(chip.value)}
              />
            )
          })}
        </Stack>

        {hasFilters && (
          <Box>
            <Button variant="outlined" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </Box>
        )}
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 3, width: 320 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
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

            <FormControl fullWidth>
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

            <Button variant="outlined" onClick={clearFilters} fullWidth>
              Limpar filtros
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Box>
  )
}
