import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'

// PATCH /api/leagues/[leagueId]/trades/[tradeId] — accept/decline/cancel trade
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; tradeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leagueId, tradeId } = await params
    const body = await request.json()
    const { action } = body as { action: 'accept' | 'decline' | 'cancel' }

    if (!['accept', 'decline', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept, decline, or cancel' }, { status: 400 })
    }

    // Trade action placeholder - will be implemented when Trade model is in schema
    return NextResponse.json({
      trade: {
        id: tradeId,
        leagueId,
        status: action === 'accept' ? 'ACCEPTED' : action === 'decline' ? 'DECLINED' : 'CANCELLED',
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('PATCH trades/[tradeId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
