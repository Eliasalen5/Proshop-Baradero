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
