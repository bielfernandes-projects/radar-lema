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
  Typography
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
  normalizeEvolution,
  normalizeFunds,
  normalizeDashboardMetrics,
  summarizeFunds,
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

const PRIMARY_BLUE = '#0d6efd'
const SUCCESS_GREEN = '#1fb74b'
const DANGER_RED = '#dc3545'

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
  return (
    <Paper
      className="report-card"
      variant="outlined"
      sx={{
        borderRadius: '12px',
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
        {info && <Info size={14} style={{ color: PRIMARY_BLUE }} />}
      </Box>
      {children}
    </Paper>
  )
}

function BigValue({ value }) {
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
    <Typography className="value-positive" sx={{ fontSize: 34, fontWeight: 600, color: SUCCESS_GREEN, letterSpacing: '-0.5px', textAlign: 'center' }}>
      <Box component="span" sx={{ fontSize: 20, fontWeight: 400, mr: 0.5 }}>
        {currency}
      </Box>
      {amount}
    </Typography>
  )
}

function MetricBlock({ label, value, unit, negative, info }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box className="report-sub-label" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.25, mb: 0.5 }}>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
          {label}
        </Typography>
        {info && <Info size={12} style={{ color: PRIMARY_BLUE }} />}
      </Box>
      <Typography
        className={negative ? 'value-negative' : 'value-positive'}
        sx={{ fontSize: 24, fontWeight: 600, color: negative ? DANGER_RED : SUCCESS_GREEN, textAlign: 'center' }}
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
  const summary = summarizeFunds(funds)
  const metrics = normalizeDashboardMetrics(data?.meta ?? data)
  const patrimonio =
    funds.length > 0 ? summary.totalSaldo : metrics.patrimonio
  const evolution = normalizeEvolution(data?.meta)

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
          <Typography className="report-title" variant="h5" sx={{ fontWeight: 600, color: '#1967d2' }}>
            Dashboard
          </Typography>

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
                borderRadius: '50px',
                p: 0.5,
                gap: 0.5,
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: '50px !important',
                  border: 'none',
                  textTransform: 'none',
                  px: { xs: 1.25, md: 2 },
                  py: 1,
                  fontSize: 14,
                  color: 'text.primary',
                  '&.Mui-selected': {
                    backgroundColor: PRIMARY_BLUE,
                    color: '#ffffff',
                    fontWeight: 600
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: PRIMARY_BLUE
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
                borderRadius: '50px',
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: 0.5,
                px: 3,
                py: 1.2,
                bgcolor: PRIMARY_BLUE,
                '&:hover': { bgcolor: '#0b5ed7' }
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
              <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: '12px' }} />
            ))}
            <Skeleton variant="rounded" height={480} sx={{ borderRadius: '12px', gridColumn: '1 / -1' }} />
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
                metrics,
                { key: 'rentabilidadeMes', label: 'Mês', unit: '%', info: true },
                { key: 'rentabilidadeAcum', label: 'Acum.', unit: '%' }
              )}
            </SummaryCard>

            <SummaryCard label="Meta">
              {renderMetrics(
                metrics,
                { key: 'metaMes', label: 'Mês', unit: '%' },
                { key: 'metaAcum', label: 'Acum.', unit: '%' }
              )}
            </SummaryCard>

            <SummaryCard label="Gap" info>
              {renderMetrics(
                metrics,
                { key: 'gapMes', label: 'Mês', unit: ' P.P.', negative: 'auto' },
                { key: 'gapAcum', label: 'Acum.', unit: ' P.P.', negative: 'auto' }
              )}
            </SummaryCard>

            <SummaryCard
              label={
                <>
                  VaR
                  {metrics.varLabel && (
                    <Box component="span" sx={{ fontSize: '0.7em', verticalAlign: 'sub' }}>
                      {metrics.varLabel}
                    </Box>
                  )}
                </>
              }
            >
              <Typography className="value-positive" sx={{ fontSize: 24, fontWeight: 600, color: SUCCESS_GREEN }}>
                {formatPt(metrics.varValue, 4) ?? '—'}
                {metrics.varValue !== null && <Box component="span" sx={{ fontSize: 14, fontWeight: 400 }}>%</Box>}
              </Typography>
            </SummaryCard>

            <Paper
              className="report-card"
              variant="outlined"
              sx={{
                gridColumn: '1 / -1',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                p: { xs: 2, md: 3 }
              }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                Evolução do Patrimônio
              </Typography>
              {evolution.length === 0 ? (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">
                    Sem dados de evolução para o período selecionado.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 360, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolution} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6c757d' }} minTickGap={28} />
                      <YAxis
                        tickFormatter={compactCurrency}
                        tick={{ fontSize: 12, fill: '#6c757d' }}
                        width={90}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="valor" name="Patrimônio" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
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
