'use client'

import dynamic from 'next/dynamic'

/**
 * Самостоятельное приложение водителя (/driver).
 * Клиент-only — см. комментарий в /passenger.
 */
const DriverAppPage = dynamic(
  () => import('@/components/pryamo/standalone').then((m) => m.DriverAppPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh flex-col items-center justify-center bg-zinc-950">
        <p className="text-sm font-bold text-zinc-500">Загрузка приложения водителя…</p>
      </div>
    ),
  }
)

export default function DriverPage() {
  return <DriverAppPage />
}
