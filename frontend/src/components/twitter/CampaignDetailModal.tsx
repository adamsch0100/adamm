'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Edit, Clock, Trash, Plus, GripVertical, Loader2, Pause, Play } from 'lucide-react'
import { format } from 'date-fns'

interface Campaign {
  id: number
  name: string
  niche?: string
  status: string
  posts_count: number
  next_post_time?: string
  created_at: string
}

interface ScheduledPost {
  id: number
  content: string
  scheduled_for: string
  status: string
  platform: string
}

interface Props {
  campaignId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function CampaignDetailModal({ campaignId, open, onOpenChange, onUpdate }: Props) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaignDetails()
    }
  }, [open, campaignId])

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:3000/api/twitter/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        setPosts(data.posts)
      } else {
        toast.error('Failed to load campaign details')
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error)
      toast.error('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseCampaign = async () => {
    if (!campaign) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const newStatus = campaign.status === 'active' ? 'paused' : 'active'

      const response = await fetch(`http://localhost:3000/api/twitter/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}!`)
        setCampaign({ ...campaign, status: newStatus })
        onUpdate()
      } else {
        toast.error('Failed to update campaign')
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast.error('Failed to update campaign')
    }
  }

  const handleDeleteCampaign = async () => {
    if (!campaign) return
    
    const confirmed = confirm(`Are you sure you want to delete "${campaign.name}"? This will remove all scheduled posts.`)
    if (!confirmed) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:3000/api/twitter/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        toast.success('Campaign deleted')
        onUpdate()
        onOpenChange(false)
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  const handleRemovePost = async (postId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('posting_queue')
        .delete()
        .eq('id', postId)

      if (!error) {
        toast.success('Post removed from campaign')
        setPosts(posts.filter(p => p.id !== postId))
        if (campaign) {
          setCampaign({ ...campaign, posts_count: campaign.posts_count - 1 })
        }
        onUpdate()
      } else {
        toast.error('Failed to remove post')
      }
    } catch (error) {
      console.error('Error removing post:', error)
      toast.error('Failed to remove post')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-600'
      case 'posted': return 'bg-green-600'
      case 'failed': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  if (!campaign) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-white text-2xl mb-2">
                {campaign.name}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {posts.length} post{posts.length !== 1 ? 's' : ''} scheduled
                {campaign.niche && ` • ${campaign.niche}`}
              </DialogDescription>
            </div>
            <Badge className={campaign.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
              {campaign.status}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Posts List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No posts scheduled yet
                </div>
              ) : (
                posts.map((post, index) => (
                  <div key={post.id} className="flex gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                    {/* Drag handle (placeholder for future drag-and-drop) */}
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-gray-600 cursor-move" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white mb-2 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="font-mono">#{index + 1}</span>
                        <span>{format(new Date(post.scheduled_for), 'PPp')}</span>
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 items-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.info('Edit feature coming soon!')}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.info('Reschedule feature coming soon!')}
                        className="h-8 w-8 p-0"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePost(post.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Campaign Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <Button
                onClick={() => toast.info('Add posts feature coming soon!')}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Posts
              </Button>
              <Button
                onClick={handlePauseCampaign}
                variant="outline"
                className="border-gray-600"
              >
                {campaign.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Campaign
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Campaign
                  </>
                )}
              </Button>
              <Button
                onClick={handleDeleteCampaign}
                variant="destructive"
                className="ml-auto"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Campaign
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}




