'use client'

import { useParams } from 'next/navigation'
import TradeHub from '@/src/components/league/TradeHub'

export default function TradesPage() {
  const params = useParams()
  const leagueId = params.leagueId as string

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trade Hub</h1>
      <TradeHub leagueId={leagueId} />
    </div>
  )
}
