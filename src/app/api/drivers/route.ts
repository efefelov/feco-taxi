import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const drivers = await db.driverProfile.findMany({ orderBy: { rides: 'desc' } })
    return NextResponse.json({ drivers })
  } catch (e) {
    console.error('GET /api/drivers error:', e)
    return NextResponse.json({ drivers: [], error: 'db_error' }, { status: 500 })
  }
}
