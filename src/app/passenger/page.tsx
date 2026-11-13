'use client'

import dynamic from 'next/dynamic'

/**
 * Самостоятельное приложение пассажира (/passenger).
 * Рендер только на клиенте: приложение целиком живёт на localStorage
 * (онбординг, профиль) и локальном движке — SSR-разметка ему не нужна,
 * а исключение гидрации гарантирует интерактивность на статик-проде.
 */
const PassengerAppPage = dynamic(
  () => import('@/components/pryamo/standalone').then((m) => m.PassengerAppPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh flex-col items-center justify-center bg-zinc-950">
        <p className="text-sm font-bold text-zinc-500">Загрузка приложения пассажира…</p>
      </div>
    ),
  }
)

export default function PassengerPage() {
  return <PassengerAppPage />
}
