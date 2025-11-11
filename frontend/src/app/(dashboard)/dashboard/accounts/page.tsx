'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Pause,
  Twitter,
  Smartphone,
  Flame,
  Settings,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react'

interface Device {
  id: number
  name: string
  status: string
  country: string
  adb_enabled: boolean
}

interface WarmupStatus {
  accountId: number
  platform: string
  dayNumber: number
  totalDays: number
  status: string
  nextSessionAt: string | null
  actionsCompleted: number
  topics?: string[]
}

export default function AccountsPage() {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<any[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [warmupStatuses, setWarmupStatuses] = useState<Record<number, WarmupStatus>>({})
  const [loading, setLoading] = useState(false)
  const [warmupLoading, setWarmupLoading] = useState<Record<number, boolean>>({})

  // Upload-Post profile management
  const [uploadPostProfiles, setUploadPostProfiles] = useState<any[]>([])
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // Add account form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccount, setNewAccount] = useState({
    platform: 'tiktok',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    uploadPostProfileKey: '',
    cloudPhoneId: null as number | null,
    notes: '',
    warmupTopics: 'make money online, passive income, side hustle, entrepreneurship, financial freedom',
    warmupDuration: 5
  })

  useEffect(() => {
    fetchAccounts()
    fetchDevices()

    // Poll for warmup status updates every 10 seconds
    const interval = setInterval(() => {
      loadWarmupStatuses()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const fetchAccounts = async () => {
    try {
      console.log('🔍 Fetching accounts...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session found:', !!session)
      if (!session) {
        console.log('No session, returning')
        return
      }

      console.log('Making API call to backend...')
      const response = await fetch('http://localhost:3000/api/accounts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        console.log('Setting accounts:', data.accounts || [])
        setAccounts(data.accounts || [])
        // Load warmup statuses for accounts
        loadWarmupStatuses(data.accounts || [])
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error?.error || 'Failed to load accounts')
      }
    } catch (error) {
      console.error('Fetch accounts error:', error)
      toast.error('Failed to load accounts')
    }
  }

  const fetchDevices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/cloud-phones', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDevices(data.cloud_phones || [])
        if (data.warning) {
          toast.warning(data.warning)
        }
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error?.error || 'Failed to load devices')
      }
    } catch (error) {
      console.error('Fetch devices error:', error)
      toast.error('Failed to load devices')
    }
  }

  const loadWarmupStatuses = async (accountList?: any[]) => {
    const targets = accountList && accountList.length ? accountList : accounts
    if (targets.length === 0) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const statuses: Record<number, WarmupStatus> = {}

    const results = await Promise.all(
      targets.map(async (account) => {
      try {
          const response = await fetch(`http://localhost:3000/api/warmup/status/${account.id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()
          return { accountId: account.id, data }
      } catch (error) {
        console.error(`Failed to load warmup status for account ${account.id}:`, error)
          return null
        }
      })
    )

    for (const result of results) {
      if (result?.data?.status && result.data.status !== 'not_started') {
        statuses[result.accountId] = result.data
      }
    }

    setWarmupStatuses(statuses)
  }

  const fetchUploadPostProfiles = async () => {
    setProfileLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/upload-post/profiles')
      if (response.ok) {
        const data = await response.json()
        setUploadPostProfiles(data.profiles || [])
      } else {
        console.error('Failed to fetch Upload-Post profiles')
      }
    } catch (error) {
      console.error('Fetch profiles error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleCreateProfile = async (username: string) => {
    setProfileLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/upload-post/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        toast.success('Upload-Post profile created!')
        fetchUploadPostProfiles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create profile')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleGenerateLinkUrl = async (username: string, platforms?: string[]) => {
    setProfileLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/upload-post/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username,
          platforms: platforms || ['tiktok', 'instagram', 'youtube', 'facebook', 'linkedin', 'twitter'],
          redirect_url: `${window.location.origin}/dashboard/accounts`
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Open the link URL in a new tab
        window.open(data.access_url, '_blank')
        toast.success('Opening account connection page...')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate link URL')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate link URL')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleDeleteProfile = async (username: string) => {
    if (!confirm(`Delete Upload-Post profile "${username}"?`)) return

    setProfileLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/upload-post/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        toast.success('Profile deleted')
        fetchUploadPostProfiles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete profile')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.username.trim()) {
      toast.error('Username is required')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Authentication required')
        setLoading(false)
        return
      }

      const authHeader = `Bearer ${session.access_token}`

      toast.info('Setting up account integrations...')

      // Step 1: Ensure Upload-Post profile exists
      let uploadPostProfileKey = newAccount.uploadPostProfileKey
      if (!uploadPostProfileKey) {
        try {
          const profileResponse = await fetch('http://localhost:3000/api/upload-post/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify({})
          })

          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            uploadPostProfileKey = profileData?.profile?.profile_key
              || profileData?.profile?.profileKey
              || profileData?.username

            toast.success('Upload-Post profile ready')
          } else {
            console.log('Upload-Post response status:', profileResponse.status)
            console.log('Upload-Post response headers:', Object.fromEntries(profileResponse.headers.entries()))

            let error = {}
            try {
              const responseText = await profileResponse.text()
              console.log('Upload-Post raw response text:', responseText)

              error = JSON.parse(responseText)
              console.log('Upload-Post parsed error:', error)
            } catch (parseError) {
              console.log('Upload-Post JSON parse error:', parseError)
              error = { error: `HTTP ${profileResponse.status}: ${profileResponse.statusText}` }
            }

            // Handle Upload-Post errors gracefully
            console.error('Upload-Post profile creation failed:', error)

            // Check if it's an account limit error
            if (error?.error?.includes('limit') || error?.message?.includes('limit') ||
                error?.error?.includes('account') || error?.message?.includes('account')) {
              console.log('Upload-Post account limit reached, continuing without profile')
              toast.warning('Upload-Post account limit reached - account will be created without posting capabilities')
              uploadPostProfileKey = null // Explicitly set to null
            } else {
            toast.error(error?.error || 'Failed to create Upload-Post profile')
            setLoading(false)
            return
            }
          }
        } catch (error) {
          console.error('Upload-Post profile creation error:', error)
          toast.error('Failed to setup Upload-Post profile')
          setLoading(false)
          return
        }
      }

      // Step 2: Ensure MoreLogin device exists
      let cloudPhoneId = newAccount.cloudPhoneId
      if (!cloudPhoneId) {
        try {
          const deviceResponse = await fetch('http://localhost:3000/api/morelogin/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify({
              name: `${newAccount.platform}_${newAccount.username}_${Date.now()}`,
              country: 'US',
              autoProxy: true,
              platform: newAccount.platform,
              username: newAccount.username,
              skuId: 10002, // Model X for TikTok automation
              userId: session.user?.id
            })
          })

          if (deviceResponse.ok) {
            const deviceData = await deviceResponse.json()
            cloudPhoneId = Number(deviceData?.cloudPhoneId || deviceData?.id || deviceData?.cloud_phone_id)
            toast.success('MoreLogin device created')
          } else {
            const error = await deviceResponse.json().catch(() => ({}))
            console.error('MoreLogin device creation failed:', error)
            toast.error(error?.error || 'Failed to create MoreLogin device')
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('MoreLogin device creation error:', error)
          toast.error('Failed to setup MoreLogin device')
          setLoading(false)
          return
        }
      }

      if (!uploadPostProfileKey) {
        toast.error('Upload-Post profile could not be created')
        setLoading(false)
        return
      }

      if (!cloudPhoneId) {
        toast.error('MoreLogin device could not be created')
        setLoading(false)
        return
      }

      // Step 3: Add the account with both profiles linked
      const accountData = {
        ...newAccount,
        uploadPostProfileKey: String(uploadPostProfileKey),
        cloudPhoneId
      }

      console.log('🗂️ Sending account data to backend:', accountData);

      const response = await fetch('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(accountData)
      })

      if (response.ok) {
        const accountResult = await response.json()

        // Step 4: If warmup topics are specified, start warmup
        if (newAccount.warmupTopics.trim()) {
          toast.info('Starting warmup process...')
          await handleStartWarmup(accountResult.account.id, newAccount.warmupTopics, newAccount.warmupDuration)
        }

        toast.success('Account fully configured with automation!')

        setShowAddForm(false)
        setNewAccount({
          platform: 'tiktok',
          username: '',
          email: '',
          phoneNumber: '',
          password: '',
          uploadPostProfileKey: '',
          cloudPhoneId: null,
          notes: '',
          warmupTopics: 'make money online, passive income, side hustle, entrepreneurship, financial freedom',
          warmupDuration: 5
        })
        fetchAccounts()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error?.error || 'Failed to add account')
      }
    } catch (error: any) {
      console.error('Account creation error:', error)
      toast.error(error.message || 'Failed to add account')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWarmup = async (accountId: number, topics: string, duration: number) => {
    setWarmupLoading(prev => ({ ...prev, [accountId]: true }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Authentication required')
        setWarmupLoading(prev => ({ ...prev, [accountId]: false }))
        return
      }

      const platform = accounts.find(a => a.id === accountId)?.platform || 'tiktok'
      const topicList = topics.split(',').map(t => t.trim()).filter(Boolean)

      const response = await fetch('http://localhost:3000/api/warmup/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          accountId,
          topics: topicList,
          daysTotal: duration,
          platform
        })
      })

      if (response.ok) {
        toast.success(`Warmup started for ${duration} days!`)
        loadWarmupStatuses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start warmup')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start warmup')
    } finally {
      setWarmupLoading(prev => ({ ...prev, [accountId]: false }))
    }
  }

  const handlePromptWarmup = (account: any) => {
    // Use saved warmup topics from account or default
    const topics =
      warmupStatuses[account.id]?.topics?.join(', ') ||
      account.warmup_topics ||
      'make money online, passive income, side hustle, entrepreneurship, financial freedom'
    
    // Use 5 days as standard duration
    const duration = 5

    toast.info('Starting warmup session...')
    handleStartWarmup(account.id, topics, duration)
  }

  const handlePauseWarmup = async (accountId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`/api/warmup/pause/${accountId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        toast.success('Warmup paused')
        loadWarmupStatuses()
      } else {
        toast.error('Failed to pause warmup')
      }
    } catch (error) {
      toast.error('Failed to pause warmup')
    }
  }

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        toast.error('Please log in again')
        return
      }

      console.log('🗑️ Deleting account:', accountId)
      console.log('Session token:', session.access_token?.substring(0, 20) + '...')

      const response = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Delete result:', result)
        toast.success('Account deleted')
        fetchAccounts()
      } else {
        const error = await response.json()
        console.error('Delete failed:', error)
        toast.error(error.error || 'Failed to delete account')
      }
    } catch (error: any) {
      console.error('Delete account error:', error)
      toast.error(error.message || 'Failed to delete account')
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '🎵'
      case 'instagram': return '📸'
      case 'youtube': return '▶️'
      case 'facebook': return '👥'
      case 'linkedin': return '💼'
      case 'twitter': return '𝕏'
      default: return '📱'
    }
  }

  const getWarmupStatusBadge = (status: WarmupStatus) => {
    const progress = (status.dayNumber / status.totalDays) * 100

    switch (status.status) {
      case 'active':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                Warming up (Day {status.dayNumber}/{status.totalDays})
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Warmup Complete
          </Badge>
        )
      case 'paused':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            <Pause className="h-3 w-3 mr-1" />
            Warmup Paused
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Media Hub</h1>
          <p className="text-gray-400 mt-2">Manage accounts, devices, and automation in one place</p>
        </div>
      </div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Social Accounts</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowProfileManager(!showProfileManager)
                if (!showProfileManager) fetchUploadPostProfiles()
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Upload-Post Profiles
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Upload-Post Profile Manager */}
          {showProfileManager && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Upload-Post Profile Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Create profiles and connect your social accounts for automated posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create New Profile */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username (e.g., user123)"
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                    id="new-profile-username"
                  />
                  <Button 
                    onClick={() => {
                      const input = document.getElementById('new-profile-username') as HTMLInputElement
                      if (input?.value) {
                        handleCreateProfile(input.value)
                        input.value = ''
                      } else {
                        toast.error('Please enter a username')
                      }
                    }}
                    disabled={profileLoading}
                  >
                    {profileLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Profile
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing Profiles */}
                <div className="space-y-2">
                  {profileLoading && uploadPostProfiles.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading profiles...
                    </div>
                  ) : uploadPostProfiles.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      No Upload-Post profiles yet. Create one to get started.
                    </div>
                  ) : (
                    uploadPostProfiles.map((profile: any) => (
                      <Card key={profile.username} className="bg-gray-700 border-gray-600">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{profile.username}</h4>
                              {profile.connectedAccounts && profile.connectedAccounts.length > 0 ? (
                                <div className="flex gap-1 mt-2">
                                  {profile.connectedAccounts.map((acc: any) => (
                                    <Badge key={acc.platform} className="bg-green-500/10 text-green-400 border-green-500/30">
                                      {getPlatformIcon(acc.platform)} {acc.platform}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 mt-1">No accounts connected yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleGenerateLinkUrl(profile.username)}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Connect Accounts
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteProfile(profile.username)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                  <p className="text-sm text-blue-400">
                    💡 Create a profile, then click "Connect Accounts" to link your social media accounts via Upload-Post.
                    Once connected, these accounts can be used for automated posting.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Account Form */}
          {showAddForm && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Add New Account</CardTitle>
                <CardDescription className="text-gray-400">
                  Set up a new social media account with optional warmup automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="device">Device Assignment</TabsTrigger>
                    <TabsTrigger value="warmup">Warmup Setup</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                      <p className="text-sm text-blue-400">
                        🚀 <strong>Automated Setup:</strong> Every account will automatically get both an Upload-Post profile and MoreLogin device created for full automation capabilities.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Platform *</label>
                      <select
                        value={newAccount.platform}
                        onChange={(e) => setNewAccount({...newAccount, platform: e.target.value})}
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 mt-1"
                      >
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitter">X/Twitter</option>
                        <option value="facebook">Facebook</option>
                        <option value="linkedin">LinkedIn</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Username *</label>
                      <Input
                        placeholder="@username or profile URL"
                        value={newAccount.username}
                        onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your social media username or profile URL
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Email</label>
                      <Input
                        type="email"
                        placeholder="account@example.com"
                        value={newAccount.email}
                        onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Phone Number</label>
                      <Input
                        placeholder="+1234567890"
                        value={newAccount.phoneNumber}
                        onChange={(e) => setNewAccount({...newAccount, phoneNumber: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Password</label>
                      <Input
                        type="password"
                        placeholder="Account password"
                        value={newAccount.password}
                        onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Notes</label>
                      <Input
                        placeholder="Additional notes about this account"
                        value={newAccount.notes}
                        onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="device" className="space-y-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                      <p className="text-sm text-green-400">
                        ✅ <strong>Automatic Device Creation:</strong> If no device is selected, a new MoreLogin cloud device will be created automatically for this account.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Assign Existing Cloud Device (Optional)</label>
                      <Select
                        value={newAccount.cloudPhoneId?.toString() || ""}
                        onValueChange={(value) => setNewAccount({...newAccount, cloudPhoneId: value ? parseInt(value) : null})}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                          <SelectValue placeholder="Auto-create new device (recommended)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Auto-create new device</SelectItem>
                          {devices.map((device, deviceIndex) => (
                            <SelectItem key={device.id || `device-${deviceIndex}`} value={(device.id || '').toString()}>
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                {device.name} ({device.country}) - {device.status}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Use an existing device or let us create a new one automatically
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="warmup" className="space-y-4">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-md">
                      <p className="text-sm text-orange-400">
                        🔥 <strong>Warmup Ready:</strong> Every account gets a device automatically, so warmup can start immediately once topics are specified.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Warmup Topics</label>
                      <Textarea
                        placeholder="dancing, comedy, cooking, fitness, travel..."
                        value={newAccount.warmupTopics}
                        onChange={(e) => setNewAccount({...newAccount, warmupTopics: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comma-separated topics for warmup automation (searches, likes, follows related content)
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Warmup Duration (Days)</label>
                      <Select
                        value={newAccount.warmupDuration.toString()}
                        onValueChange={(value) => setNewAccount({...newAccount, warmupDuration: parseInt(value)})}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days (Quick warmup)</SelectItem>
                          <SelectItem value="14">14 days (Standard warmup)</SelectItem>
                          <SelectItem value="21">21 days (Thorough warmup)</SelectItem>
                          <SelectItem value="30">30 days (Extended warmup)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        How long to run the automated warmup process
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddAccount} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Account...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Account
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accounts List */}
          {console.log('Rendering accounts:', accounts)}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account: any) => {
              const warmupStatus = warmupStatuses[account.id]
              const assignedDevice = devices.find(d => d.id === account.cloudPhoneId)

              return (
                <Card key={account.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">@{account.username}</h3>
                          <p className="text-sm text-gray-400 capitalize">{account.platform}</p>
                        </div>
                      </div>
                      <Badge className={account.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                        {account.status}
                      </Badge>
                    </div>

                    {/* Warmup Status */}
                    {warmupStatus && (
                      <div className="mb-4">
                        {getWarmupStatusBadge(warmupStatus)}
                      </div>
                    )}

                    {/* Device Assignment */}
                    {assignedDevice && (
                      <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded-md">
                        <div className="flex items-center gap-2 text-sm">
                          <Smartphone className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400">Device: {assignedDevice.name}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div className="flex justify-between">
                        <span>Posts Today:</span>
                        <span className="text-white">{account.posts_today || 0}/{account.daily_post_limit || 10}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Followers:</span>
                        <span className="text-white">{account.followers_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handlePromptWarmup(account)}
                          disabled={warmupLoading[account.id]}
                        className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
                        >
                          {warmupLoading[account.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <>
                            <Flame className="h-3 w-3 mr-1" />
                            Start Warmup
                          </>
                          )}
                        </Button>

                      {warmupStatus?.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePauseWarmup(account.id)}
                          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause Warmup
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {accounts.length === 0 && !showAddForm && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <Twitter className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No accounts added yet</p>
                <Button onClick={() => setShowAddForm(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cloud Devices Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Cloud Devices</h3>
                <p className="text-gray-400 text-sm">MoreLogin cloud phones and browsers for automation</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Device
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Device</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create a new MoreLogin cloud device for account automation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-300">Device Name</label>
                      <Input
                        placeholder="My TikTok Device"
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300">Country</label>
                      <Select defaultValue="us">
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Zap className="mr-2 h-4 w-4" />
                        Create Device
                      </Button>
                      <Button variant="outline">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device, index) => (
                <Card key={device?.id || `device-${index}`} className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Smartphone className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">{device.name}</h4>
                        <p className="text-xs text-gray-400">{device.country}</p>
                      </div>
                      <Badge className={device.status === 'running' ? 'bg-green-600' : 'bg-gray-600'} variant="secondary">
                        {device.status}
                      </Badge>
                    </div>

                    {device.adb_enabled && (
                      <div className="text-xs text-green-400 mb-2">
                        ADB Enabled
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Flame className="h-3 w-3 text-orange-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {devices.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-8">
                  <Smartphone className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No devices created yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Create cloud devices to automate account actions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Warmup Strategy Overview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Warmup Strategy Overview
              </CardTitle>
              <CardDescription className="text-gray-400">
                Automated warmup strategies for healthy account growth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-white">TikTok (14 days):</span> 2-3 sessions/day, 3-7 minutes each.
                  Searches hashtags, likes videos, follows accounts related to specified topics.
                </div>
                <div>
                  <span className="font-semibold text-white">Instagram (7 days):</span> 3 sessions/day, 2-5 minutes each.
                  Views stories, likes posts, explores feed, follows accounts.
                </div>
                <div>
                  <span className="font-semibold text-white">YouTube (5 days):</span> 2 sessions/day, 4-8 minutes each.
                  Watches Shorts, likes videos, subscribes to channels.
                </div>
                <div>
                  <span className="font-semibold text-white">X/Twitter (3 days):</span> 2 sessions/day, 2-4 minutes each.
                  Scrolls timeline, likes tweets, follows accounts, occasional replies.
                </div>
                <div>
                  <span className="font-semibold text-white">Facebook (7 days):</span> 2 sessions/day, 3-6 minutes each.
                  Likes posts, comments, joins groups, occasional shares.
                </div>
                <div>
                  <span className="font-semibold text-white">LinkedIn (5 days):</span> 1-2 sessions/day, 2-4 minutes each.
                  Views profiles, likes posts, connects with people, occasional comments.
                </div>
              </div>
            </CardContent>
          </Card>
    </div>
  )
}
