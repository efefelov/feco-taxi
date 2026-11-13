'use client'

import { useCallback, useEffect, useState } from 'react'
import { generationFromBirthYear, type Generation } from './generations'

/**
 * Профили двух самостоятельных приложений ПРЯМО.
 *
 * Пассажир: имя, телефон, год рождения (→ поколение → названия тарифов).
 * Водитель: имя, авто, госномер, план (12% / Pro), пакет «ПРЯМО Готов».
 *
 * Живут в localStorage (hydration-safe: чтение только в эффекте).
 * Это прототип: «регистрация» хранится локально на устройстве.
 */

export interface PassengerProfile {
  onboarded: boolean
  name: string
  phone: string
  birthYear: number | null
}

export interface DriverProfile {
  onboarded: boolean
  name: string
  car: string
  plate: string
  plan: 'percent' | 'pro'
  readyPack: boolean
}

const PASSENGER_KEY = 'pryamo:passenger:profile:v1'
const DRIVER_KEY = 'pryamo:driver:profile:v1'

export const EMPTY_PASSENGER: PassengerProfile = { onboarded: false, name: '', phone: '', birthYear: null }
export const EMPTY_DRIVER: DriverProfile = { onboarded: false, name: '', car: '', plate: '', plan: 'percent', readyPack: false }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const v = JSON.parse(raw)
    return typeof v === 'object' && v !== null ? { ...fallback, ...v } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* приватный режим — живём без сохранения */
  }
}

export function usePassengerProfile() {
  const [profile, setProfile] = useState<PassengerProfile>(EMPTY_PASSENGER)

  useEffect(() => {
    setProfile(read(PASSENGER_KEY, EMPTY_PASSENGER))
  }, [])

  const save = useCallback((next: PassengerProfile) => {
    setProfile(next)
    write(PASSENGER_KEY, next)
  }, [])

  const generation: Generation | null =
    profile.birthYear ? generationFromBirthYear(profile.birthYear) : null

  return { profile, save, generation }
}

export function useDriverProfile() {
  const [profile, setProfile] = useState<DriverProfile>(EMPTY_DRIVER)

  useEffect(() => {
    setProfile(read(DRIVER_KEY, EMPTY_DRIVER))
  }, [])

  const save = useCallback((next: DriverProfile) => {
    setProfile(next)
    write(DRIVER_KEY, next)
  }, [])

  return { profile, save }
}

/** Прочитать профиль водителя синхронно (для движка/вещания между вкладками) */
export function readDriverProfile(): DriverProfile {
  if (typeof window === 'undefined') return EMPTY_DRIVER
  return read(DRIVER_KEY, EMPTY_DRIVER)
}

/** Прочитать профиль пассажира синхронно */
export function readPassengerProfile(): PassengerProfile {
  if (typeof window === 'undefined') return EMPTY_PASSENGER
  return read(PASSENGER_KEY, EMPTY_PASSENGER)
}
