'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getMyEditRequests, cancelEditRequest } from '@/lib/actions/edit-requests'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { FileEdit, Calendar, AlertCircle, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'

interface EditRequest {
  id: string
  request_reason: string
  requested_changes: any
  status: 'pending' | 'approved' | 'rejected'
  review_remarks: string | null
  reviewed_at: string | null
  created_at: string
  kpi_goals: {
    description: string
    target_type: string
    target_quantity: number | null
    target_deadline: string | null
    kpi_cycles: {
      month: number
      year: number
    }
  }
  reviewed_by_user: {
    full_name: string
  } | null
}

export default function EditRequestsPage() {
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadData = async () => {
    setLoading(true)
    setError('')

    const result = await getMyEditRequests()
    if (result.success && result.data) {
      setRequests(result.data)
    } else {
      setError(result.error || 'Failed to load edit requests')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCancel = (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this edit request?')) return

    startTransition(async () => {
      const result = await cancelEditRequest(requestId)
      if (result.success) {
        await loadData()
      } else {
        setError(result.error || 'Failed to cancel request')
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  }

  const formatChanges = (changes: any) => {
    const items: string[] = []
    if (changes.description) items.push(`Description: "${changes.description}"`)
    if (changes.targetType) items.push(`Target Type: ${changes.targetType}`)
    if (changes.targetQuantity !== undefined) items.push(`Target Quantity: ${changes.targetQuantity}`)
    if (changes.targetDeadline) items.push(`Target Deadline: ${new Date(changes.targetDeadline).toLocaleDateString()}`)
    return items
  }

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Requests</h1>
          <p className="text-muted-foreground">
            Track your requests to modify locked goals
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Edit Requests</h3>
              <p className="text-muted-foreground text-center">
                You haven't submitted any edit requests yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {getMonthName(request.kpi_goals.kpi_cycles.month)} {request.kpi_goals.kpi_cycles.year}
                        </Badge>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardTitle className="text-lg">
                        {request.kpi_goals.description}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Submitted {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {request.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(request.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request Reason */}
                  <div>
                    <p className="text-sm font-medium mb-1">Reason for Request:</p>
                    <p className="text-sm text-muted-foreground">{request.request_reason}</p>
                  </div>

                  {/* Requested Changes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Requested Changes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {formatChanges(request.requested_changes).map((change, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Review Details */}
                  {request.status !== 'pending' && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Review Status:</p>
                        <span className="text-sm text-muted-foreground">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                          {request.reviewed_by_user?.full_name || 'Unknown'}
                        </span>
                      </div>
                      {request.reviewed_at && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                      {request.review_remarks && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">HOD Remarks:</p>
                          <p className="text-sm text-muted-foreground">{request.review_remarks}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
