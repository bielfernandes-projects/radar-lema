// Mensagens amigaveis para erros do Supabase/PostgREST: o texto cru vaza nome de tabela e de
// policy ("new row violates row-level security policy for table ..."). Erros que o proprio app
// lanca (`new Error('...')`, sem `code`) ja sao mensagens para o usuario e passam intactos.
const BY_CODE = {
  '42501': 'Você não tem permissão para esta ação.',
  '23505': 'Já existe um registro com esses dados.',
  '23503': 'Este registro depende de outro que não existe ou está em uso.',
  '23502': 'Preencha todos os campos obrigatórios.',
  '23514': 'Algum valor informado não é válido.',
  '22001': 'Algum texto informado é longo demais.',
  PGRST301: 'Sessão expirada. Faça login novamente.'
}

export function friendlyError(err, fallback = 'Não foi possível concluir a ação. Tente novamente.') {
  if (BY_CODE[err?.code]) return BY_CODE[err.code]
  // Erro do PostgREST sem mapeamento: nada de texto cru na tela.
  if (err?.code || err?.hint || err?.details) return fallback
  return err?.message || fallback
}
