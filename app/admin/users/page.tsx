'use client'

import { useState, useEffect } from 'react'
import { createUser, updateUser, deleteUser, resetUserPassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, UserPlus, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types/database'

interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  can_act_as_hod: boolean
  division_id: string | null
  location_id: string | null
  is_active: boolean
  is_password_reset_required: boolean
  last_login: string | null
}

interface Division {
  id: string
  name: string
  code: string
}

interface Location {
  id: string
  name: string
  code: string
  division_id: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: '' as UserRole | '',
    canActAsHod: false,
    divisionId: '',
    locationId: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.divisionId) {
      setFilteredLocations(locations.filter(l => l.division_id === formData.divisionId))
      setFormData(prev => ({ ...prev, locationId: '' }))
    } else {
      setFilteredLocations([])
    }
  }, [formData.divisionId, locations])

  const loadData = async () => {
    try {
      const supabase = createClient()

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Load divisions
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (divisionsError) throw divisionsError
      setDivisions(divisionsData || [])

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (locationsError) throw locationsError
      setLocations(locationsData || [])

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    // Validate
    if (!formData.email || !formData.fullName || !formData.role) {
      setError('Please fill in all required fields')
      setSubmitting(false)
      return
    }

    if ((formData.role === 'employee' || formData.role === 'hod') && (!formData.divisionId || !formData.locationId)) {
      setError('Division and location are required for employees and HODs')
      setSubmitting(false)
      return
    }

    try {
      const result = await createUser({
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role as UserRole,
        canActAsHod: formData.canActAsHod,
        divisionId: formData.divisionId || undefined,
        locationId: formData.locationId || undefined,
      })

      if (result.success) {
        setSuccess(result.message || 'User created successfully')
        setShowCreateForm(false)
        setFormData({
          email: '',
          fullName: '',
          role: '',
          canActAsHod: false,
          divisionId: '',
          locationId: '',
        })
        loadData()
      } else {
        setError(result.error || 'Failed to create user')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset password for ${userEmail}? The password will be reset to 'Password123!'`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const result = await resetUserPassword(userId)
      if (result.success) {
        setSuccess(result.message || 'Password reset successfully')
        loadData()
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  const handleDeactivateUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Deactivate user ${userEmail}? They will no longer be able to log in.`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const result = await deleteUser(userId)
      if (result.success) {
        setSuccess(result.message || 'User deactivated successfully')
        loadData()
      } else {
        setError(result.error || 'Failed to deactivate user')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  const getDivisionName = (divisionId: string | null) => {
    if (!divisionId) return '-'
    return divisions.find(d => d.id === divisionId)?.name || '-'
  }

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return '-'
    return locations.find(l => l.id === locationId)?.name || '-'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage system users</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create New User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Default password is 'Password123!' - User will be required to change it on first login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@sathosa.lk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="hod">Head of Division</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'hod' && (
                  <div className="space-y-2">
                    <Label htmlFor="canActAsHod">HOD Privileges</Label>
                    <Select
                      value={formData.canActAsHod ? 'yes' : 'no'}
                      onValueChange={(value) => setFormData({ ...formData, canActAsHod: value === 'yes' })}
                    >
                      <SelectTrigger id="canActAsHod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Can login as HOD or Employee</SelectItem>
                        <SelectItem value="no">HOD only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.role === 'employee' || formData.role === 'hod') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="division">Division *</Label>
                      <Select
                        value={formData.divisionId}
                        onValueChange={(value) => setFormData({ ...formData, divisionId: value })}
                      >
                        <SelectTrigger id="division">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((div) => (
                            <SelectItem key={div.id} value={div.id}>
                              {div.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Select
                        value={formData.locationId}
                        onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                        disabled={!formData.divisionId}
                      >
                        <SelectTrigger id="location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredLocations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Division</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{user.full_name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">{getDivisionName(user.division_id)}</td>
                    <td className="p-3">{getLocationName(user.location_id)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.is_password_reset_required && (
                        <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                          Password Reset Required
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(user.id, user.email)}
                          title="Reset password to default"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        {user.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateUser(user.id, user.email)}
                            title="Deactivate user"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
