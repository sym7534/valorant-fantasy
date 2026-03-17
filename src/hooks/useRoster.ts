'use client'

import { useState, useEffect, useCallback } from 'react'

interface RosterPlayer {
  id: string
  playerId: string
  player: { id: string; name: string; team: string; region: string; role: string; imageUrl: string | null }
  isCaptain: boolean
  slotType: string
}

interface Roster {
  id: string
  leagueId: string
  players: RosterPlayer[]
  activeLineup: {
    id: string
    weekNumber: number
    isLocked: boolean
    slots: { id: string; rosterPlayerId: string; isStarPlayer: boolean; player: RosterPlayer['player'] }[]
  } | null
}

export function useRoster(leagueId: string | null) {
  const [roster, setRoster] = useState<Roster | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/roster`)
      if (!res.ok) throw new Error('Failed to fetch roster')
      const data = await res.json()
      setRoster(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => { refresh() }, [refresh])

  const submitLineup = useCallback(async (playerIds: string[], weekNumber?: number) => {
    if (!leagueId) return
    const res = await fetch(`/api/leagues/${leagueId}/roster/lineup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds, weekNumber }),
    })
    if (!res.ok) throw new Error('Failed to submit lineup')
    await refresh()
  }, [leagueId, refresh])

  const activateStar = useCallback(async (playerId: string, weekNumber?: number) => {
    if (!leagueId) return
    const res = await fetch(`/api/leagues/${leagueId}/roster/star`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, weekNumber }),
    })
    if (!res.ok) throw new Error('Failed to activate star')
    await refresh()
  }, [leagueId, refresh])

  return { roster, loading, error, refresh, submitLineup, activateStar }
}
