import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { URL_PARAMS } from '../utils/constants'
const DATE_PRESET_LABELS = {
  'this-month': 'Este mês',
  'next-month': 'Próximo mês'
}

export default function FilterSummary() {
  const [searchParams, setSearchParams] = useSearchParams()

  const chips = useMemo(() => {
    const result = []

    const query = searchParams.get(URL_PARAMS.SEARCH)
    if (query?.trim()) {
      result.push({ key: URL_PARAMS.SEARCH, value: query, label: `Busca: "${query}"` })
    }

    searchParams.getAll(URL_PARAMS.CATEGORIES).forEach((name) => {
      result.push({ key: URL_PARAMS.CATEGORIES, value: name, label: name })
    })

    searchParams.getAll(URL_PARAMS.MODALITIES).forEach((label) => {
      result.push({ key: URL_PARAMS.MODALITIES, value: label, label })
    })

    const price = searchParams.get(URL_PARAMS.PRICE)
    if (price === 'free') {
      result.push({ key: URL_PARAMS.PRICE, value: price, label: 'Gratuito' })
    } else if (price === 'paid') {
      result.push({ key: URL_PARAMS.PRICE, value: price, label: 'Pago' })
    }

    const state = searchParams.get(URL_PARAMS.STATE)
    if (state) {
      result.push({ key: URL_PARAMS.STATE, value: state, label: state })
    }

    searchParams.getAll(URL_PARAMS.DATE).forEach((preset) => {
      result.push({
        key: URL_PARAMS.DATE,
        value: preset,
        label: DATE_PRESET_LABELS[preset] || preset
      })
    })

    const hasCustomRange =
      searchParams.get(URL_PARAMS.DATE_FROM) || searchParams.get(URL_PARAMS.DATE_TO)
    if (hasCustomRange) {
      result.push({ key: 'range', value: 'range', label: 'Data personalizada' })
    }

    if (searchParams.get(URL_PARAMS.LEMA_EDU) === 'true') {
      result.push({ key: URL_PARAMS.LEMA_EDU, value: 'true', label: 'Lema Edu' })
    }

    return result
  }, [searchParams])

  if (chips.length === 0) return null

  const removeChip = (key, value) => {
    const next = new URLSearchParams(searchParams)

    if (key === 'range') {
      next.delete(URL_PARAMS.DATE_FROM)
      next.delete(URL_PARAMS.DATE_TO)
    } else {
      const current = next.getAll(key)
      next.delete(key)
      current.filter((item) => item !== value).forEach((item) => next.append(key, item))
    }

    setSearchParams(next)
  }

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Filtrado por:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {chips.map((chip) => (
          <Chip
            key={`${chip.key}-${chip.value}`}
            label={chip.label}
            size="small"
            variant="outlined"
            onDelete={() => removeChip(chip.key, chip.value)}
          />
        ))}
      </Box>
    </Stack>
  )
}
