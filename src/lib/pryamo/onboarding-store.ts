'use client'

import { create } from 'zustand'

interface OnboardingState {
  open: boolean
  /** Растёт при каждом открытии: ключ для полного сброса состояния визарда */
  sessionId: number
  openWizard: () => void
  closeWizard: () => void
}

/** Глобальное состояние онбординг-визарда: триггеры из hero и waitlist */
export const useOnboarding = create<OnboardingState>((set) => ({
  open: false,
  sessionId: 0,
  openWizard: () => set((s) => ({ open: true, sessionId: s.sessionId + 1 })),
  closeWizard: () => set({ open: false }),
}))
