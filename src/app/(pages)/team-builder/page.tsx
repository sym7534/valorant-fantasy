'use client'

import { useState, useEffect } from 'react'
import Button from '@/src/components/ui/Button'
import Input from '@/src/components/ui/Input'
import Badge from '@/src/components/ui/Badge'
import { ACTIVE_LINEUP_SIZE, ROLE_SLOTS_BY_ROSTER_SIZE, REGION_MIN_PER, REGIONS } from '@/src/lib/game-config'

interface SlotPlayer {
  id: string
  name: string
  team: string
  role: string
  region: string
}

export default function TeamBuilderPage() {
  const [slots, setSlots] = useState<(SlotPlayer | null)[]>(Array(10).fill(null))
  const [captainIndex, setCaptainIndex] = useState<number | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [buildName, setBuildName] = useState('My Build')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/players?limit=240')
      .then((r) => r.json())
      .then((data) => { setPlayers(data.players ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addPlayer = (player: any) => {
    const emptyIndex = slots.findIndex((s) => s === null)
    if (emptyIndex === -1) return
    const newSlots = [...slots]
    newSlots[emptyIndex] = { id: player.id, name: player.name, team: player.team, role: player.role, region: player.region }
    setSlots(newSlots)
  }

  const removePlayer = (index: number) => {
    const newSlots = [...slots]
    newSlots[index] = null
    setSlots(newSlots)
    if (captainIndex === index) setCaptainIndex(null)
  }

  const filledSlots = slots.filter(Boolean) as SlotPlayer[]
  const regionCounts = REGIONS.reduce((acc, r) => {
    acc[r] = filledSlots.filter((p) => p.region === r).length
    return acc
  }, {} as Record<string, number>)

  const roleCounts = ['Duelist', 'Initiator', 'Controller', 'Sentinel'].reduce((acc, r) => {
    acc[r] = filledSlots.filter((p) => p.role === r).length
    return acc
  }, {} as Record<string, number>)

  const slotLabels = ['Duelist', 'Duelist', 'Initiator', 'Initiator', 'Controller', 'Controller', 'Sentinel', 'Sentinel', 'Wildcard', 'Wildcard']

  const filteredPlayers = players.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !filledSlots.some((s) => s.id === p.id)
  )

  const saveBuild = async () => {
    await fetch('/api/team-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: buildName,
        playerIds: filledSlots.map((p) => p.id),
        captainId: captainIndex !== null ? slots[captainIndex]?.id : null,
      }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Builder</h1>
        <div className="flex gap-2">
          <Input value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="Build name" />
          <Button onClick={saveBuild}>Save Build</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster Slots */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-[#8b978f]">ROSTER SLOTS</h2>
          <div className="grid grid-cols-2 gap-3">
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`bg-[#1a2634] border rounded-lg p-4 ${
                  slot ? 'border-[#2a3a4d]' : 'border-dashed border-[#2a3a4d]'
                }`}
              >
                <div className="text-xs text-[#8b978f] mb-2">{slotLabels[i]} {captainIndex === i && '👑 Captain'}</div>
                {slot ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{slot.name}</div>
                      <div className="text-xs text-[#8b978f]">{slot.team} · {slot.role} · {slot.region}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCaptainIndex(i)}
                        className="text-xs px-2 py-1 rounded bg-[#243447] hover:bg-[#ff4655] transition"
                      >
                        C
                      </button>
                      <button
                        onClick={() => removePlayer(i)}
                        className="text-xs px-2 py-1 rounded bg-[#243447] hover:bg-red-900 transition"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#8b978f] text-sm">Empty slot</div>
                )}
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="bg-[#1a2634] border border-[#2a3a4d] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Constraints</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {REGIONS.map((r) => (
                <div key={r} className={`${regionCounts[r] >= REGION_MIN_PER ? 'text-[#00d4aa]' : 'text-[#8b978f]'}`}>
                  {r}: {regionCounts[r]}/{REGION_MIN_PER}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm mt-2">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div key={role} className={`${count >= 2 ? 'text-[#00d4aa]' : 'text-[#8b978f]'}`}>
                  {role}: {count}/2
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Search */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#8b978f]">PLAYER POOL</h2>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players..." />
          <div className="max-h-[600px] overflow-y-auto space-y-1">
            {filteredPlayers.slice(0, 50).map((p: any) => (
              <button
                key={p.id}
                onClick={() => addPlayer(p)}
                className="w-full text-left px-3 py-2 bg-[#1a2634] hover:bg-[#243447] rounded border border-[#2a3a4d] transition text-sm"
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-[#8b978f]">{p.team} · {p.role} · {p.region}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
