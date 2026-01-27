'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/actions/notifications'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileEdit, 
  Target, 
  Award,
  AlertCircle,
  Trash2,
  CheckCheck
} from 'lucide-react'
import type { Notification } from '@/lib/types/database'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadData = async () => {
    setLoading(true)
    setError('')

    const result = await getMyNotifications()
    if (result.success && result.data) {
      setNotifications(result.data)
    } else {
      setError(result.error || 'Failed to load notifications')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarkAsRead = (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        await loadData()
      } else {
        setError(result.error || 'Failed to mark notification as read')
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        await loadData()
      } else {
        setError(result.error || 'Failed to mark all notifications as read')
      }
    })
  }

  const handleDelete = (notificationId: string) => {
    startTransition(async () => {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        await loadData()
      } else {
        setError(result.error || 'Failed to delete notification')
      }
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_missed':
      case 'deadline_overdue':
        return <Clock className="w-5 h-5 text-red-500" />
      case 'edit_request':
        return <FileEdit className="w-5 h-5 text-blue-500" />
      case 'edit_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'edit_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'kpi_submitted':
        return <Target className="w-5 h-5 text-purple-500" />
      case 'points_allocated':
        return <Award className="w-5 h-5 text-yellow-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.related_entity_type === 'edit_request') {
      if (notification.type === 'edit_request') {
        return '/hod/edit-requests'
      } else if (notification.type === 'edit_approved' || notification.type === 'edit_rejected') {
        return '/employee/edit-requests'
      }
    } else if (notification.related_entity_type === 'kpi_cycle') {
      if (notification.type === 'kpi_submitted') {
        return '/hod/review'
      } else if (notification.type === 'points_allocated') {
        return '/employee/goals'
      }
    } else if (notification.related_entity_type === 'kpi_goal') {
      return '/employee/progress'
    }
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              variant="outline"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground text-center">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification)
              const content = (
                <Card 
                  key={notification.id}
                  className={`transition-colors ${
                    !notification.is_read 
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                      : 'hover:bg-muted/50'
                  } ${link ? 'cursor-pointer' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {notification.title}
                            {!notification.is_read && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                New
                              </Badge>
                            )}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleMarkAsRead(notification.id)
                              }}
                              disabled={isPending}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              handleDelete(notification.id)
                            }}
                            disabled={isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )

              return link ? (
                <Link key={notification.id} href={link}>
                  {content}
                </Link>
              ) : (
                content
              )
            })}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
