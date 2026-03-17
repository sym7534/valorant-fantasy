'use client'

import { useState, useEffect, useCallback } from 'react'

interface LeagueData {
  id: string
  name: string
  inviteCode: string
  status: string
  rosterSize: number
  draftPickTime: number
  creatorId: string
  members: {
    id: string
    userId: string
    user: { id: string; name: string | null; image: string | null }
    joinedAt: string
  }[]
}

export function useLeague(leagueId: string | null) {
  const [league, setLeague] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leagues/${leagueId}`)
      if (!res.ok) throw new Error('Failed to fetch league')
      const data = await res.json()
      setLeague(data.league)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => { refresh() }, [refresh])

  return { league, loading, error, refresh }
}
