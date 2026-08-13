import { supabase } from '../lib/supabase'

const UNO_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uno-proxy`

export async function callUnoProxy(endpoint, params = {}) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const query = new URLSearchParams({ endpoint, ...params })
  const res = await fetch(`${UNO_PROXY_URL}?${query.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 403) {
      throw new Error('Acesso restrito a Clientes Lema.')
    }
    if (res.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    throw new Error(text || 'Erro ao consultar a API do UNO.')
  }

  return res.json()
}

export async function fetchUnoDashboard(period) {
  const rangeParams = {
    consulting_id: '1',
    start_date: period.startDate,
    end_date: period.endDate
  }

  const [demonstrativo, fundos, movimentacoes, titulos, enquadramentos, disponibilidades, meta] =
    await Promise.all([
      callUnoProxy('demonstrativoFundosCliente', {
        consulting_id: '1',
        mes: String(period.month),
        ano: String(period.year)
      }),
      callUnoProxy('fundosCliente', rangeParams),
      callUnoProxy('movimentacoesCliente', rangeParams),
      callUnoProxy('titulosAnalise', rangeParams),
      callUnoProxy('enquadramentosCliente', rangeParams),
      callUnoProxy('disponibilidadesCliente', rangeParams),
      callUnoProxy('metaCliente', rangeParams),
      callUnoProxy('metaClientePorAno', { ano: String(period.year) })
    ])

  return {
    demonstrativo,
    fundos,
    movimentacoes,
    titulos,
    enquadramentos,
    disponibilidades,
    meta
  }
}
