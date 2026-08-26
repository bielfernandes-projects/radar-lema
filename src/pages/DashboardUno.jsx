import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  Typography,
  useTheme
} from '@mui/material'
import { Printer, Info } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Legend,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { fetchUnoDashboard } from '../services/unoProxy'
import {
  normalizeFunds,
  summarizeFunds,
  asArray,
  parseCommaNumber,
  parseDiaUltimaCota,
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

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 5 + i)

const CLIENT_NAMES = { 192: 'Demonstração Lema' }

// Cor da linha de Rentabilidade no grafico "Rentabilidade x Meta", igual ao
// UNO (roxo, distinto da barra verde da Meta).
const RENTABILIDADE_LINE_COLOR = '#7c4dff'

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
  const icon = <Info size={14} style={{ color: theme.palette.primary.main, cursor: typeof info === 'string' ? 'help' : 'default' }} />
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
        {info && (typeof info === 'string' ? <MuiTooltip title={info}>{icon}</MuiTooltip> : icon)}
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
  const color = value < 0 ? theme.palette.error.main : theme.palette.success.main
  return (
    <Typography className="value-positive" sx={{ fontSize: 34, fontWeight: 600, color, letterSpacing: '-0.02em', textAlign: 'center' }}>
      <Box component="span" sx={{ fontSize: 20, fontWeight: 400, mr: 0.5 }}>
        {currency}
      </Box>
      {amount}
    </Typography>
  )
}

function MetricBlock({ label, value, unit, negative, tooltip }) {
  const theme = useTheme()
  const content = (
    <Box sx={{ textAlign: 'center', cursor: tooltip ? 'help' : 'default' }}>
      <Box className="report-sub-label" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.25, mb: 0.5 }}>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          {label}
        </Typography>
        {tooltip && <Info size={12} style={{ color: theme.palette.primary.main }} />}
      </Box>
      <Typography
        className={negative ? 'value-negative' : 'value-positive'}
        sx={{ fontSize: 24, fontWeight: 700, color: negative ? theme.palette.error.main : theme.palette.success.main, textAlign: 'center' }}
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
  return tooltip ? <MuiTooltip title={tooltip}>{content}</MuiTooltip> : content
}

function DualMetricCard({ first, second }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center', flexGrow: 1 }}>
      <MetricBlock {...first} />
      <MetricBlock {...second} />
    </Box>
  )
}

function selectStyles(theme) {
  return {
    bgcolor: 'background.paper',
    borderRadius: 1,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
    '& .Mui-select': { py: 1 }
  }
}

export default function DashboardUno() {
  const theme = useTheme()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [period, setPeriod] = useState('36')
  const [chartMode, setChartMode] = useState('mensal')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const range = rangeForPeriod(period, selectedMonth, selectedYear)
        const result = await fetchUnoDashboard({
          ...range,
          month: selectedMonth,
          year: selectedYear
        })
        setData(result)
      } catch (err) {
        setError(err.message || 'Erro ao carregar o dashboard do UNO.')
      }
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedMonth, selectedYear, reload])

  const funds = normalizeFunds(data?.demonstrativo)
  const summary = summarizeFunds(funds)
  const totalSaldo = summary.totalSaldo

  const clientName = CLIENT_NAMES[192] || ''

  const patrimonio = totalSaldo > 0 ? totalSaldo : null

  const rentabilidadeMes = totalSaldo > 0
    ? funds.reduce((acc, f) => acc + f.percentual * (f.saldo / totalSaldo), 0)
    : null

  const varValue = totalSaldo > 0
    ? funds.reduce((acc, f) => acc + f.varFundo * (f.saldo / totalSaldo), 0)
    : null

  const metaAnualRows = asArray(data?.metaAnual)
  const metaAnualRow = metaAnualRows.length > 0 ? metaAnualRows[0] : {}
  const expectedRent = parseCommaNumber(metaAnualRow?.rentabilidade_esperada_ano ?? metaAnualRow?.taxa_ano)
  const metaMes = expectedRent > 0 ? expectedRent / 12 : null

  const fundsCliente = asArray(data?.fundos)

  const evolution = useMemo(() => {
    if (fundsCliente.length === 0) return []

    const byMonth = new Map()
    for (const row of fundsCliente) {
      const dateInfo = parseDiaUltimaCota(row?.dia_ultima_cota)
      if (!dateInfo) continue
      const saldoStr = String(row?.saldo_final_carteira ?? '0')
      const saldo = Number(saldoStr.replace(',', '.'))
      if (!Number.isFinite(saldo) || saldo <= 1) continue
      const key = `${dateInfo.year}-${String(dateInfo.month).padStart(2, '0')}`
      const entry = byMonth.get(key) || { year: dateInfo.year, month: dateInfo.month, valor: 0 }
      entry.valor += saldo
      byMonth.set(key, entry)
    }

    return Array.from(byMonth.values())
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((e) => ({ label: `${MONTH_ABBR[e.month - 1]}/${e.year}`, valor: e.valor, year: e.year, month: e.month }))
  }, [fundsCliente])

  const monthCount = Number(period) || 12

  const rentabilidadeAcum = useMemo(() => {
    if (evolution.length < 2) return null
    const first = evolution[0].valor
    const last = evolution[evolution.length - 1].valor
    return first > 0 ? ((last / first) - 1) * 100 : null
  }, [evolution])

  const metaAcum = expectedRent > 0
    ? (Math.pow(1 + expectedRent / 100, monthCount / 12) - 1) * 100
    : null

  const gapMes = (metaMes !== null && rentabilidadeMes !== null) ? rentabilidadeMes - metaMes : null
  const gapAcum = (rentabilidadeAcum !== null && metaAcum !== null) ? rentabilidadeAcum - metaAcum : null

  const computedMetrics = {
    rentabilidadeMes,
    rentabilidadeAcum,
    metaMes,
    metaAcum,
    gapMes,
    gapAcum,
    varValue,
    varLabel: ''
  }

  const rentabilidadeMesTooltip = rentabilidadeMes !== null
    ? `${formatPt(rentabilidadeMes, 5)}% | ${formatCurrency(summary.totalRendimento)}`
    : null

  const rentabilidadeAcumTooltip = (rentabilidadeAcum !== null && evolution.length >= 2)
    ? (
      <>
        {formatPt(rentabilidadeAcum, 5)}% | {formatCurrency(evolution[evolution.length - 1].valor - evolution[0].valor)}
        <br />
        acum. {evolution[0].label} → {evolution[evolution.length - 1].label}
      </>
    )
    : null

  const GAP_TOOLTIP = 'Diferença entre Rentabilidade e Meta'
  const META_TOOLTIP = 'Estimativa: rentabilidade esperada anual convertida para o período'

  const comparisonData = useMemo(() => {
    if (evolution.length === 0) return []

    const monthlyMeta = expectedRent > 0 ? expectedRent / 12 : 0
    let acumRent = 0
    let acumMeta = 0

    return evolution.map((entry, i) => {
      const prevPL = i > 0 ? evolution[i - 1].valor : entry.valor
      const rentMes = prevPL > 0 ? ((entry.valor / prevPL) - 1) * 100 : 0
      acumRent = evolution[0].valor > 0 ? ((entry.valor / evolution[0].valor) - 1) * 100 : 0
      acumMeta += monthlyMeta

      return {
        label: entry.label,
        rentMes: Number(rentMes.toFixed(4)),
        rentAcum: Number(acumRent.toFixed(4)),
        metaMes: Number(monthlyMeta.toFixed(4)),
        metaAcum: Number(acumMeta.toFixed(4))
      }
    })
  }, [evolution, expectedRent])

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
        tooltip: cfg.tooltip
      }
    }
    return <DualMetricCard first={block(first)} second={block(second)} />
  }

  const handlePrint = () => window.print()

  const isMensal = chartMode === 'mensal'

  return (
    <Box id="uno-dashboard-report" sx={{ bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={selectStyles(theme)}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={selectStyles(theme)}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {clientName && (
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {clientName}
            </Typography>
          )}
        </Box>

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
          <Typography className="report-title" variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
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
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 1.4, gridColumn: '1 / -1' }} />
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 1.4, gridColumn: '1 / -1' }} />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

              <SummaryCard label="Rentabilidade">
                {renderMetrics(
                  computedMetrics,
                  { key: 'rentabilidadeMes', label: 'Mês', unit: '%', tooltip: rentabilidadeMesTooltip },
                  { key: 'rentabilidadeAcum', label: 'Acum.', unit: '%', tooltip: rentabilidadeAcumTooltip }
                )}
              </SummaryCard>

              <SummaryCard label="Meta">
                {renderMetrics(
                  computedMetrics,
                  { key: 'metaMes', label: 'Mês', unit: '%', tooltip: META_TOOLTIP },
                  { key: 'metaAcum', label: 'Acum.', unit: '%', tooltip: META_TOOLTIP }
                )}
              </SummaryCard>

              <SummaryCard label="Gap" info={GAP_TOOLTIP}>
                {renderMetrics(
                  computedMetrics,
                  { key: 'gapMes', label: 'Mês', unit: ' P.P.', negative: 'auto' },
                  { key: 'gapAcum', label: 'Acum.', unit: ' P.P.', negative: 'auto' }
                )}
              </SummaryCard>

              <SummaryCard label="VaR">
                <Typography className="value-positive" sx={{ fontSize: 24, fontWeight: 600, color: theme.palette.success.main }}>
                  {formatPt(computedMetrics.varValue, 4) ?? '—'}
                  {computedMetrics.varValue !== null && <Box component="span" sx={{ fontSize: 14, fontWeight: 400 }}>%</Box>}
                </Typography>
              </SummaryCard>
            </Box>

            <Paper
              className="report-card"
              variant="outlined"
              sx={{
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

            <Paper
              className="report-card"
              variant="outlined"
              sx={{
                borderRadius: 1.4,
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                p: { xs: 2, md: 3 }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">
                  Rentabilidade x Meta
                </Typography>
                <ToggleButtonGroup
                  value={chartMode}
                  exclusive
                  size="small"
                  onChange={(_, value) => value && setChartMode(value)}
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
                      px: 2,
                      py: 0.75,
                      fontSize: 13,
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
                  <ToggleButton value="mensal">Mensal</ToggleButton>
                  <ToggleButton value="acumulado">Acumulado</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {comparisonData.length === 0 ? (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                  <Typography color="text.secondary" align="center">
                    Sem dados de rentabilidade para o período selecionado.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 400, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={comparisonData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} minTickGap={28} />
                      <YAxis
                        tickFormatter={(v) => `${formatPt(v, 1)}%`}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        width={60}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${formatPt(value, 2)}%`,
                          name === 'meta' ? 'Meta' : 'Rentabilidade'
                        ]}
                      />
                      <Legend
                        formatter={(value) => (value === 'meta' ? 'Meta' : 'Rentabilidade')}
                      />
                      <Bar
                        dataKey={isMensal ? 'metaMes' : 'metaAcum'}
                        name="meta"
                        fill={theme.palette.success.main}
                        radius={[3, 3, 0, 0]}
                        barSize={isMensal ? 24 : 32}
                      />
                      <Line
                        type="monotone"
                        dataKey={isMensal ? 'rentMes' : 'rentAcum'}
                        name="rentabilidade"
                        stroke={RENTABILIDADE_LINE_COLOR}
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
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
