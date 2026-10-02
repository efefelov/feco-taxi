import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10) || 30, 100)
    const rides = await db.rideRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ rides })
  } catch (e) {
    console.error('GET /api/rides/history error:', e)
    return NextResponse.json({ rides: [], error: 'db_error' }, { status: 500 })
  }
}
