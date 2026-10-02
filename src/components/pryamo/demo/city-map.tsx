'use client'

import { useMemo } from 'react'
import type { RideDTO, ZoneDTO } from '@/lib/pryamo/types'
import { cn } from '@/lib/utils'

export const MAP_W = 1000
export const MAP_H = 600

/** Хэш строки → стабильное число 0..1 */
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

/** Псевдопозиция адреса на карте (стабильная для одинаковых строк) */
export function addrPos(label: string, zoneId?: string, salt = 0): { x: number; y: number } {
  const zx: Record<string, { x: number; y: number }> = {
    center: { x: 500, y: 300 },
    north: { x: 500, y: 100 },
    south: { x: 500, y: 500 },
    west: { x: 200, y: 300 },
    east: { x: 800, y: 300 },
    airport: { x: 880, y: 90 },
  }
  const base = (zoneId && zx[zoneId]) || { x: 350 + hash01(label, 1) * 300, y: 180 + hash01(label, 2) * 240 }
  const jx = (hash01(label, 10 + salt) - 0.5) * 130
  const jy = (hash01(label, 20 + salt) - 0.5) * 100
  return {
    x: Math.min(MAP_W - 40, Math.max(40, base.x + jx)),
    y: Math.min(MAP_H - 40, Math.max(40, base.y + jy)),
  }
}

/** Полилиния маршрута из 3 точек с ортогональными сегментами */
function buildPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const midX = a.x + (b.x - a.x) * 0.55
  return [
    a,
    { x: midX, y: a.y },
    { x: midX, y: b.y },
    b,
  ]
}

function pointAlong(points: { x: number; y: number }[], t: number) {
  const segs: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    segs.push(d)
    total += d
  }
  let target = total * Math.min(Math.max(t, 0), 1)
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : target / segs[i]
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
        angle:
          (Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x) * 180) / Math.PI,
      }
    }
    target -= segs[i]
  }
  return { x: points[0].x, y: points[0].y, angle: 0 }
}

function demandColor(demand: number): string {
  if (demand >= 75) return '#f43f5e'
  if (demand >= 55) return '#f59e0b'
  if (demand >= 35) return '#eab308'
  return '#10b981'
}

interface CityMapProps {
  variant: 'demand' | 'ride'
  zones?: ZoneDTO[]
  ride?: RideDTO | null
  searching?: boolean
  className?: string
}

export function CityMap({ variant, zones, ride, searching, className }: CityMapProps) {
  const roads = useMemo(
    () => (
      <g stroke="#3f3f46" strokeWidth="10" strokeLinecap="round" opacity="0.85">
        {/* магистрали */}
        <line x1="0" y1="140" x2="1000" y2="140" />
        <line x1="0" y1="300" x2="1000" y2="300" />
        <line x1="0" y1="470" x2="1000" y2="470" />
        <line x1="180" y1="0" x2="180" y2="600" />
        <line x1="500" y1="0" x2="500" y2="600" />
        <line x1="820" y1="0" x2="820" y2="600" />
        {/* диагональ к аэропорту */}
        <line x1="620" y1="180" x2="880" y2="60" strokeWidth="7" opacity="0.7" />
        <line x1="620" y1="420" x2="880" y2="60" strokeWidth="7" opacity="0.7" />
      </g>
    ),
    []
  )

  const blocks = useMemo(() => {
    const rects: React.ReactElement[] = []
    const xs = [60, 110, 230, 280, 330, 400, 450, 540, 590, 640, 700, 740, 860]
    const ys = [50, 90, 170, 210, 250, 330, 370, 410, 500, 540]
    let k = 0
    for (const x of xs) {
      for (const y of ys) {
        if (hash01(`${x}-${y}`, 3) > 0.62) continue
        rects.push(
          <rect
            key={k++}
            x={x}
            y={y}
            width={16 + Math.floor(hash01(`${x}${y}`, 4) * 34)}
            height={12 + Math.floor(hash01(`${x}${y}`, 5) * 26)}
            rx="3"
            fill="#27272a"
            opacity={0.55}
          />
        )
      }
    }
    return rects
  }, [])

  const river = useMemo(
    () => (
      <path
        d="M -20 220 C 150 190, 260 330, 420 320 C 580 310, 660 240, 820 250 C 900 256, 950 220, 1020 230"
        fill="none"
        stroke="#1e3a34"
        strokeWidth="26"
        strokeLinecap="round"
        opacity="0.8"
      />
    ),
    []
  )

  // Геометрия поездки
  const rideGeom = useMemo(() => {
    if (!ride || !ride.from || !ride.to) return null
    const a = addrPos(ride.from.label, ride.from.zoneId, 0)
    const b = addrPos(ride.to.label, ride.to.zoneId, 1)
    const pts = buildPath(a, b)
    const car = pointAlong(pts, ride.progress ?? 0)
    return { a, b, pts, car }
  }, [ride])

  const carAngle = rideGeom ? rideGeom.car.angle : 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950',
        className
      )}
      role="img"
      aria-label="Схема города с зонами спроса и маршрутом поездки"
    >
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block h-full w-full">
        {roads}
        {blocks}
        {river}

        {/* Зоны спроса */}
        {variant === 'demand' &&
          zones?.map((z) => {
            const color = demandColor(z.demand)
            const r = 36 + (z.demand / 100) * 26
            return (
              <g key={z.id}>
                {z.demand >= 70 && (
                  <circle cx={z.x} cy={z.y} r={r} fill={color} opacity="0.14" className="zone-pulse" />
                )}
                <circle cx={z.x} cy={z.y} r={r} fill={color} opacity="0.22" stroke={color} strokeWidth="2.5" />
                <text x={z.x} y={z.y - 6} textAnchor="middle" fill="#fafafa" fontSize="20" fontWeight="800">
                  {z.name}
                </text>
                <text x={z.x} y={z.y + 20} textAnchor="middle" fill={color} fontSize="26" fontWeight="900" opacity="0.95">
                  {z.demand}%
                </text>
                {z.surge > 1.05 && (
                  <g>
                    <rect x={z.x + r - 6} y={z.y - r - 20} width="72" height="28" rx="14" fill={color} />
                    <text x={z.x + r + 30} y={z.y - r + 0.5} textAnchor="middle" fill="#0a0a0a" fontSize="17" fontWeight="900">
                      ×{z.surge.toFixed(1)}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

        {/* Поездка пассажира */}
        {variant === 'ride' && rideGeom && (
          <g>
            {/* радар поиска */}
            {searching && (
              <g>
                <circle cx={rideGeom.a.x} cy={rideGeom.a.y} r="26" fill="none" stroke="#10b981" strokeWidth="2" className="radar-ring" />
                <circle cx={rideGeom.a.x} cy={rideGeom.a.y} r="26" fill="none" stroke="#10b981" strokeWidth="2" className="radar-ring radar-delay" />
                <circle cx={rideGeom.a.x} cy={rideGeom.a.y} r="8" fill="#10b981" />
              </g>
            )}

            {/* маршрут */}
            <polyline
              points={rideGeom.pts.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeDasharray="10 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />

            {/* точка А */}
            <g transform={`translate(${rideGeom.a.x}, ${rideGeom.a.y})`}>
              <circle r="13" fill="#059669" stroke="#a7f3d0" strokeWidth="3" />
              <text y="4.5" textAnchor="middle" fill="#022c22" fontSize="12" fontWeight="900">A</text>
            </g>
            {/* точка Б */}
            <g transform={`translate(${rideGeom.b.x}, ${rideGeom.b.y})`}>
              <rect x="-11" y="-11" width="22" height="22" rx="6" fill="#f59e0b" stroke="#fde68a" strokeWidth="3" />
              <text y="4.5" textAnchor="middle" fill="#451a03" fontSize="12" fontWeight="900">Б</text>
            </g>

            {/* машина */}
            {ride && ride.status !== 'searching' && (
              <g transform={`translate(${rideGeom.car.x}, ${rideGeom.car.y}) rotate(${carAngle})`}>
                <rect x="-17" y="-10" width="34" height="20" rx="6" fill="#fafafa" stroke="#18181b" strokeWidth="2" />
                <rect x="-9" y="-7" width="14" height="9" rx="2.5" fill="#18181b" opacity="0.5" />
                <rect x="6" y="-7" width="7" height="9" rx="2.5" fill="#059669" />
                <circle cx="-9" cy="11" r="0" fill="none" />
              </g>
            )}
          </g>
        )}

        {/* подпись масштаба */}
        <g opacity="0.5">
          <line x1="30" y1="585" x2="130" y2="585" stroke="#71717a" strokeWidth="2" />
          <text x="80" y="575" textAnchor="middle" fill="#a1a1aa" fontSize="14" fontWeight="600">
            2 км
          </text>
        </g>
      </svg>

      {/* Оверлей: легенда спроса */}
      {variant === 'demand' && (
        <div className="absolute bottom-3 left-3 rounded-xl bg-zinc-950/85 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Спрос по зонам</p>
          <div className="mt-1.5 flex items-center gap-2">
            {[
              { c: '#10b981', l: 'низкий' },
              { c: '#eab308', l: 'средний' },
              { c: '#f59e0b', l: 'высокий' },
              { c: '#f43f5e', l: 'ажиотаж' },
            ].map((x) => (
              <span key={x.l} className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300">
                <span className="h-2 w-2 rounded-full" style={{ background: x.c }} />
                {x.l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
