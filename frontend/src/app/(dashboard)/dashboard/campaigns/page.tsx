'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Pause,
  Sparkles,
  BarChart3
} from 'lucide-react'
import type { Campaign } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { CampaignQueueView } from '@/components/campaigns/CampaignQueueView'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
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

      const response = await fetch('/api/campaigns?limit=50')

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
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'active':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-400" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], string> = {
      draft: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      active: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      completed: 'bg-green-500/10 text-green-400 border-green-500/30',
      failed: 'bg-red-500/10 text-red-400 border-red-500/30'
    }

    const labels: Record<Campaign['status'], string> = {
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      failed: 'Failed'
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
    const campaign = campaigns.find(c => c.id === selectedCampaignId)
    if (!campaign) {
      return (
        <div className="space-y-6 p-6">
          <Button variant="outline" onClick={() => setSelectedCampaignId(null)}>
            ← Back to Campaigns
          </Button>
          <div className="text-center text-gray-400">Campaign not found</div>
        </div>
      )
    }

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedCampaignId(null)}>
            ← Back to Campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {campaign.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(campaign.status)}
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="queue">Posting Queue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Keywords</label>
                    <p className="text-white mt-1">{campaign.keywords || 'No keywords set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Topics</label>
                    <p className="text-white mt-1">{campaign.topics || 'No topics set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Target Platforms</label>
                    <div className="flex gap-2 mt-1">
                      {campaign.platforms?.map((platform) => (
                        <Badge key={platform} variant="outline">
                          {platform}
                        </Badge>
                      )) || 'No platforms selected'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <div className="mt-1">{getStatusBadge(campaign.status)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-white">Generated Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaign.content_json ? (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800 p-3 rounded max-h-64 overflow-y-auto">
                      {JSON.stringify(campaign.content_json, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No content generated yet</p>
                      <p className="text-sm mt-1">Use the Content page to generate content for this campaign</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <CampaignQueueView campaignId={selectedCampaignId!} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-white">Campaign Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Performance metrics for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Analytics coming soon</p>
                  <p className="text-sm mt-1">Track impressions, clicks, and conversions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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

      {/* Campaign Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">
              {campaigns.length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Total Campaigns</div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Active</div>
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
              {campaigns.filter(c => c.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Drafts</div>
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
                      Topics: {campaign.topics || 'No topics set'}
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Campaign Details */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span>
                    Platforms: {campaign.platforms?.length || 0}
                  </span>
                  <span>
                    Keywords: {campaign.keywords || 'None'}
                  </span>
                  <span className="ml-auto">
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                  </span>
                </div>
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




