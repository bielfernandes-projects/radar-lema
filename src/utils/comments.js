/**
 * groupComments: comentarios raiz (em ordem) cada um com suas respostas (em ordem).
 * Resposta cujo comentario raiz nao esta na lista (ex.: oculto pela moderacao) aparece como raiz,
 * para a conversa nao sumir.
 */
export function groupComments(comments) {
  const ids = new Set(comments.map((c) => c.id))
  const roots = comments.filter((c) => !c.parent_id || !ids.has(c.parent_id))
  return roots.map((root) => ({
    ...root,
    replies: comments.filter((c) => c.parent_id === root.id)
  }))
}
