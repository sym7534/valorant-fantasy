'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Badge from '@/src/components/ui/Badge'

export default function SchedulePage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [schedule, setSchedule] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/schedule`)
      .then((r) => r.json())
      .then((data) => { setSchedule(data); setLoading(false) })
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Match Schedule</h1>

      {schedule?.rosterTeams?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-[#8b978f]">Your teams:</span>
          {schedule.rosterTeams.map((team: string) => (
            <Badge key={team} variant="default">{team}</Badge>
          ))}
        </div>
      )}

      {(!schedule?.weeks || schedule.weeks.length === 0) ? (
        <div className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-12 text-center">
          <p className="text-[#8b978f] text-lg">No schedule data available yet.</p>
          <p className="text-[#8b978f] text-sm mt-2">Match schedule will appear once VCT matches are imported.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.weeks.map((week: any) => (
            <div key={week.weekNumber} className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-4">
              <h3 className="font-semibold mb-3">Week {week.weekNumber}</h3>
              {week.matches?.map((match: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#2a3a4d] last:border-0">
                  <span>{match.teamA} vs {match.teamB}</span>
                  <Badge variant={match.status === 'LIVE' ? 'danger' : 'default'}>{match.status}</Badge>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
