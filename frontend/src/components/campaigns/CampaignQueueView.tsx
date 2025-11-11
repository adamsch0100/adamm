'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Calendar,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QueueItem {
  id: number
  content_type: 'post' | 'comment' | 'reply' | 'dm'
  content_data: any
  scheduled_for: string
  priority: number
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'rate_limited' | 'cancelled'
  attempts: number
  max_attempts: number
  error_message?: string
  posted_at?: string
  created_at: string
  social_accounts: {
    platform: string
    username: string
  }
}

interface CampaignQueueViewProps {
  campaignId: string
}

export function CampaignQueueView({ campaignId }: CampaignQueueViewProps) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchQueueItems()
  }, [campaignId])

  const fetchQueueItems = async () => {
    try {
      setRefreshing(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('posting_queue')
        .select(`
          *,
          social_accounts (
            platform,
            username
          )
        `)
        .eq('campaign_id', parseInt(campaignId))
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setQueueItems(data || [])
    } catch (error) {
      console.error('Fetch queue items error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      processing: { icon: Loader2, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Processing' },
      posted: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-400 border-green-500/30', label: 'Posted' },
      failed: { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Failed' },
      rate_limited: { icon: Pause, color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', label: 'Rate Limited' },
      cancelled: { icon: AlertCircle, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', label: 'Cancelled' }
    }
    return configs[status as keyof typeof configs] || configs.pending
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

  // Calculate queue statistics
  const stats = {
    total: queueItems.length,
    pending: queueItems.filter(item => item.status === 'pending').length,
    processing: queueItems.filter(item => item.status === 'processing').length,
    posted: queueItems.filter(item => item.status === 'posted').length,
    failed: queueItems.filter(item => item.status === 'failed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Posts</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
            <div className="text-sm text-gray-400">Processing</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{stats.posted}</div>
            <div className="text-sm text-gray-400">Posted</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Posting Queue</CardTitle>
            <CardDescription className="text-gray-400">
              Scheduled posts for this campaign
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueueItems}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No posts scheduled for this campaign</p>
              <p className="text-sm mt-1">Generate content and schedule posts to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueItems.map((item) => {
                const statusConfig = getStatusConfig(item.status)
                const StatusIcon = statusConfig.icon

                return (
                  <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-750 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gray-600 rounded-lg">
                        <span className="text-lg">{getPlatformIcon(item.social_accounts?.platform || '')}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${statusConfig.color} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          @{item.social_accounts?.username}
                        </span>
                        {item.posted_at && (
                          <span className="text-sm text-gray-400">
                            • {formatDistanceToNow(new Date(item.posted_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-300 mb-2">
                        {item.content_data?.text || item.content_data?.caption || 'No content preview'}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduled: {new Date(item.scheduled_for).toLocaleString()}
                        </span>
                        {item.attempts > 0 && (
                          <span>
                            Attempts: {item.attempts}/{item.max_attempts}
                          </span>
                        )}
                        <span>
                          Priority: {item.priority}
                        </span>
                      </div>

                      {item.error_message && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                          {item.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
