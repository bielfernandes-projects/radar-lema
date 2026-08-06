import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Autocomplete,
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
import { URL_PARAMS, UFs } from '../utils/constants'

export default function EventFilters({ categories, showCustomDateFilter = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rangeAnchor, setRangeAnchor] = useState(null)
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')

  const filters = useMemo(() => ({
    categories: searchParams.getAll(URL_PARAMS.CATEGORIES),
    modalities: searchParams.getAll(URL_PARAMS.MODALITIES),
    price: searchParams.get(URL_PARAMS.PRICE) || '',
    state: searchParams.get(URL_PARAMS.STATE) || '',
    datePresets: searchParams.getAll(URL_PARAMS.DATE),
    dateFrom: searchParams.get(URL_PARAMS.DATE_FROM) || '',
    dateTo: searchParams.get(URL_PARAMS.DATE_TO) || '',
    lemaEdu: searchParams.get(URL_PARAMS.LEMA_EDU) === 'true'
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
    const current = next.getAll(URL_PARAMS.DATE)
    if (current.includes(value)) {
      next.delete(URL_PARAMS.DATE)
      current.filter((v) => v !== value).forEach((v) => next.append(URL_PARAMS.DATE, v))
    } else {
      next.append(URL_PARAMS.DATE, value)
    }
    setSearchParams(next)
  }

  const openRangePopover = (event) => {
    setDraftFrom(filters.dateFrom)
    setDraftTo(filters.dateTo)
    setRangeAnchor(event.currentTarget)
  }

  const closeRangePopover = () => {
    setDraftFrom('')
    setDraftTo('')
    setRangeAnchor(null)
  }

  const confirmRange = () => {
    const next = new URLSearchParams(searchParams)
    if (draftFrom) next.set(URL_PARAMS.DATE_FROM, draftFrom)
    else next.delete(URL_PARAMS.DATE_FROM)
    if (draftTo) next.set(URL_PARAMS.DATE_TO, draftTo)
    else next.delete(URL_PARAMS.DATE_TO)
    setSearchParams(next)
    closeRangePopover()
  }

  const rangeActive = Boolean(filters.dateFrom || filters.dateTo)

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
            onChange={(event, value) => updateParam(URL_PARAMS.CATEGORIES, value)}
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
            onChange={(event, value) => updateParam(URL_PARAMS.MODALITIES, value)}
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
              onChange={(e) => updateParam(URL_PARAMS.STATE, e.target.value)}
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
            label="Lema Edu"
            clickable
            variant={filters.lemaEdu ? 'filled' : 'outlined'}
            color={filters.lemaEdu ? 'primary' : undefined}
            sx={
              filters.lemaEdu
                ? { color: '#fff' }
                : (theme) => ({
                    color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                    borderColor: 'primary.main',
                    background:
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.20) 40%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.20) 60%, transparent 80%)'
                        : 'linear-gradient(110deg, transparent 20%, rgba(25,118,210,0.08) 40%, rgba(25,118,210,0.18) 50%, rgba(25,118,210,0.08) 60%, transparent 80%)',
                    backgroundSize: '200% 100%',
                    animation: 'chipShimmer 4s ease-in-out infinite',
                    '@keyframes chipShimmer': {
                      '0%': { backgroundPosition: '-200% 0' },
                      '100%': { backgroundPosition: '200% 0' }
                    }
                  })
            }
            onClick={() => toggleChip(URL_PARAMS.LEMA_EDU, filters.lemaEdu ? '' : 'true')}
          />
          <Chip
            label="Gratuito"
            clickable
            color={filters.price === 'free' ? 'primary' : 'default'}
            variant={filters.price === 'free' ? 'filled' : 'outlined'}
            onClick={() => toggleChip(URL_PARAMS.PRICE, 'free')}
          />
          <Chip
            label="Pago"
            clickable
            color={filters.price === 'paid' ? 'primary' : 'default'}
            variant={filters.price === 'paid' ? 'filled' : 'outlined'}
            onClick={() => toggleChip(URL_PARAMS.PRICE, 'paid')}
          />
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
          {showCustomDateFilter && (
            <Chip
              label="Data Personalizada"
              clickable
              color={rangeActive ? 'primary' : 'default'}
              variant={rangeActive ? 'filled' : 'outlined'}
              onClick={openRangePopover}
            />
          )}
        </Stack>

        <Popover
          open={Boolean(rangeAnchor)}
          anchorEl={rangeAnchor}
          onClose={closeRangePopover}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Stack spacing={2} sx={{ p: 2, width: 260 }}>
            <TextField
              label="Data início"
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Data fim"
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={closeRangePopover}>
                Cancelar
              </Button>
              <Button size="small" variant="contained" onClick={confirmRange}>
                Confirmar
              </Button>
            </Stack>
          </Stack>
        </Popover>
      </Stack>
    </Box>
  )
}
