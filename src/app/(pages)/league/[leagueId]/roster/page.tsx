'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import HeroView from '@/src/components/roster/HeroView'
import BenchRow from '@/src/components/roster/BenchRow'
import WeekSelector from '@/src/components/roster/WeekSelector'
import WeeklyScoreBreakdown from '@/src/components/roster/WeeklyScoreBreakdown'
import StarPlayerModal from '@/src/components/roster/StarPlayerModal'
import { useRoster } from '@/src/hooks/useRoster'
import type { RosterPlayer, WeeklyScore } from '@/src/lib/mock-data'

export default function RosterPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const { roster, loading, activateStar } = useRoster(leagueId)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [starModalOpen, setStarModalOpen] = useState(false)
  const [starPlayerName, setStarPlayerName] = useState('')
  const [starPlayerId, setStarPlayerId] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ff4655] border-t-transparent" />
      </div>
    )
  }

  // Build mock weeks for the selector
  const weeks = Array.from({ length: 12 }, (_, i) => ({
    weekNumber: i + 1,
    isLive: i + 1 === selectedWeek,
  }))

  // Build empty weekly score for breakdown
  const weeklyScore: WeeklyScore = {
    weekNumber: selectedWeek,
    totalPoints: 0,
    playerScores: [],
  }

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

      <WeekSelector
        weeks={weeks}
        currentWeek={selectedWeek}
        selectedWeek={selectedWeek}
        onSelectWeek={setSelectedWeek}
      />

      <section>
        <h2 className="text-lg font-semibold mb-4 text-[#8b978f]">ACTIVE LINEUP</h2>
        <HeroView activePlayers={[]} weeklyTotalPoints={0} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-[#8b978f]">BENCH</h2>
        <BenchRow benchPlayers={[]} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-[#8b978f]">WEEKLY SCORE BREAKDOWN</h2>
        <WeeklyScoreBreakdown weeklyScore={weeklyScore} />
      </section>

      <StarPlayerModal
        isOpen={starModalOpen}
        onClose={() => setStarModalOpen(false)}
        playerName={starPlayerName || 'Select a player'}
        onConfirm={() => {
          if (starPlayerId) activateStar(starPlayerId)
          setStarModalOpen(false)
        }}
      />
    </div>
  )
}
