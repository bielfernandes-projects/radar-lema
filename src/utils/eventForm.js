export function parseDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`)
}

export function formatDateTime(date) {
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 19)
  }
}

export function calculateDelta(original, updated) {
  const origStart = parseDateTime(original.start_date, original.start_time)
  const origEnd = parseDateTime(original.end_date, original.end_time)
  const updStart = parseDateTime(updated.start_date, updated.start_time)
  const updEnd = parseDateTime(updated.end_date, updated.end_time)

  return {
    startDeltaMs: updStart.getTime() - origStart.getTime(),
    durationDeltaMs:
      updEnd.getTime() -
      updStart.getTime() -
      (origEnd.getTime() - origStart.getTime())
  }
}

export function applyDelta(session, delta) {
  const start = parseDateTime(session.start_date, session.start_time)
  const end = parseDateTime(session.end_date, session.end_time)

  const newStart = new Date(start.getTime() + delta.startDeltaMs)
  const newEnd = new Date(end.getTime() + delta.startDeltaMs + delta.durationDeltaMs)

  const startFmt = formatDateTime(newStart)
  const endFmt = formatDateTime(newEnd)

  return {
    ...session,
    start_date: startFmt.date,
    start_time: startFmt.time,
    end_date: endFmt.date,
    end_time: endFmt.time
  }
}

export function emptySession() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    start_date: today,
    start_time: '09:00:00',
    end_date: today,
    end_time: '10:00:00'
  }
}

export function validate(form, sessions) {
  if (!form.title.trim()) return 'Título é obrigatório.'

  if (form.is_recurring && (!form.recurrence_freq || !form.recurrence_until)) {
    return 'Preencha frequência e data fim para eventos recorrentes.'
  }
  if (form.is_recurring && form.recurrence_until < new Date().toISOString().slice(0, 10)) {
    return 'Datas no passado. Ajuste a data fim da recorrência antes de salvar.'
  }

  if (form.is_tentative) return ''

  if (!form.description.trim()) return 'Descrição é obrigatória.'
  if (!form.url.trim()) return 'Link de inscrição é obrigatório.'
  if (!/^https?:\/\//i.test(form.url.trim())) {
    return 'Link de inscrição deve começar com http:// ou https://.'
  }
  if (!form.category_ids?.length) return 'Selecione pelo menos uma categoria.'
  if (form.modality !== 'online' && !form.address.trim()) {
    return 'Endereço é obrigatório para eventos presenciais ou híbridos.'
  }
  if (!form.is_free && !form.price_from) return 'Informe o valor a partir de.'
  if (sessions.length === 0) return 'Adicione pelo menos uma sessão.'

  for (const session of sessions) {
    if (!session.start_date || !session.start_time || !session.end_date || !session.end_time) {
      return 'Preencha data e horário de todas as sessões.'
    }

    const start = parseDateTime(session.start_date, session.start_time)
    const end = parseDateTime(session.end_date, session.end_time)
    if (end < start) {
      return 'A data/horário de fim deve ser depois do início em todas as sessões.'
    }
  }

  return ''
}
