'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  MessageSquare, Search, TrendingUp, ArrowUp,
  Loader2, ExternalLink
} from 'lucide-react'

export default function RedditPage() {
  const [loading, setLoading] = useState(false)
  const [threads, setThreads] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/reddit/threads?limit=50', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Fetch threads error:', error)
    }
  }

  const handleSearchThreads = async () => {
    if (!searchQuery) {
      toast.error('Enter a search query')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/reddit/search-threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          searchQuery,
          options: { maxResults: 20 }
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Found ${result.stored} ranking threads!`)
        fetchThreads()
      }

    } catch (error: any) {
      toast.error(error.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateComment = async (threadId: number) => {
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/reddit/comment/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          threadId,
          options: { variations: 3, tone: 'helpful' }
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Generated ${result.generated} comment variations!`)
      }

    } catch (error: any) {
      toast.error(error.message || 'Comment generation failed')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400'
      case 'negative': return 'bg-red-500/20 text-red-400'
      case 'neutral': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-blue-500/20 text-blue-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Reddit Automation
        </h1>
        <p className="text-gray-400 mt-2">
          Comment hijacking, upvote dripping, and traffic generation
        </p>
      </div>

      {/* Thread Discovery */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Thread Discovery</CardTitle>
          <CardDescription>
            Find Google-ranking Reddit threads to target
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder='e.g., "best crypto wallet" or "how to start mining"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchThreads()}
            />
            <Button onClick={handleSearchThreads} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Searches: "[your query] site:reddit.com" on Google to find ranking threads
          </p>
        </CardContent>
      </Card>

      {/* Discovered Threads */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Discovered Threads</CardTitle>
          <CardDescription>
            {threads.length} thread{threads.length !== 1 && 's'} ranked on Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          {threads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p>No threads discovered yet</p>
              <p className="text-sm mt-2">Use the search above to find ranking threads</p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread: any) => (
                <div key={thread.id} className="p-4 bg-gray-700/50 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{thread.thread_title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          #{thread.google_rank}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        r/{thread.subreddit} • {thread.upvotes} upvotes • {thread.comment_count} comments
                      </div>
                    </div>
                    {thread.sentiment && (
                      <Badge variant="secondary" className={getSentimentColor(thread.sentiment)}>
                        {thread.sentiment}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(thread.thread_url, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View Thread
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateComment(thread.id)}
                      disabled={loading}
                    >
                      <MessageSquare className="mr-2 h-3 w-3" />
                      Generate Comment
                    </Button>
                    <div className="flex-1" />
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                      Priority: {thread.target_priority}/10
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">How Reddit Automation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-300 text-sm">
          <div>
            <h4 className="font-semibold text-white mb-1">1. Thread Discovery</h4>
            <p className="text-gray-400">
              Searches Google for ranking Reddit threads using your keywords. Prioritizes threads
              with high engagement and good Google rankings.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">2. Comment Generation</h4>
            <p className="text-gray-400">
              AI generates human-like comments with NO LINKS (to avoid spam detection). Comments
              are helpful, match the thread tone, and subtly build authority.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">3. Upvote Dripping</h4>
            <p className="text-gray-400">
              Gradually upvotes your comments (10-25 upvotes over 48 hours) using different Reddit
              accounts. Random timing avoids detection.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">4. Traffic Generation</h4>
            <p className="text-gray-400">
              Upvoted comments rank higher → more visibility → users check your profile → visit
              bio link → convert to sales. Jacky Chou made $45k in 4 weeks with this method.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


