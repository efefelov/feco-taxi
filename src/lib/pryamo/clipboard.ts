/**
 * Копирование текста в буфер с fallback для контекстов без Clipboard API
 * (headless-браузеры, http-origins). Единая реализация для FAQ, калькулятора,
 * отчёта по смене и шаринга ссылок.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/**
 * Шаринг текста: нативный Web Share API, если доступен (мобильные),
 * иначе — копирование в буфер. Возвращает способ, которым поделились.
 */
export async function shareText(
  text: string
): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (e) {
      // AbortError — пользователь закрыл шит; считаем неудачей без копирования
      if (e instanceof Error && e.name === 'AbortError') return 'failed'
      // прочие ошибки — падаем на буфер
    }
  }
  const ok = await copyText(text)
  return ok ? 'copied' : 'failed'
}
