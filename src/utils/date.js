const ARGENTINA_OFFSET = 180

export function toArgentinaDate(dateTimeStr) {
  const d = new Date(dateTimeStr)
  const browserOffset = d.getTimezoneOffset()
  return new Date(d.getTime() + (ARGENTINA_OFFSET - browserOffset) * 60000)
}

export function nowArgentina() {
  const d = new Date()
  const browserOffset = d.getTimezoneOffset()
  return new Date(d.getTime() + (ARGENTINA_OFFSET - browserOffset) * 60000)
}

export function getStatus(t) {
  if (t.finished) return { label: 'Finalizado', color: 'bg-gray-800 text-gray-400' }
  if (!t.dateTime) return { label: 'Próximo', color: 'bg-green-900 text-green-300' }
  return new Date(t.dateTime) <= new Date()
    ? { label: 'En curso', color: 'bg-blue-900 text-blue-300' }
    : { label: 'Próximo', color: 'bg-green-900 text-green-300' }
}
