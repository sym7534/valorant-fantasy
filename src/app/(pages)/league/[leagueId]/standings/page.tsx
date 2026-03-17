'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import StandingsTable from '@/src/components/league/StandingsTable'
import PointsChart from '@/src/components/league/PointsChart'

export default function StandingsPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/standings`)
      .then((r) => r.json())
      .then((data) => { setStandings(data.standings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [leagueId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ff4655] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Standings</h1>
      <StandingsTable standings={standings} />
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[#8b978f]">POINTS OVER TIME</h2>
        <div className="bg-[#1a2634] rounded p-4 border border-[#2a3a4d]">
          <PointsChart standings={standings} />
        </div>
      </section>
    </div>
  )
}
