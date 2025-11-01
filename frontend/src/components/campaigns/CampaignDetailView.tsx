'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Eye,
  Download,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useCampaignProgress } from '@/hooks/useCampaignProgress'
import { formatDistanceToNow } from 'date-fns'
import type { VideoStatus } from '@/types'

interface CampaignDetailViewProps {
  campaignId: number
  onBack: () => void
  onRefresh: () => void
}

export function CampaignDetailView({ campaignId, onBack, onRefresh }: CampaignDetailViewProps) {
  const { campaign, loading, refresh } = useCampaignProgress(campaignId)
  const [showScript, setShowScript] = useState(false)
  const [approving, setApproving] = useState(false)
  const [selectedVideoIndices, setSelectedVideoIndices] = useState<number[]>([])
  const supabase = createClient()

  const toggleVideoSelection = (index: number) => {
    setSelectedVideoIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleApprove = async () => {
    if (selectedVideoIndices.length === 0) {
      toast.error('Please select at least one video to approve')
      return
    }

    setApproving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvedIndices: selectedVideoIndices
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve videos')
      }

      toast.success(`${selectedVideoIndices.length} video(s) approved and posting initiated`)
      refresh()
      onRefresh()
    } catch (error: any) {
      console.error('Failed to approve videos:', error)
      toast.error(error.message || 'Failed to approve videos')
    } finally {
      setApproving(false)
    }
  }

  const getVideoStatusIcon = (status: VideoStatus['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="card-glass">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">Campaign not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-black text-white">{campaign.name}</h1>
            <p className="text-gray-400 text-sm mt-1">Topic: {campaign.topic}</p>
          </div>
        </div>
        <Badge className={
          campaign.status === 'completed' ? 'bg-green-500/10 text-green-400' :
          campaign.status === 'failed' ? 'bg-red-500/10 text-red-400' :
          campaign.status === 'pending_review' ? 'bg-yellow-500/10 text-yellow-400' :
          'bg-blue-500/10 text-blue-400'
        }>
          {campaign.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Overall Progress */}
      {['creating', 'generating_script', 'generating_videos', 'downloading', 'posting'].includes(campaign.status) && (
        <Card className="card-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">{campaign.current_step}</span>
              <span className="text-blue-400 font-bold">{campaign.progress}%</span>
            </div>
            <Progress value={campaign.progress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Script Section */}
      {campaign.script && (
        <Card className="card-glass">
          <CardContent className="p-6">
            <button
              onClick={() => setShowScript(!showScript)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-bold text-white">Generated Script</h2>
              {showScript ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            
            {showScript && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Hook</h3>
                  <p className="text-white">{campaign.script.hook}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Facts</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {campaign.script.facts.map((fact, i) => (
                      <li key={i} className="text-white">{fact}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Call to Action</h3>
                  <p className="text-white">{campaign.script.cta}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video Generation Progress */}
      {campaign.videos_status && campaign.videos_status.length > 0 && (
        <Card className="card-glass">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Video Generation ({campaign.videos_status.filter(v => v.status === 'completed').length}/{campaign.videos_status.length} completed)
            </h2>
            <div className="space-y-3">
              {campaign.videos_status.map((video, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox (only for pending review) */}
                    {campaign.status === 'pending_review' && video.status === 'completed' && (
                      <Checkbox
                        checked={selectedVideoIndices.includes(index)}
                        onCheckedChange={() => toggleVideoSelection(index)}
                        className="mt-1"
                      />
                    )}

                    {/* Video Preview */}
                    {video.status === 'completed' && video.url && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          controls={false}
                          muted
                          loop
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                      </div>
                    )}

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getVideoStatusIcon(video.status)}
                        <span className="font-medium text-white">Video {index + 1}</span>
                        {video.approved && (
                          <Badge className="bg-green-500/10 text-green-400 text-xs">Approved</Badge>
                        )}
                        {video.rejected && (
                          <Badge className="bg-red-500/10 text-red-400 text-xs">Rejected</Badge>
                        )}
                      </div>

                      {video.status === 'in_progress' && (
                        <div className="space-y-1">
                          <Progress value={video.progress} className="h-2" />
                          <span className="text-xs text-gray-400">{video.progress}% complete</span>
                        </div>
                      )}

                      {video.status === 'completed' && video.url && (
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </a>
                          <a
                            href={video.url}
                            download
                            className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </div>
                      )}

                      {video.status === 'failed' && (
                        <p className="text-xs text-red-400">Generation failed</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Approval Controls */}
            {campaign.status === 'pending_review' && (
              <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Ready for Review
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Select the videos you want to approve for posting. Unselected videos will be rejected.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setSelectedVideoIndices(campaign.videos_status?.map((_, i) => i) || [])}
                    variant="outline"
                    size="sm"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={() => setSelectedVideoIndices([])}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={selectedVideoIndices.length === 0 || approving}
                    className="btn-gradient ml-auto"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Approve {selectedVideoIndices.length} Video{selectedVideoIndices.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Posting Status */}
      {campaign.posting_status && campaign.posting_status.length > 0 && (
        <Card className="card-glass">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Posting Status ({campaign.total_posted} posted, {campaign.total_failed} failed)
            </h2>
            <div className="space-y-2">
              {campaign.posting_status.map((post, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">@{post.account_username}</span>
                      <Badge className="text-xs">{post.platform}</Badge>
                    </div>
                    <span className="text-sm text-gray-400">Video {post.video_index + 1}</span>
                  </div>
                  <div className="text-right">
                    {post.status === 'posted' && (
                      <Badge className="bg-green-500/10 text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Posted
                      </Badge>
                    )}
                    {post.status === 'posting' && (
                      <Badge className="bg-blue-500/10 text-blue-400">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Posting...
                      </Badge>
                    )}
                    {post.status === 'failed' && (
                      <Badge className="bg-red-500/10 text-red-400">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    {post.posted_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="card-glass">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Activity Log</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
              <div className="flex-1">
                <p className="text-white">Campaign created</p>
                <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            {campaign.started_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                <div className="flex-1">
                  <p className="text-white">Generation started</p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(campaign.started_at), { addSuffix: true })}</p>
                </div>
              </div>
            )}
            {campaign.reviewed_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                <div className="flex-1">
                  <p className="text-white">Videos reviewed ({campaign.approved_video_count} approved, {campaign.rejected_video_count} rejected)</p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(campaign.reviewed_at), { addSuffix: true })}</p>
                </div>
              </div>
            )}
            {campaign.completed_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2" />
                <div className="flex-1">
                  <p className="text-white">Campaign completed</p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(campaign.completed_at), { addSuffix: true })}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

