'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Badge from '@/src/components/ui/Badge'

export default function PlayerDetailPage() {
  const params = useParams()
  const playerId = params.playerId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/players/${playerId}/stats`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [playerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ff4655] border-t-transparent" />
      </div>
    )
  }

  if (!data?.player) {
    return <div className="text-center py-20 text-[#8b978f]">Player not found</div>
  }

  const { player, totals, averages, matches } = data

  return (
    <div className="space-y-8">
      {/* Player Header */}
      <div className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#243447] rounded-full flex items-center justify-center text-2xl font-bold">
            {player.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{player.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{player.team}</Badge>
              <Badge variant="default">{player.role}</Badge>
              <Badge variant="default">{player.region}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Tiles */}
      {averages && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            ['Matches', totals.matches],
            ['Avg K', averages.kills],
            ['Avg D', averages.deaths],
            ['K/D', averages.kd],
            ['Avg A', averages.assists],
            ['Avg FK', averages.firstKills],
            ['Avg ADR', averages.adr],
            ['Rating', averages.rating],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-[#1a2634] rounded border border-[#2a3a4d] p-3 text-center">
              <div className="text-xs text-[#8b978f] uppercase">{label}</div>
              <div className="text-xl font-bold mt-1">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Total Fantasy Points */}
      <div className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-6 text-center">
        <div className="text-sm text-[#8b978f] uppercase">Total Fantasy Points</div>
        <div className="text-4xl font-bold text-[#ff4655] mt-2">{totals.fantasyPoints}</div>
        <div className="text-sm text-[#8b978f] mt-1">
          Avg per match: {totals.matches > 0 ? (totals.fantasyPoints / totals.matches).toFixed(1) : 0}
        </div>
      </div>

      {/* Match History */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Match History</h2>
        <div className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3a4d] text-[#8b978f] text-left">
                <th className="px-4 py-3">Match</th>
                <th className="px-3 py-3">K</th>
                <th className="px-3 py-3">D</th>
                <th className="px-3 py-3">A</th>
                <th className="px-3 py-3">FK</th>
                <th className="px-3 py-3">FD</th>
                <th className="px-3 py-3">ADR</th>
                <th className="px-3 py-3">Rating</th>
                <th className="px-3 py-3 text-[#ff4655]">FP</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m: any) => (
                <tr key={m.id} className="border-b border-[#2a3a4d]/50 hover:bg-[#243447]/50">
                  <td className="px-4 py-2 font-mono text-xs">#{m.externalMatchId}</td>
                  <td className="px-3 py-2">{m.kills}</td>
                  <td className="px-3 py-2">{m.deaths}</td>
                  <td className="px-3 py-2">{m.assists}</td>
                  <td className="px-3 py-2">{m.firstKills}</td>
                  <td className="px-3 py-2">{m.firstDeaths}</td>
                  <td className="px-3 py-2">{m.adr.toFixed(1)}</td>
                  <td className="px-3 py-2">{m.rating.toFixed(2)}</td>
                  <td className="px-3 py-2 font-bold text-[#ff4655]">{m.fantasyPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
