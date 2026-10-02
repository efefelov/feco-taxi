import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tariffs = await db.tariff.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ tariffs })
  } catch (e) {
    console.error('GET /api/tariffs error:', e)
    return NextResponse.json({ tariffs: [], error: 'db_error' }, { status: 500 })
  }
}
