// Mescla o layout salvo do usuario com o registro de blocos. Funcao pura.
export function resolveHomeLayout(saved, registry) {
  const known = new Set(registry.map((b) => b.id))
  const seen = new Set()
  const result = []

  if (Array.isArray(saved)) {
    for (const item of saved) {
      if (!item || !known.has(item.id) || seen.has(item.id)) continue
      seen.add(item.id)
      result.push({ id: item.id, visible: item.visible === true })
    }
  }

  for (const block of registry) {
    if (!seen.has(block.id)) result.push({ id: block.id, visible: block.defaultVisible })
  }

  if (!result.some((i) => i.visible)) {
    result.find((i) => i.id === registry[0].id).visible = true
  }
  return result
}
