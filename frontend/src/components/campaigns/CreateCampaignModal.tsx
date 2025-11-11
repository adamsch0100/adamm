'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'
import type { Platform } from '@/types'

interface CreateCampaignModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateCampaignModal({ open, onClose, onSuccess }: CreateCampaignModalProps) {
  const [loading, setLoading] = useState(false)

  // Form state - Updated to match new Campaign schema
  const [name, setName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [topics, setTopics] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  useEffect(() => {
    if (open) {
      // Reset form
      setName('')
      setKeywords('')
      setTopics('')
      setSelectedPlatforms([])
    }
  }, [open])

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleCreateCampaign = async () => {
    if (!name.trim()) {
      toast.error('Campaign name is required')
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          keywords: keywords.trim(),
          topics: topics.trim(),
          platforms: selectedPlatforms
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      toast.success('Campaign created successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to create campaign:', error)
      toast.error(error.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create New Campaign
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Set up a new content campaign across multiple platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-200">Campaign Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Crypto Education Series"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-800 border-2 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-sm font-semibold text-gray-200">Keywords</Label>
            <Input
              id="keywords"
              placeholder="bitcoin, ethereum, crypto"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-gray-800 border-2 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
            <p className="text-xs text-gray-400">Comma-separated keywords for content generation</p>
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <Label htmlFor="topics" className="text-sm font-semibold text-gray-200">Topics</Label>
            <Input
              id="topics"
              placeholder="DeFi, NFTs, Web3"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="bg-gray-800 border-2 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
            <p className="text-xs text-gray-400">Comma-separated topics to cover</p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label className="text-white text-base">Target Platforms *</Label>
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
                  onClick={() => togglePlatform(platform.id as Platform)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id as Platform)
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={loading || !name.trim() || selectedPlatforms.length === 0}
              className="btn-gradient"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}