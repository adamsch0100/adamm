'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Upload, Calendar, CheckCircle2 } from 'lucide-react'
import type { Campaign, SocialAccount } from '@/types'

interface ContentUploaderProps {
  onSuccess?: () => void
}

export function ContentUploader({ onSuccess }: ContentUploaderProps) {
  const [posting, setPosting] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const supabase = createClient()

  // Form state
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([])
  const [scheduleTime, setScheduleTime] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('status', 'active')
        .order('platform')

      setCampaigns(campaignsData || [])
      setAccounts(accountsData || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const toggleAccount = (accountId: number) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handlePost = async () => {
    if (!selectedCampaignId || !content.trim() || selectedPlatforms.length === 0 || selectedAccountIds.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setPosting(true)
    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          content: content.trim(),
          platforms: selectedPlatforms,
          accountIds: selectedAccountIds,
          scheduleTime: scheduleTime || undefined,
          mediaUrls
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to schedule post')
      }

      const result = await response.json()

      toast.success(`Post scheduled successfully! ${result.queueItems} items queued.`)

      // Reset form
      setContent('')
      setSelectedPlatforms([])
      setSelectedAccountIds([])
      setScheduleTime('')
      setMediaUrls([])

      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error('Post error:', error)
      toast.error(error.message || 'Failed to schedule post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
          <Upload className="h-6 w-6" />
          Post Content
        </CardTitle>
        <CardDescription className="text-gray-400">
          Schedule posts across multiple platforms and accounts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Campaign Selection */}
        <div className="space-y-2">
          <Label className="text-white">Campaign *</Label>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="input-glass">
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label className="text-white">Content *</Label>
          <Textarea
            placeholder="Enter your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-glass min-h-24"
          />
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <Label className="text-white text-base">Platforms *</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'tiktok', name: 'TikTok', icon: '🎵' },
              { id: 'instagram', name: 'Instagram', icon: '📸' },
              { id: 'youtube', name: 'YouTube', icon: '▶️' },
              { id: 'twitter', name: 'X/Twitter', icon: '𝕏' },
              { id: 'facebook', name: 'Facebook', icon: '👥' },
              { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
            ].map((platform) => (
              <div
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm font-medium text-white">{platform.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Selection */}
        <div className="space-y-3">
          <Label className="text-white text-base">Accounts *</Label>
          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
            {accounts
              .filter(account => selectedPlatforms.includes(account.platform))
              .map((account) => (
                <div
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAccountIds.includes(account.id)
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {account.platform === 'tiktok' ? '🎵' :
                         account.platform === 'instagram' ? '📸' :
                         account.platform === 'twitter' ? '𝕏' :
                         account.platform === 'youtube' ? '▶️' :
                         account.platform === 'facebook' ? '👥' :
                         account.platform === 'linkedin' ? '💼' : '📱'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        @{account.username}
                      </p>
                      <p className="text-sm text-gray-400 capitalize">
                        {account.platform}
                      </p>
                    </div>
                    {selectedAccountIds.includes(account.id) && (
                      <CheckCircle2 className="h-5 w-5 text-blue-400 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
          </div>
          {accounts.filter(account => selectedPlatforms.includes(account.platform)).length === 0 && selectedPlatforms.length > 0 && (
            <p className="text-sm text-yellow-400">
              No active accounts found for selected platforms. Add accounts first.
            </p>
          )}
        </div>

        {/* Schedule Time */}
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Time (Optional)
          </Label>
          <Input
            type="datetime-local"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="input-glass"
          />
          <p className="text-xs text-gray-400">
            Leave empty to post immediately
          </p>
        </div>

        {/* Media URLs */}
        <div className="space-y-2">
          <Label className="text-white">Media URLs (Optional)</Label>
          <Textarea
            placeholder="Enter media URLs, one per line..."
            value={mediaUrls.join('\n')}
            onChange={(e) => setMediaUrls(e.target.value.split('\n').filter(url => url.trim()))}
            className="input-glass min-h-20"
          />
          <p className="text-xs text-gray-400">
            One URL per line for videos/images to attach
          </p>
        </div>

        {/* Post Button */}
        <Button
          onClick={handlePost}
          disabled={posting || !selectedCampaignId || !content.trim() || selectedPlatforms.length === 0 || selectedAccountIds.length === 0}
          className="btn-gradient w-full"
          size="lg"
        >
          {posting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Scheduling Post...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Schedule Post
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}