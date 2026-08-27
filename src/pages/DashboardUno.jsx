import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  TextField,
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
import { fetchUnoDashboard, fetchUnoClients, fetchOwnUnoClientName } from '../services/unoProxy'
import { useAuth } from '../contexts/AuthContext'
import { isSuperAdmin } from '../utils/auth'
import { rangeForPeriod } from '../utils/uno'
import { buildUnoDashboardViewModel } from '../utils/unoDashboard'
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

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 5 + i)

// Cor da linha de Rentabilidade no grafico "Rentabilidade x Meta", igual ao
// UNO (roxo, distinto da barra verde da Meta).
const RENTABILIDADE_LINE_COLOR = '#7c4dff'

const CLIENT_STORAGE_KEY = 'radarlema.dashboardUno.clientId'

// Largura/altura fixas dos graficos no relatorio impresso — o relatorio ja
// trava em 1000px de largura (dashboardPrint.css), entao o espaco disponivel
// pro grafico e sempre o mesmo: 1000 - 32 (padding do Container) - 32
// (padding do card) = 936px. Usar um numero fixo em vez de deixar o
// ResponsiveContainer medir sozinho evita depender do ResizeObserver (que e
// assincrono) terminar a tempo antes do navegador travar a thread pra
// imprimir — o mesmo bug que fizemos o isPrinting/rAF pra contornar, mas que
// nao se resolvia 100% do tempo.
const REPORT_CHART_WIDTH = 936
const REPORT_CHART_HEIGHT = 300

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
      className="report-card report-summary-card"
      variant="outlined"
      sx={{
        borderRadius: 1.4,
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        p: { xs: 1.25, sm: 2 },
        minHeight: { xs: 120, sm: 160 },
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
      {/* Todo card centraliza o valor no mesmo eixo vertical, tenha um valor
          so (Patrimonio, VaR) ou dois (Rentabilidade/Meta/Gap via DualMetricCard) —
          sem isso o card de um valor so ficava colado embaixo. */}
      <Box sx={{ flexGrow: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
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
    <Typography className="value-positive value-big" sx={{ fontSize: { xs: 24, sm: 34 }, fontWeight: 600, color, letterSpacing: '-0.02em', textAlign: 'center' }}>
      <Box component="span" className="value-big-prefix" sx={{ fontSize: { xs: 15, sm: 20 }, fontWeight: 400, mr: 0.5 }}>
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
        sx={{ fontSize: { xs: 17, sm: 24 }, fontWeight: 700, color: negative ? theme.palette.error.main : theme.palette.success.main, textAlign: 'center' }}
      >
        {value}
        {unit && (
          <Box component="span" className="value-unit" sx={{ fontSize: { xs: 11, sm: 14 }, fontWeight: 400 }}>
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
  const { profile } = useAuth()
  const isSuperAdminUser = isSuperAdmin(profile)
  // O mes corrente ainda nao fechou no UNO (mesmo motivo do fallback de
  // demonstrativoFundosCliente): o proprio UNO abre o Dashboard por padrao
  // no ultimo mes fechado, nao no mes calendario atual — replicamos isso
  // pra nao mostrar Patrimonio/Rentabilidade de um mes com dado obsoleto.
  const lastClosedMonth = new Date()
  lastClosedMonth.setDate(1)
  lastClosedMonth.setMonth(lastClosedMonth.getMonth() - 1)
  const [selectedMonth, setSelectedMonth] = useState(lastClosedMonth.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(lastClosedMonth.getFullYear())
  const [period, setPeriod] = useState('36')
  const [chartMode, setChartMode] = useState('mensal')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [clients, setClients] = useState([])
  const [ownClientName, setOwnClientName] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(() => {
    try {
      return localStorage.getItem(CLIENT_STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })

  // Super Admin escolhe entre todos os clientes reais do UNO; cliente comum
  // so precisa do nome do proprio vinculo (resolvido no servidor).
  useEffect(() => {
    if (isSuperAdminUser) {
      fetchUnoClients().then(setClients).catch(() => {})
    } else if (profile?.uno_client_id) {
      fetchOwnUnoClientName().then(setOwnClientName).catch(() => {})
      setSelectedClientId(profile.uno_client_id)
    }
  }, [isSuperAdminUser, profile?.uno_client_id])

  useEffect(() => {
    if (isSuperAdminUser && !selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].uno_client_id)
    }
  }, [isSuperAdminUser, clients, selectedClientId])

  useEffect(() => {
    if (!isSuperAdminUser || !selectedClientId) return
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, selectedClientId)
    } catch {
      // ponytail: localStorage indisponivel (modo privado) — a escolha so nao persiste
    }
  }, [isSuperAdminUser, selectedClientId])

  const clientName = isSuperAdminUser
    ? clients.find((c) => c.uno_client_id === selectedClientId)?.name || ''
    : ownClientName

  useEffect(() => {
    if (!selectedClientId) return
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const range = rangeForPeriod(period, selectedMonth, selectedYear)
        const result = await fetchUnoDashboard({
          ...range,
          month: selectedMonth,
          year: selectedYear,
          clientId: selectedClientId
        })
        setData(result)
      } catch (err) {
        setError(err.message || 'Erro ao carregar o dashboard do UNO.')
      }
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedMonth, selectedYear, selectedClientId, reload])

  const vm = useMemo(
    () => buildUnoDashboardViewModel(data, { period, month: selectedMonth, year: selectedYear }),
    [data, period, selectedMonth, selectedYear]
  )

  const patrimonio = vm.patrimonio
  const computedMetrics = {
    rentabilidadeMes: vm.rentabilidade.mes,
    rentabilidadeAcum: vm.rentabilidade.acum,
    metaMes: vm.meta.mes,
    metaAcum: vm.meta.acum,
    gapMes: vm.gap.mes,
    gapAcum: vm.gap.acum,
    varValue: vm.varValue
  }

  // Tooltips: o view-model devolve os numeros; a montagem da string/JSX fica
  // aqui porque depende do tema/formatadores de exibicao.
  const rentabilidadeMesTooltip = vm.tooltips.rentMes
    ? `${formatPt(vm.tooltips.rentMes.pct, 5)}% | ${formatCurrency(vm.tooltips.rentMes.rendimento)}`
    : null
  const rentabilidadeAcumTooltip = vm.tooltips.rentAcum ? (
    <>
      {formatPt(vm.tooltips.rentAcum.pct, 5)}% | {formatCurrency(vm.tooltips.rentAcum.valor)}
      <br />
      acum. {vm.tooltips.rentAcum.fromLabel} → {vm.tooltips.rentAcum.toLabel}
    </>
  ) : null

  const GAP_TOOLTIP = 'Diferença entre Rentabilidade e Meta'

  const comparisonData = vm.comparison
  const evolution = vm.evolution

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

  // O relatorio precisa sair sempre no "formato desktop" (grade cheia,
  // graficos ocupando 100% da largura), mesmo gerado a partir do celular.
  // @media print sozinho nao resolve: o Recharts so remede a largura do
  // grafico via ResizeObserver, e window.print() bloqueia a thread antes
  // desse remedimento assincrono ter a chance de rodar. Em vez de depender
  // do timing da impressao, aplicamos a classe "desktop" ANTES de chamar
  // window.print() (isPrinting vira true, React re-renderiza, o Recharts
  // remede com folga) e so entao disparamos a impressao de verdade.
  const [isPrinting, setIsPrinting] = useState(false)
  const handlePrint = () => setIsPrinting(true)

  useEffect(() => {
    if (!isPrinting) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print())
    })
    const onAfterPrint = () => setIsPrinting(false)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [isPrinting])

  const isMensal = chartMode === 'mensal'

  return (
    <Box id="uno-dashboard-report" className={isPrinting ? 'report-print-mode' : undefined} sx={{ bgcolor: 'background.default' }}>
      <Container className="report-container" maxWidth="xl" sx={{ py: 3 }}>

        <Box className="report-filters-row" sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mb: 1 }}>
          <FormControl size="small" sx={{ minWidth: { xs: 84, sm: 140 } }}>
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

          <FormControl size="small" sx={{ minWidth: { xs: 68, sm: 100 } }}>
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

          {isSuperAdminUser ? (
            <Autocomplete
              size="small"
              sx={{ minWidth: { xs: 120, sm: 240 }, flex: { xs: '1 1 auto', sm: '0 1 auto' } }}
              options={clients}
              getOptionLabel={(c) => c.name}
              isOptionEqualToValue={(a, b) => a.uno_client_id === b.uno_client_id}
              value={clients.find((c) => c.uno_client_id === selectedClientId) || null}
              onChange={(_, value) => value && setSelectedClientId(value.uno_client_id)}
              disableClearable
              // dois clientes reais do UNO podem ter o mesmo "municipio" (ex.:
              // "Espírito Santo - BR"); a key tem que ser o id, não o label.
              renderOption={(props, option) => (
                <li {...props} key={option.uno_client_id}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} placeholder="Selecione um cliente" sx={selectStyles(theme)} />
              )}
            />
          ) : (
            clientName && (
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {clientName}
              </Typography>
            )
          )}
        </Box>

        <Box
          className="report-header-row"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 2
          }}
        >
          <Typography className="report-title" variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Dashboard
          </Typography>

          <Button
            className="report-button"
            variant="contained"
            onClick={handlePrint}
            startIcon={<Printer size={18} />}
            sx={{
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 13,
              minWidth: { xs: 40, sm: 'auto' },
              width: { xs: 40, sm: 'auto' },
              height: { xs: 40, sm: 'auto' },
              p: { xs: 0, sm: undefined },
              px: { xs: 0, sm: 3 },
              py: { xs: 0, sm: 1.2 },
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
              '& .MuiButton-startIcon': { m: { xs: 0, sm: undefined }, mr: { xs: 0, sm: 1 } }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Gerar Relatório
            </Box>
          </Button>
        </Box>

        <Box
          className="report-interactive-hide"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}
        >
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
              flexShrink: 0,
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
          <Box className="report-body-stack" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              className="report-summary-grid"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
                gap: { xs: 1, sm: 2 }
              }}
            >
              {/* No mobile (2 colunas) o Patrimonio ocupa a linha inteira, e o
                  resto forma pares: Rentabilidade+Meta, Gap+VaR. */}
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                <SummaryCard label="Patrimônio">
                  <BigValue value={patrimonio} />
                </SummaryCard>
              </Box>

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
                  { key: 'metaMes', label: 'Mês', unit: '%' },
                  { key: 'metaAcum', label: 'Acum.', unit: '%' }
                )}
              </SummaryCard>

              <SummaryCard label="Gap" info={GAP_TOOLTIP}>
                {renderMetrics(
                  computedMetrics,
                  { key: 'gapMes', label: 'Mês', unit: ' P.P.', negative: 'auto' },
                  { key: 'gapAcum', label: 'Acum.', unit: ' P.P.', negative: 'auto' }
                )}
              </SummaryCard>

              <SummaryCard
                label={(
                  <>
                    VaR
                    <Box component="span" sx={{ fontSize: 10, ml: 0.5, color: 'text.disabled' }}>1,252</Box>
                  </>
                )}
              >
                <Typography className="value-positive" sx={{ fontSize: { xs: 17, sm: 24 }, fontWeight: 600, color: theme.palette.success.main }}>
                  {formatPt(computedMetrics.varValue, 4) ?? '—'}
                  {computedMetrics.varValue !== null && <Box component="span" className="value-unit" sx={{ fontSize: { xs: 11, sm: 14 }, fontWeight: 400 }}>%</Box>}
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
              <Typography className="report-chart-title" variant="h6" sx={{ mb: 3 }}>
                Evolução do Patrimônio
              </Typography>
              {evolution.length === 0 ? (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                  <Typography color="text.secondary" align="center">
                    Sem dados de evolução para o período selecionado.
                  </Typography>
                </Box>
              ) : (
                <Box className="report-chart-box" sx={{ height: 360, width: '100%' }}>
                  <ResponsiveContainer
                    width={isPrinting ? REPORT_CHART_WIDTH : '100%'}
                    height={isPrinting ? REPORT_CHART_HEIGHT : '100%'}
                  >
                    <BarChart data={evolution} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} minTickGap={28} />
                      <YAxis
                        tickFormatter={compactCurrency}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        width={90}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="valor" name="Patrimônio" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} isAnimationActive={!isPrinting} />
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
              <Box className="report-chart-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">
                  Rentabilidade x Meta
                </Typography>
                <ToggleButtonGroup
                  className="report-interactive-hide"
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
                <Box className="report-chart-box" sx={{ height: 400, width: '100%' }}>
                  <ResponsiveContainer
                    width={isPrinting ? REPORT_CHART_WIDTH : '100%'}
                    height={isPrinting ? REPORT_CHART_HEIGHT : '100%'}
                  >
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
                        isAnimationActive={!isPrinting}
                      />
                      <Line
                        type="monotone"
                        dataKey={isMensal ? 'rentMes' : 'rentAcum'}
                        name="rentabilidade"
                        stroke={RENTABILIDADE_LINE_COLOR}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={!isPrinting}
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
