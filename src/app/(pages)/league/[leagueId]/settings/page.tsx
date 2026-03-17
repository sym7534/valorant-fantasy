'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Button from '@/src/components/ui/Button'
import Input from '@/src/components/ui/Input'
import Modal from '@/src/components/ui/Modal'

export default function LeagueSettingsPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [league, setLeague] = useState<any>(null)
  const [name, setName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}`)
      .then((r) => r.json())
      .then((data) => { setLeague(data.league); setName(data.league?.name ?? '') })
      .catch(() => {})
  }, [leagueId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/leagues/${leagueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">League Settings</h1>

      <section className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-6 space-y-4">
        <h2 className="text-lg font-semibold">General</h2>
        <div>
          <label className="block text-sm text-[#8b978f] mb-1">League Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="League name" />
        </div>
        <div>
          <label className="block text-sm text-[#8b978f] mb-1">Invite Code</label>
          <div className="flex items-center gap-2">
            <code className="bg-[#0f1923] px-3 py-2 rounded text-[#ff4655] font-mono">
              {league?.inviteCode ?? '...'}
            </code>
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(league?.inviteCode ?? '')}>
              Copy
            </Button>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </section>

      <section className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-6 space-y-4">
        <h2 className="text-lg font-semibold">Scoring Formula</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Kills', '+10'], ['Deaths', '-5'], ['Assists', '+5'],
            ['First Kills', '+10'], ['First Deaths', '-10'],
            ['Rounds Won', '+5'], ['Rounds Lost', '-5'], ['ADR', '÷10'],
          ].map(([stat, pts]) => (
            <div key={stat} className="flex justify-between bg-[#0f1923] px-3 py-2 rounded">
              <span className="text-[#8b978f]">{stat}</span>
              <span className="font-mono">{pts}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8b978f]">Captain: 2× · Star Player: 3× (1 week on, 2 weeks off)</p>
      </section>

      <section className="bg-[#1a2634] rounded-lg border border-red-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#ff4655]">Danger Zone</h2>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete League</Button>
      </section>

      <Modal isOpen={showDeleteModal} title="Delete League" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-[#8b978f] mb-4">
            Type <strong className="text-[#ece8e1]">{league?.name}</strong> to confirm deletion.
          </p>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type league name" />
          <div className="flex gap-3 mt-4">
            <Button variant="danger" disabled={deleteConfirm !== league?.name}>Confirm Delete</Button>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </div>
        </Modal>
    </div>
  )
}
