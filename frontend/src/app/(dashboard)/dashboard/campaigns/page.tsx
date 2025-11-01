'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Plus, 
  Loader2, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  Pause
} from 'lucide-react'
import type { Campaign } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { CampaignDetailView } from '@/components/campaigns/CampaignDetailView'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCampaigns()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchCampaigns()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchCampaigns = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch('http://localhost:3000/api/campaigns?limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }

      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch (error: any) {
      console.error('Failed to fetch campaigns:', error)
      if (loading) {
        toast.error('Failed to load campaigns')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'creating':
      case 'generating_script':
      case 'generating_videos':
      case 'downloading':
      case 'posting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      case 'pending_review':
        return <Eye className="h-4 w-4 text-yellow-400" />
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], string> = {
      creating: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      generating_script: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      generating_videos: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      downloading: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      pending_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/10 text-green-400 border-green-500/30',
      posting: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      completed: 'bg-green-500/10 text-green-400 border-green-500/30',
      failed: 'bg-red-500/10 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }

    const labels: Record<Campaign['status'], string> = {
      creating: 'Creating',
      generating_script: 'Generating Script',
      generating_videos: 'Generating Videos',
      downloading: 'Downloading',
      pending_review: 'Pending Review',
      approved: 'Approved',
      posting: 'Posting',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    }

    return (
      <Badge className={`${variants[status]} border`}>
        <span className="flex items-center gap-1.5">
          {getStatusIcon(status)}
          {labels[status]}
        </span>
      </Badge>
    )
  }

  if (selectedCampaignId) {
    return (
      <CampaignDetailView
        campaignId={selectedCampaignId}
        onBack={() => setSelectedCampaignId(null)}
        onRefresh={fetchCampaigns}
      />
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Campaigns
          </h1>
          <p className="text-gray-400 mt-1">
            Create and manage automated video campaigns
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-gradient"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Active Campaigns Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">
              {campaigns.filter(c => ['creating', 'generating_script', 'generating_videos', 'downloading', 'posting'].includes(c.status)).length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Active Campaigns</div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-400">
              {campaigns.filter(c => c.status === 'pending_review').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">
              {campaigns.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Completed</div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-400">
              {campaigns.reduce((sum, c) => sum + (c.total_posted || 0), 0)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Total Posts</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="card-glass">
          <CardContent className="py-12 text-center">
            <PlayCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first automated video campaign to get started
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className="card-glass cursor-pointer hover:bg-white/5 transition-all"
              onClick={() => setSelectedCampaignId(campaign.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {campaign.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Topic: {campaign.topic}
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Progress Bar */}
                {['creating', 'generating_script', 'generating_videos', 'downloading', 'posting'].includes(campaign.status) && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {campaign.current_step || 'Processing...'}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {campaign.progress}%
                      </span>
                    </div>
                    <Progress value={campaign.progress} className="h-2" />
                  </div>
                )}

                {/* Campaign Details */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span>
                    {campaign.video_count} video{campaign.video_count !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {campaign.target_accounts.length} account{campaign.target_accounts.length !== 1 ? 's' : ''}
                  </span>
                  {campaign.total_posted > 0 && (
                    <span className="text-green-400">
                      {campaign.total_posted} posted
                    </span>
                  )}
                  {campaign.total_failed > 0 && (
                    <span className="text-red-400">
                      {campaign.total_failed} failed
                    </span>
                  )}
                  <span className="ml-auto">
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Pending Review Notice */}
                {campaign.status === 'pending_review' && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-400">
                      🎬 Videos are ready for review. Click to preview and approve.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchCampaigns()
          toast.success('Campaign created successfully!')
        }}
      />
    </div>
  )
}




