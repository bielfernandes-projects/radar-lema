import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { CalendarDays, Heart, Lock, MousePointerClick, UserPlus, Users } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { supabase } from '../lib/supabase'

const PERIODS = [7, 30, 90]

const SCREEN_LABELS = {
  '/': 'Início',
  '/noticias': 'Notícias',
  '/artigos': 'Artigos',
  '/materiais': 'Materiais de Apoio',
  '/eventos': 'Eventos',
  '/favoritos': 'Favoritos',
  '/realizados': 'Eventos realizados',
  '/novidades-uno': 'Novidades UNO',
  '/dashboard-uno': 'Dashboard UNO',
  '/configuracoes': 'Configurações',
  '/gestao': 'Gestão de eventos',
  '/categorias': 'Categorias',
  '/moderacao': 'Moderação',
  '/admin': 'Painel Admin'
}

const dayLabel = (iso) => {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

const toMonthSeries = (rows) =>
  (rows || []).map(({ month, count }) => ({
    month: month ? month.split('-').reverse().join('/') : month,
    count
  }))

const toSeries = (rows) => (rows || []).map((r) => ({ day: dayLabel(r.day), count: r.count }))

export function Kpi({ icon, label, value, hint, accent }) {
  const theme = useTheme()
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.2 : 0.12)
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontSize: '0.95rem' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        <Box sx={{ width: '100%', height: 240, mt: 2, minWidth: 0 }}>{children}</Box>
      </CardContent>
    </Card>
  )
}

export default function UsageDashboard({ stats }) {
  const theme = useTheme()
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data: metrics, error: rpcError } = await supabase.rpc('admin_usage_metrics', {
      p_days: days
    })
    if (rpcError) {
      setError('Não foi possível carregar as métricas de uso.')
      return
    }
    setError('')
    setData(metrics)
  }, [days])

  useEffect(() => {
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [load])

  const primary = theme.palette.primary.main
  const grid = theme.palette.divider
  const axis = theme.palette.text.secondary
  const tooltipStyle = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    color: theme.palette.text.primary,
    fontSize: 13
  }
  const axisProps = { tick: { fill: axis, fontSize: 12 }, stroke: grid, tickLine: false }

  if (error) return <Alert severity="error">{error}</Alert>
  if (!data) return <LinearProgress />

  const conversion = data.lock_opened
    ? Math.round((data.lock_clicked / data.lock_opened) * 100)
    : 0
  const screens = (data.top_screens || []).map((s) => ({
    ...s,
    name: SCREEN_LABELS[s.path] || s.path
  }))

  return (
    <Stack spacing={2.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: data.active_now > 0 ? 'success.main' : 'text.disabled',
              boxShadow: data.active_now > 0 ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.2)}` : 'none'
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {data.active_now} {data.active_now === 1 ? 'usuário' : 'usuários'} no app agora
          </Typography>
        </Stack>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={days}
          onChange={(_, value) => value && setDays(value)}
        >
          {PERIODS.map((p) => (
            <ToggleButton key={p} value={p} sx={{ px: 2, textTransform: 'none' }}>
              {p} dias
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 4 }}>
          <Kpi
            icon={<Users size={18} />}
            label="Usuários ativos"
            value={data.active_users}
            hint={`${data.screen_views} telas vistas`}
            accent={primary}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Kpi
            icon={<UserPlus size={18} />}
            label="Contas criadas"
            value={data.new_users}
            hint={`${data.total_users} no total`}
            accent={theme.palette.success.main}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Kpi
            icon={<Lock size={18} />}
            label="Cadeado aberto"
            value={data.lock_opened}
            hint="vezes no período"
            accent={theme.palette.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Kpi
            icon={<MousePointerClick size={18} />}
            label="Leads ao comercial"
            value={data.lock_clicked}
            hint={`${conversion}% de quem abriu o cadeado`}
            accent={theme.palette.favorite?.main || primary}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Kpi
            icon={<CalendarDays size={18} />}
            label="Eventos"
            value={stats?.total_events ?? 0}
            hint="cadastrados na plataforma"
            accent={theme.palette.info.main}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Kpi
            icon={<Heart size={18} />}
            label="Favoritos"
            value={stats?.total_favorites ?? 0}
            hint="eventos favoritados"
            accent={theme.palette.favorite?.main || primary}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
          <ChartCard title="Usuários ativos por dia" subtitle="Usuários distintos com atividade no app">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={toSeries(data.active_by_day)} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primary} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="day" {...axisProps} minTickGap={24} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Usuários']} />
                <Area type="monotone" dataKey="count" stroke={primary} strokeWidth={2.5} fill="url(#usageFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
          <ChartCard title="Telas mais acessadas" subtitle="Visualizações no período">
            {screens.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ pt: 8, textAlign: 'center' }}>
                Ainda sem dados. As visitas começam a aparecer conforme o app é usado.
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={screens} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...axisProps} />
                  <YAxis type="category" dataKey="name" width={110} {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: alpha(primary, 0.08) }} formatter={(v) => [v, 'Visualizações']} />
                  <Bar dataKey="views" fill={primary} radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <ChartCard title="Contas criadas por dia" subtitle="Novos cadastros">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toSeries(data.signups_by_day)} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="day" {...axisProps} minTickGap={24} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: alpha(primary, 0.08) }} formatter={(v) => [v, 'Contas']} />
                <Bar dataKey="count" fill={theme.palette.success.main} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <ChartCard title="Leads do cadeado por dia" subtitle="Cliques em “Falar com um consultor”">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toSeries(data.leads_by_day)} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="day" {...axisProps} minTickGap={24} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: alpha(primary, 0.08) }} formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="count" fill={theme.palette.favorite?.main || primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <ChartCard title="Crescimento de usuários" subtitle="Novas contas por mês (histórico completo)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toMonthSeries(stats?.users_by_month)} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: alpha(primary, 0.08) }} formatter={(v) => [v, 'Usuários']} />
                <Bar dataKey="count" fill={primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <ChartCard title="Favoritos por mês" subtitle="Eventos favoritados">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toMonthSeries(stats?.favorites_by_month)} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: alpha(primary, 0.08) }} formatter={(v) => [v, 'Favoritos']} />
                <Bar dataKey="count" fill={theme.palette.favorite?.main || primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Stack>
  )
}
