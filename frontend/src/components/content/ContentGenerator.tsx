'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import type { Platform, Campaign } from '@/types'

const PLATFORMS: { id: Platform; name: string; icon: string }[] = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'twitter', name: 'X/Twitter', icon: '𝕏' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
]

interface ContentGeneratorProps {
  campaigns: Campaign[]
  onSuccess?: () => void
}

export function ContentGenerator({ campaigns, onSuccess }: ContentGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)

  // Form state
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok')
  const [contentType, setContentType] = useState('post')
  const [keywords, setKeywords] = useState('')
  const [topics, setTopics] = useState('')
  const [count, setCount] = useState(5)

  const handleGenerate = async () => {
    if (!selectedCampaignId) {
      toast.error('Please select a campaign')
      return
    }

    if (!keywords.trim() && !topics.trim()) {
      toast.error('Please enter keywords or topics')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          contentType,
          platform: selectedPlatform,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          topics: topics.split(',').map(t => t.trim()).filter(t => t),
          count
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      const result = await response.json()
      setGeneratedContent(result.content)

      toast.success(`Generated ${result.content.items.length} content items!`)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Generate content error:', error)
      toast.error(error.message || 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)

  // Pre-fill keywords and topics from selected campaign
  useEffect(() => {
    if (selectedCampaign) {
      if (selectedCampaign.keywords) {
        setKeywords(selectedCampaign.keywords)
      }
      if (selectedCampaign.topics) {
        setTopics(selectedCampaign.topics)
      }
    }
  }, [selectedCampaign])

  return (
    <div className="space-y-6">
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            AI Content Generator
          </CardTitle>
          <CardDescription className="text-gray-400">
            Generate engaging content for any platform using AI
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

          {/* Platform & Content Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Platform *</Label>
              <Select value={selectedPlatform} onValueChange={(value: Platform) => setSelectedPlatform(value)}>
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      <div className="flex items-center gap-2">
                        <span>{platform.icon}</span>
                        <span>{platform.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="thread">Thread</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keywords & Topics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Keywords</Label>
              <Input
                placeholder="bitcoin, crypto, DeFi"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="input-glass"
              />
              <p className="text-xs text-gray-400">Comma-separated keywords</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Topics</Label>
              <Input
                placeholder="Layer 2 solutions, NFT markets"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="input-glass"
              />
              <p className="text-xs text-gray-400">Comma-separated topics</p>
            </div>
          </div>

          {/* Count */}
          <div className="space-y-2">
            <Label className="text-white">Number of Items</Label>
            <Select value={count.toString()} onValueChange={(value) => setCount(parseInt(value))}>
              <SelectTrigger className="input-glass w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 10, 15, 20].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedCampaignId}
            className="btn-gradient w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content Preview */}
      {generatedContent && (
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              Generated Content
            </CardTitle>
            <CardDescription className="text-gray-400">
              {generatedContent.items.length} {generatedContent.contentType} items for {generatedContent.platform}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {generatedContent.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{PLATFORMS.find(p => p.id === generatedContent.platform)?.icon}</span>
                    <div className="flex-1">
                      <p className="text-white whitespace-pre-wrap">{item.text}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400 capitalize">{generatedContent.platform}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
