'use client'

import { useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  link: string | null
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // Silently fail on poll errors
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = useCallback(async (notificationIds?: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationIds ? { notificationIds } : { markAllRead: true }),
      })
      await fetchNotifications()
    } catch {
      // Silently fail
    }
  }, [fetchNotifications])

  return { notifications, unreadCount, markRead }
}
