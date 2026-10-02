import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ROLES = new Set(['driver', 'fleet'])

function normalizePhone(raw: string): string | null {
  // +7 XXX XXX-XX-XX или 8XXXXXXXXXX — приводим к +7XXXXXXXXXX
  const digits = raw.replace(/\D/g, '')
  let normalized: string
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    normalized = `+7${digits.slice(1)}`
  } else if (digits.length === 10) {
    normalized = `+7${digits}`
  } else {
    return null
  }
  return normalized
}

export async function GET() {
  try {
    const count = await db.waitlistEntry.count()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      role?: string
      name?: string
      phone?: string
      city?: string
      comment?: string
    }

    const name = (body.name ?? '').trim()
    const phoneRaw = (body.phone ?? '').trim()
    const city = (body.city ?? '').trim()
    const role = ROLES.has(body.role ?? '') ? (body.role as string) : 'driver'
    const comment = (body.comment ?? '').trim().slice(0, 300) || undefined

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: 'bad_name' }, { status: 400 })
    }
    const phone = normalizePhone(phoneRaw)
    if (!phone) {
      return NextResponse.json({ error: 'bad_phone' }, { status: 400 })
    }
    if (city.length < 2 || city.length > 60) {
      return NextResponse.json({ error: 'bad_city' }, { status: 400 })
    }

    // Простая защита от дублей по телефону
    const existing = await db.waitlistEntry.findFirst({ where: { phone } })
    if (existing) {
      const count = await db.waitlistEntry.count()
      return NextResponse.json({
        ok: true,
        duplicate: true,
        count,
        position: count,
        message: 'Вы уже в списке — мы помним вас и пришлём инвайт в первой волне.',
      })
    }

    const entry = await db.waitlistEntry.create({
      data: { role, name, phone, city, comment },
    })
    const count = await db.waitlistEntry.count()

    return NextResponse.json({
      ok: true,
      id: entry.id,
      count,
      position: count,
      message:
        role === 'fleet'
          ? 'Заявка принята. Менеджер по таксопаркам свяжется в течение дня.'
          : 'Вы в списке! Инвайт придёт в первой волне — 3 месяца без комиссии.',
    })
  } catch (e) {
    console.error('POST /api/waitlist error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
