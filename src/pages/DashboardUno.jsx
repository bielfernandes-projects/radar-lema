import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from '@mui/material'
import { Printer, Info } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { fetchUnoDashboard } from '../services/unoProxy'
import {
  normalizeDiaryPls,
  normalizeRents,
  normalizeInflationRates,
  normalizeFunds,
  normalizeClientName,
  computeDashboardMetrics,
  rangeForPeriod
} from '../utils/uno'
import { formatCurrency } from '../utils/formatters'
import './dashboardPrint.css'

const PERIODS = [
  { key: 'ano', label: 'Ano' },
  { key: '12', label: '12 meses' },
  { key: '24', label: '24 meses' },
  { key: '36', label: '36 meses' },
  { key: '48', label: '48 meses' },
  { key: '60', label: '60 meses' }
]

function formatPt(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Number(value))
}

function compactCurrency(value) {
  return `R$ ${new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value))}`
}

function SummaryCard({ label, info, children }) {
  const theme = useTheme()
  return (
    <Paper
      className="report-card"
      variant="outlined"
      sx={{
        borderRadius: 1.4,
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        p: 2,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Box className="report-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {info && <Info size={14} style={{ color: theme.palette.primary.main }} />}
      </Box>
      {children}
    </Paper>
  )
}

function BigValue({ value }) {
  const theme = useTheme()
  if (value === null || value === undefined) {
    return (
      <Typography variant="h5" sx={{ color: 'text.disabled' }}>
        —
      </Typography>
    )
  }
  const formatted = formatCurrency(value)
  const spaceIndex = formatted.indexOf(' ')
  const currency = spaceIndex >= 0 ? formatted.slice(0, spaceIndex) : ''
  const amount = spaceIndex >= 0 ? formatted.slice(spaceIndex + 1) : formatted
  return (
    <Typography className="value-positive" sx={{ fontSize: 34, fontWeight: 600, color: theme.palette.primary.main, letterSpacing: '-0.02em', textAlign: 'center' }}>
      <Box component="span" sx={{ fontSize: 20, fontWeight: 400, mr: 0.5 }}>
        {currency}
      </Box>
      {amount}
    </Typography>
  )
}

function MetricBlock({ label, value, unit, negative, info }) {
  const theme = useTheme()
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box className="report-sub-label" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.25, mb: 0.5 }}>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          {label}
        </Typography>
        {info && <Info size={12} style={{ color: theme.palette.primary.main }} />}
      </Box>
      <Typography
        className={negative ? 'value-negative' : 'value-positive'}
        sx={{ fontSize: 24, fontWeight: 700, color: negative ? theme.palette.error.main : theme.palette.primary.main, textAlign: 'center' }}
      >
        {value}
        {unit && (
          <Box component="span" sx={{ fontSize: 14, fontWeight: 400 }}>
            {unit}
          </Box>
        )}
      </Typography>
    </Box>
  )
}

function DualMetricCard({ first, second }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center', flexGrow: 1 }}>
      <MetricBlock {...first} />
      <MetricBlock {...second} />
    </Box>
  )
}

export default function DashboardUno() {
  const theme = useTheme()
  const now = new Date()
  const [period, setPeriod] = useState('36')
  const [year] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const range = rangeForPeriod(period, year)
        const result = await fetchUnoDashboard({
          ...range,
          month: now.getMonth() + 1,
          year
        })
        setData(result)
      } catch (err) {
        setError(err.message || 'Erro ao carregar o dashboard do UNO.')
      }
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, year, reload])

  const funds = normalizeFunds(data?.demonstrativo)

  const diaryPlsMonthly = normalizeDiaryPls(data?.diaryPls)
  const rents = normalizeRents(data?.diaryPls)
  const inflation = normalizeInflationRates(data?.inflationRates)
  const metrics = computeDashboardMetrics(diaryPlsMonthly, rents, inflation, funds, period)
  const patrimonio = metrics.patrimonio
  const rentabilidadeMes = metrics.rentabilidadeMes
  const rentabilidadeAcum = metrics.rentabilidadeAcum
  const metaMes = metrics.metaMes
  const metaAcum = metrics.metaAcum
  const gapMes = metrics.gapMes
  const gapAcum = metrics.gapAcum
  const varValue = metrics.varValue
  const varLabel = metrics.varLabel

  const computedMetrics = {
    rentabilidadeMes,
    rentabilidadeAcum,
    metaMes,
    metaAcum,
    gapMes,
    gapAcum,
    varValue,
    varLabel
  }

  const evolution = diaryPlsMonthly
  const clientName = normalizeClientName(data?.metaAnual, data?.meta)

  const renderMetrics = (base, first, second) => {
    const block = (cfg) => {
      const raw = base[cfg.key]
      const hasValue = raw !== null && raw !== undefined && raw !== ''
      const isNegative = cfg.negative === 'auto' ? hasValue && Number(raw) < 0 : cfg.negative
      return {
        label: cfg.label,
        value: formatPt(raw, cfg.decimals) ?? '—',
        unit: cfg.unit,
        negative: isNegative,
        info: cfg.info
      }
    }
    return <DualMetricCard first={block(first)} second={block(second)} />
  }

  const handlePrint = () => window.print()

  return (
    <Box id="uno-dashboard-report" sx={{ bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3
          }}
        >
          <Box>
            <Typography className="report-title" variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              Dashboard
            </Typography>
            {clientName && (
              <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: -0.5 }}>
                {clientName}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={period}
              exclusive
              size="small"
              onChange={(_, value) => value && setPeriod(value)}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 999,
                p: 0.5,
                gap: 0.5,
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: '999px !important',
                  border: 'none',
                  textTransform: 'none',
                  px: { xs: 1.25, md: 2 },
                  py: 1,
                  fontSize: 14,
                  color: 'text.primary',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: '#ffffff',
                    fontWeight: 600
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: theme.palette.primary.main
                  }
                }
              }}
            >
              {PERIODS.map((p) => (
                <ToggleButton key={p.key} value={p.key}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Button
              className="report-button"
              variant="contained"
              onClick={handlePrint}
              startIcon={<Printer size={18} />}
              sx={{
                borderRadius: 999,
                
                fontWeight: 600,
                fontSize: 13,
                
                px: 3,
                py: 1.2,
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              Gerar Relatório
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
              gap: 2
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 1.4 }} />
            ))}
            <Skeleton variant="rounded" height={480} sx={{ borderRadius: 1.4, gridColumn: '1 / -1' }} />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={
              <Button size="small" color="inherit" onClick={() => setReload((r) => r + 1)}>
                Tentar novamente
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
              gap: 2
            }}
          >
            <SummaryCard label="Patrimônio">
              <BigValue value={patrimonio} />
            </SummaryCard>

            <SummaryCard label="Rentabilidade" info>
              {renderMetrics(
                computedMetrics,
                { key: 'rentabilidadeMes', label: 'Mês', unit: '%', info: true },
                { key: 'rentabilidadeAcum', label: 'Acum.', unit: '%' }
              )}
            </SummaryCard>

            <SummaryCard label="Meta">
              {renderMetrics(
                computedMetrics,
                { key: 'metaMes', label: 'Mês', unit: '%' },
                { key: 'metaAcum', label: 'Acum.', unit: '%' }
              )}
            </SummaryCard>

            <SummaryCard label="Gap" info>
              {renderMetrics(
                computedMetrics,
                { key: 'gapMes', label: 'Mês', unit: ' P.P.', negative: 'auto' },
                { key: 'gapAcum', label: 'Acum.', unit: ' P.P.', negative: 'auto' }
              )}
            </SummaryCard>

            <SummaryCard
              label={
                <>
                  VaR
                  {computedMetrics.varLabel && (
                    <Box component="span" sx={{ fontSize: '0.7em', verticalAlign: 'sub' }}>
                      {computedMetrics.varLabel}
                    </Box>
                  )}
                </>
              }
            >
              <Typography className="value-positive" sx={{ fontSize: 24, fontWeight: 600, color: theme.palette.primary.main }}>
                {formatPt(computedMetrics.varValue, 4) ?? '—'}
                {computedMetrics.varValue !== null && <Box component="span" sx={{ fontSize: 14, fontWeight: 400 }}>%</Box>}
              </Typography>
            </SummaryCard>

            <Paper
              className="report-card"
              variant="outlined"
              sx={{
                gridColumn: '1 / -1',
                borderRadius: 1.4,
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                p: { xs: 2, md: 3 }
              }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                Evolução do Patrimônio
              </Typography>
              {evolution.length === 0 ? (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                  <Typography color="text.secondary" align="center">
                    Sem dados de evolução para o período selecionado.
                  </Typography>
                  <Typography variant="caption" color="text.disabled" align="center">
                    Tente um período maior (24 ou 36 meses) para visualizar o histórico.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 360, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolution} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} minTickGap={28} />
                      <YAxis
                        tickFormatter={compactCurrency}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        width={90}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="valor" name="Patrimônio" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  )
}
