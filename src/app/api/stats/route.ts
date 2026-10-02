import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await db.marketStat.findMany()
    return NextResponse.json({ stats })
  } catch (e) {
    console.error('GET /api/stats error:', e)
    return NextResponse.json({ stats: [], error: 'db_error' }, { status: 500 })
  }
}
