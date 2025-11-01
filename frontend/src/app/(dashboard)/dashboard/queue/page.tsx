import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Pause } from 'lucide-react'

export default async function QueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch queue statistics
  let queueStats = {
    pending: 0,
    processing: 0,
    posted: 0,
    failed: 0,
    rate_limited: 0,
    cancelled: 0,
    total: 0
  }

  if (user) {
    try {
      const response = await fetch('http://localhost:3000/api/queue/status', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })
      if (response.ok) {
        queueStats = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch queue stats:', error)
    }
  }

  // Fetch recent queue items
  const { data: recentQueue } = await supabase
    .from('posting_queue')
    .select(`
      *,
      social_accounts (
        platform,
        username
      )
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-yellow-500', label: 'Pending' },
    processing: { icon: Loader2, color: 'bg-blue-500', label: 'Processing' },
    posted: { icon: CheckCircle2, color: 'bg-green-500', label: 'Posted' },
    failed: { icon: XCircle, color: 'bg-red-500', label: 'Failed' },
    rate_limited: { icon: Pause, color: 'bg-orange-500', label: 'Rate Limited' },
    cancelled: { icon: AlertCircle, color: 'bg-gray-500', label: 'Cancelled' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Posting Queue</h1>
        <p className="text-gray-400 mt-2">
          Manage mass posting with automatic rate limiting and retries
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{queueStats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-yellow-500">{queueStats.pending}</div>
              {queueStats.processing > 0 && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  +{queueStats.processing} processing
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{queueStats.posted}</div>
            {queueStats.total > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {((queueStats.posted / queueStats.total) * 100).toFixed(1)}% success rate
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Failed:</span>
                <span className="text-red-500 font-semibold">{queueStats.failed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Rate Limited:</span>
                <span className="text-orange-500 font-semibold">{queueStats.rate_limited}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Queue Items */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Queue Items</CardTitle>
          <CardDescription>Last 50 posts in the queue</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentQueue || recentQueue.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-400">No items in queue</h3>
              <p className="mt-2 text-gray-500">
                Posts will appear here when you schedule them
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQueue.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.pending
                const Icon = config.icon

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {item.social_accounts?.platform || 'Unknown'}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">
                            @{item.social_accounts?.username || 'unknown'}
                          </span>
                        </div>
                        <div className="text-gray-500 text-sm mt-1">
                          {item.content_type} - Scheduled for {new Date(item.scheduled_for).toLocaleString()}
                        </div>
                        {item.error_message && (
                          <div className="text-red-400 text-xs mt-1">
                            Error: {item.error_message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.attempts > 0 && (
                        <span className="text-xs text-gray-500">
                          Attempt {item.attempts}/{item.max_attempts}
                        </span>
                      )}
                      
                      <Badge
                        variant="secondary"
                        className={`${config.color}/20 border-0`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>

                      {item.posted_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(item.posted_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">How Posting Queue Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Automatic Rate Limiting</h4>
            <p className="text-sm text-gray-400">
              The queue automatically respects platform-specific rate limits to avoid bans. Posts are
              delayed if you hit hourly or daily limits.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Smart Retries</h4>
            <p className="text-sm text-gray-400">
              Failed posts are automatically retried with exponential backoff (10 min, 20 min, 40 min).
              After 3 attempts, they're marked as failed.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Priority Scheduling</h4>
            <p className="text-sm text-gray-400">
              Posts with higher priority (1-10) are processed first. Use priority 10 for urgent posts.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Bulk Posting</h4>
            <p className="text-sm text-gray-400">
              Queue up to 1000s of posts at once. The system processes them in batches of 100,
              respecting all rate limits and account health status.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


