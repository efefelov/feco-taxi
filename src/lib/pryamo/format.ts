export function rub(n: number, opts?: { sign?: boolean; compact?: boolean }): string {
  const { sign = false, compact = false } = opts ?? {}
  const abs = Math.abs(n)
  let s: string
  if (compact && abs >= 1_000_000) {
    s = `${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')} млн ₽`
  } else if (compact && abs >= 10_000) {
    s = `${Math.round(abs / 1000)} тыс. ₽`
  } else {
    s = `${Math.round(abs).toLocaleString('ru-RU')} ₽`
  }
  if (sign && n > 0) return `+${s}`
  if (n < 0) return `−${s}`
  return s
}

export function num(n: number): string {
  return Math.round(n).toLocaleString('ru-RU')
}

export function pct(n: number, digits = 0): string {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits).replace('.', ',')}%`
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function minutesWord(n: number): string {
  return plural(n, 'минуту', 'минуты', 'минут')
}

export function hoursWord(n: number): string {
  return plural(n, 'час', 'часа', 'часов')
}

// Оценка цены по правилам ПРЯМО (совпадает с движком)
export function estimatePrice(
  tariff: { baseFare: number; perKm: number; perMin: number; multiplier: number },
  distanceKm: number,
  durationMin: number,
  surge = 1
): number {
  const raw = (tariff.baseFare + tariff.perKm * distanceKm + tariff.perMin * durationMin) *
    tariff.multiplier * surge
  return Math.round(raw / 10) * 10
}
