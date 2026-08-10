export function safeUrl(value) {
  if (!value) return undefined
  const trimmed = String(value).trim()
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return undefined
}

export function isSafeUrl(value) {
  return Boolean(safeUrl(value))
}