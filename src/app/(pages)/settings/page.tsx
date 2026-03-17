'use client'

import { useState, useEffect } from 'react'
import Button from '@/src/components/ui/Button'
import Input from '@/src/components/ui/Input'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    draftTurn: true,
    tradeReceived: true,
    tradeResolved: true,
    weekResults: true,
    lineupReminder: true,
  })

  useEffect(() => {
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((data) => {
        setName(data.user?.name ?? '')
        setEmail(data.user?.email ?? '')
        if (data.notifications) setNotifications(data.notifications)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div>
          <label className="block text-sm text-[#8b978f] mb-1">Display Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" />
        </div>
        <div>
          <label className="block text-sm text-[#8b978f] mb-1">Email</label>
          <div className="bg-[#0f1923] px-3 py-2 rounded text-[#8b978f] text-sm">{email}</div>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </section>

      <section className="bg-[#1a2634] rounded-lg border border-[#2a3a4d] p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {([
          ['draftTurn', "It's my turn to draft"],
          ['tradeReceived', 'Trade offer received'],
          ['tradeResolved', 'Trade offer accepted/declined'],
          ['weekResults', 'Weekly results available'],
          ['lineupReminder', 'Lineup lock reminder'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">{label}</span>
            <button
              onClick={() => toggleNotif(key)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                notifications[key] ? 'bg-[#ff4655]' : 'bg-[#243447]'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notifications[key] ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        ))}
      </section>
    </div>
  )
}
