'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Play, 
  Pause, 
  Loader2, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface SocialAccount {
  id: number
  platform: string
  username: string
  status: string
}

interface WarmupStatus {
  accountId: number
  platform: string
  dayNumber: number
  totalDays: number
  status: string
  nextSessionAt: string | null
  actionsCompleted: number
}

export default function WarmupPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [warmupStatuses, setWarmupStatuses] = useState<Record<number, WarmupStatus>>({})
  const [loading, setLoading] = useState(true)
  const [startingWarmup, setStartingWarmup] = useState<Record<number, boolean>>({})
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
    
    // Poll for warmup status updates every 10 seconds
    const interval = setInterval(() => {
      loadWarmupStatuses()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      // Load social accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('social_accounts')
        .select('*')
        .in('platform', ['tiktok', 'instagram', 'youtube'])

      if (accountsError) throw accountsError

      setAccounts(accountsData || [])

      // Load warmup statuses
      await loadWarmupStatuses()

    } catch (error: any) {
      console.error('Load data error:', error)
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const loadWarmupStatuses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const statuses: Record<number, WarmupStatus> = {}

      for (const account of accounts) {
        const response = await fetch(`http://localhost:3000/api/warmup/status/${account.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status !== 'not_started') {
            statuses[account.id] = data
          }
        }
      }

      setWarmupStatuses(statuses)
    } catch (error) {
      console.error('Load warmup statuses error:', error)
    }
  }

  const handleStartWarmup = async (accountId: number, platform: string) => {
    try {
      setStartingWarmup(prev => ({ ...prev, [accountId]: true }))
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      // Determine warmup duration based on platform
      let daysTotal = 14 // Default for TikTok
      if (platform === 'instagram') daysTotal = 7
      if (platform === 'youtube') daysTotal = 5
      if (platform === 'twitter') {
        toast.info('Twitter doesn\'t require warmup')
        return
      }

      toast.info(`Starting ${daysTotal}-day warmup for ${platform}...`)

      const response = await fetch('http://localhost:3000/api/warmup/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId,
          platform,
          daysTotal
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Warmup started! Day 1/${daysTotal}`)
        loadWarmupStatuses()
      } else {
        throw new Error(data.error)
      }

    } catch (error: any) {
      console.error('Start warmup error:', error)
      toast.error(error.message || 'Failed to start warmup')
    } finally {
      setStartingWarmup(prev => ({ ...prev, [accountId]: false }))
    }
  }

  const handlePauseWarmup = async (accountId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      const response = await fetch(`http://localhost:3000/api/warmup/pause/${accountId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        toast.success('Warmup paused')
        loadWarmupStatuses()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }

    } catch (error: any) {
      console.error('Pause warmup error:', error)
      toast.error(error.message || 'Failed to pause warmup')
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return '🎵'
      case 'instagram':
        return '📸'
      case 'youtube':
        return '▶️'
      default:
        return '📱'
    }
  }

  const getWarmupProgress = (accountId: number) => {
    const status = warmupStatuses[accountId]
    if (!status) return { progress: 0, text: 'Not started', ready: false }
    
    const progress = (status.dayNumber / status.totalDays) * 100
    const ready = status.status === 'completed'
    
    return {
      progress,
      text: ready ? 'Ready to post!' : `Day ${status.dayNumber}/${status.totalDays}`,
      ready
    }
  }

  const getStatusBadge = (accountId: number) => {
    const status = warmupStatuses[accountId]
    if (!status) {
      return <Badge variant="outline" className="border-gray-600 text-gray-400">Not started</Badge>
    }
    
    if (status.status === 'completed') {
      return <Badge className="bg-green-600">✓ Ready</Badge>
    }
    
    if (status.status === 'paused') {
      return <Badge variant="outline" className="border-yellow-600 text-yellow-400">Paused</Badge>
    }
    
    return <Badge className="bg-blue-600">In Progress</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Account Warmup</h1>
        <p className="text-gray-400">
          Warm up your accounts before posting to avoid bans. TikTok requires 14 days, Instagram 7 days.
        </p>
      </div>

      {/* Info Alert */}
      <Card className="bg-blue-900/20 border-blue-700">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">Why Warmup?</h3>
              <p className="text-sm text-gray-300">
                New accounts that post immediately get flagged as spam. Warmup simulates real human behavior 
                (scrolling, liking, following) to build trust before you start posting content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const warmupProgress = getWarmupProgress(account.id)
          const isStarting = startingWarmup[account.id]
          const hasWarmup = warmupStatuses[account.id]
          const isActive = hasWarmup && warmupStatuses[account.id].status === 'in_progress'
          const isPaused = hasWarmup && warmupStatuses[account.id].status === 'paused'

          return (
            <Card key={account.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getPlatformIcon(account.platform)}</span>
                    <div>
                      <CardTitle className="text-white text-lg">@{account.username}</CardTitle>
                      <CardDescription className="capitalize">{account.platform}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(account.id)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-semibold">{warmupProgress.text}</span>
                  </div>
                  <Progress 
                    value={warmupProgress.progress} 
                    className={warmupProgress.ready ? 'bg-green-600' : ''}
                  />
                </div>

                {/* Warmup Details */}
                {hasWarmup && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Actions Today:</span>
                      <span className="text-white">{warmupStatuses[account.id].actionsCompleted}</span>
                    </div>
                    {warmupStatuses[account.id].nextSessionAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Next Session:</span>
                        <span className="text-white">
                          {new Date(warmupStatuses[account.id].nextSessionAt!).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2">
                  {!hasWarmup ? (
                    <Button 
                      onClick={() => handleStartWarmup(account.id, account.platform)}
                      disabled={isStarting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isStarting ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting...</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" /> Start Warmup</>
                      )}
                    </Button>
                  ) : warmupProgress.ready ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Ready to post!</span>
                    </div>
                  ) : isPaused ? (
                    <Button 
                      onClick={() => handleStartWarmup(account.id, account.platform)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" /> Resume Warmup
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handlePauseWarmup(account.id)}
                      variant="outline"
                      className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                    >
                      <Pause className="h-4 w-4 mr-2" /> Pause Warmup
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Accounts Message */}
      {accounts.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 mb-4">No social accounts found</p>
            <Button onClick={() => window.location.href = '/dashboard/accounts'}>
              Add Social Accounts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bottom Info */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Warmup Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div>
            <span className="font-semibold text-white">TikTok (14 days):</span> 2-3 sessions/day, 3-7 minutes each. 
            Scrolls feed, likes videos, searches hashtags, occasionally follows accounts.
          </div>
          <div>
            <span className="font-semibold text-white">Instagram (7 days):</span> 3 sessions/day, 2-5 minutes each. 
            Views stories, likes posts, explores feed, follows accounts.
          </div>
          <div>
            <span className="font-semibold text-white">YouTube (5 days):</span> 2 sessions/day, 4-8 minutes each. 
            Watches Shorts, likes videos, subscribes to channels.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





