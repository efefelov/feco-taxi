'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Поколения и персонализация названий тарифов.
 *
 * Идея: при регистрации пассажир указывает год рождения, и названия тарифов
 * подстраиваются под его поколение. ПРЕДОХРАНИТЕЛИ (важно):
 *  1) формула и цена тарифа одни и те же для всех — меняется только слово;
 *  2) каноническое название всегда видно рядом (второй строкой в чеке).
 * Это персонализация интерфейса, а не другой прайс — так прозрачность
 * не ломается, а порог входа (особенно для 60+) снижается.
 */

export type Generation = 'zoomer' | 'millennial' | 'middle' | 'silver'

export interface GenerationInfo {
  id: Generation
  label: string
  years: string
  /** Диапазон годов рождения (включительно) */
  from: number
  to: number
}

const CURRENT_YEAR = new Date().getFullYear()

export const GENERATIONS: GenerationInfo[] = [
  { id: 'zoomer', label: 'Зумер', years: '16–28 лет', from: CURRENT_YEAR - 28, to: CURRENT_YEAR - 16 },
  { id: 'millennial', label: 'Миллениал', years: '29–45 лет', from: CURRENT_YEAR - 45, to: CURRENT_YEAR - 29 },
  { id: 'middle', label: 'Среднее поколение', years: '46–65 лет', from: CURRENT_YEAR - 65, to: CURRENT_YEAR - 46 },
  { id: 'silver', label: 'Серебряный возраст', years: '66+ лет', from: 1930, to: CURRENT_YEAR - 66 },
]

/** Поколение по году рождения (null вне диапазонов — просим уточнить) */
export function generationFromBirthYear(year: number): Generation | null {
  for (const g of GENERATIONS) {
    if (year >= g.from && year <= g.to) return g.id
  }
  return null
}

/** Канонические названия тарифов (одни для всех, из оферты) */
export const CANONICAL_TARIFF_NAMES: Record<string, string> = {
  eco: 'Прямой',
  comfort: 'Ладный',
  'comfort-plus': 'Привольный',
  business: 'Барин',
  van: 'Артель',
  intercity: 'Дальняк',
  cargo: 'Хомяк',
}

/**
 * Персональные названия по поколениям. Тон подобран так, чтобы уважать
 * пользователя, а не косплеить сленг: зумерам — короткие живые слова,
 * серебряному возрасту — простые и тёплые.
 */
export const GENERATION_TARIFF_NAMES: Record<Generation, Record<string, string>> = {
  zoomer: {
    eco: 'Изи',
    comfort: 'Вайб',
    'comfort-plus': 'Чилл',
    business: 'Флекс',
    van: 'Ватага',
    intercity: 'Дальняк',
    cargo: 'Карго',
  },
  // Миллениалы — эталонная аудитория, для них канон без изменений
  millennial: CANONICAL_TARIFF_NAMES,
  middle: {
    eco: 'Простой',
    comfort: 'Удобный',
    'comfort-plus': 'Просторный',
    business: 'Солидный',
    van: 'Компания',
    intercity: 'Междугородний',
    cargo: 'Грузовой',
  },
  silver: {
    eco: 'Понятный',
    comfort: 'Тёплый',
    'comfort-plus': 'Уютный',
    business: 'Классный',
    van: 'Вместительный',
    intercity: 'Далёкий',
    cargo: 'Перевозка',
  },
}

/** Персональное название тарифа; без поколения — каноническое */
export function tariffDisplayName(tariffId: string, generation: Generation | null): string {
  if (generation) {
    const names = GENERATION_TARIFF_NAMES[generation]
    if (names && names[tariffId]) return names[tariffId]
  }
  return CANONICAL_TARIFF_NAMES[tariffId] ?? tariffId
}

const STORAGE_KEY = 'pryamo:generation:v1'

/** Хук поколения: год рождения живёт в localStorage (hydration-safe) */
export function useGeneration() {
  const [birthYear, setBirthYearState] = useState<number | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const n = Number(raw)
      if (Number.isInteger(n) && n >= 1930 && n <= CURRENT_YEAR - 15) {
        setBirthYearState(n)
      }
    } catch {
      /* приватный режим — живём без персонализации */
    }
  }, [])

  const setBirthYear = useCallback((year: number | null) => {
    setBirthYearState(year)
    try {
      if (year === null) window.localStorage.removeItem(STORAGE_KEY)
      else window.localStorage.setItem(STORAGE_KEY, String(year))
    } catch {
      /* без сохранения — персонализация до перезагрузки */
    }
  }, [])

  const generation = birthYear ? generationFromBirthYear(birthYear) : null

  return { birthYear, setBirthYear, generation }
}
