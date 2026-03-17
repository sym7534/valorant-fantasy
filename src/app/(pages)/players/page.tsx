'use client'

import { useState, useEffect } from 'react'
import PlayerStatsTable from '@/src/components/player/PlayerStatsTable'
import Input from '@/src/components/ui/Input'
import Select from '@/src/components/ui/Select'

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (region) params.set('region', region)
    if (role) params.set('role', role)

    const timer = setTimeout(() => {
      fetch(`/api/players?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => { setPlayers(data.players ?? []); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [search, region, role])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Player Stats</h1>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
          />
        </div>
        <Select
          value={region}
          onChange={setRegion}
          options={[
            { label: 'All Regions', value: '' },
            { label: 'Americas', value: 'Americas' },
            { label: 'Pacific', value: 'Pacific' },
            { label: 'EMEA', value: 'EMEA' },
            { label: 'China', value: 'China' },
          ]}
        />
        <Select
          value={role}
          onChange={setRole}
          options={[
            { label: 'All Roles', value: '' },
            { label: 'Duelist', value: 'Duelist' },
            { label: 'Initiator', value: 'Initiator' },
            { label: 'Controller', value: 'Controller' },
            { label: 'Sentinel', value: 'Sentinel' },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ff4655] border-t-transparent" />
        </div>
      ) : (
        <PlayerStatsTable players={players} />
      )}
    </div>
  )
}
