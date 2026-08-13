/**
 * Helpers do hub da Lema: formatacao de datas e rotulos dos novos tipos de
 * conteudo (noticias, novidades UNO, artigos, materiais, visibilidade).
 */

export const UNO_UPDATE_TYPES = [
  { value: 'atualizacao', label: 'Atualização' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'bug', label: 'Bug' },
  { value: 'instabilidade', label: 'Instabilidade' }
]

export function unoUpdateTypeLabel(type) {
  return UNO_UPDATE_TYPES.find((t) => t.value === type)?.label || type
}

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público' },
  { value: 'lema_client', label: 'Exclusivo Cliente Lema' }
]

export function visibilityLabel(visibility) {
  return (
    VISIBILITY_OPTIONS.find((v) => v.value === visibility)?.label || visibility
  )
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatHubDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return dateFormatter.format(date)
}

export function formatHubDateTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return dateTimeFormatter.format(date)
}

export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes)) || Number(bytes) < 0) return ''
  const value = Number(bytes)
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
