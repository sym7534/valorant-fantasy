'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import HeroView from '@/src/components/roster/HeroView'
import BenchRow from '@/src/components/roster/BenchRow'
import WeekSelector from '@/src/components/roster/WeekSelector'
import WeeklyScoreBreakdown from '@/src/components/roster/WeeklyScoreBreakdown'
import StarPlayerModal from '@/src/components/roster/StarPlayerModal'
import { useRoster } from '@/src/hooks/useRoster'

export default function RosterPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const { roster, loading } = useRoster(leagueId)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [starModalOpen, setStarModalOpen] = useState(false)
  const [starCandidate, setStarCandidate] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ff4655] border-t-transparent" />
      </div>
    )
  }

  const activePlayers = roster?.players?.filter((p: any) => p.slotType !== 'bench').slice(0, 5) ?? []
  const benchPlayers = roster?.players?.slice(5) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Roster</h1>
        <button
          onClick={() => setStarModalOpen(true)}
          className="px-4 py-2 bg-[#ffb800] text-[#0f1923] rounded font-medium hover:bg-[#ffc933] transition"
        >
          Activate Star Player
        </button>
      </div>

      <WeekSelector currentWeek={selectedWeek} onWeekChange={setSelectedWeek} totalWeeks={12} />

      <section>
        <h2 className="text-lg font-semibold mb-4 text-[#8b978f]">ACTIVE LINEUP</h2>
        <HeroView players={activePlayers} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-[#8b978f]">BENCH</h2>
        <div className="space-y-2">
          {benchPlayers.map((p: any) => (
            <BenchRow key={p.id} player={p} onSwap={() => {}} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-[#8b978f]">WEEKLY SCORE BREAKDOWN</h2>
        <WeeklyScoreBreakdown players={activePlayers} week={selectedWeek} />
      </section>

      {starModalOpen && (
        <StarPlayerModal
          players={activePlayers}
          onConfirm={(playerId) => {
            setStarCandidate(playerId)
            setStarModalOpen(false)
          }}
          onClose={() => setStarModalOpen(false)}
        />
      )}
    </div>
  )
}
