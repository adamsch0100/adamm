'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Wand2, Check } from 'lucide-react'
import type { SocialAccount, Platform } from '@/types'

interface CreateCampaignModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateCampaignModal({ open, onClose, onSuccess }: CreateCampaignModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const supabase = createClient()

  // Form state
  const [topicSource, setTopicSource] = useState<'auto' | 'manual'>('manual')
  const [topic, setTopic] = useState('')
  const [videoCount, setVideoCount] = useState(2)
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])
  const [requireApproval, setRequireApproval] = useState(true)

  useEffect(() => {
    if (open) {
      fetchAccounts()
      // Reset form
      setStep(1)
      setTopicSource('manual')
      setTopic('')
      setVideoCount(2)
      setSelectedAccounts([])
      setRequireApproval(true)
    }
  }, [open])

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      toast.error('Failed to load accounts')
    }
  }

  const handleCreateCampaign = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch('http://localhost:3000/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicSource,
          topic: topicSource === 'manual' ? topic : undefined,
          videoCount,
          targetAccounts: selectedAccounts,
          requireApproval,
          autoPostOnApproval: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to create campaign:', error)
      toast.error(error.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = topicSource === 'auto' || (topicSource === 'manual' && topic.trim().length > 0)
  const canProceedStep2 = videoCount >= 1 && videoCount <= 10
  const canProceedStep3 = selectedAccounts.length > 0
  const canCreate = canProceedStep1 && canProceedStep2 && canProceedStep3

  const platformGroups = accounts.reduce((groups, account) => {
    if (!groups[account.platform]) {
      groups[account.platform] = []
    }
    groups[account.platform].push(account)
    return groups
  }, {} as Record<Platform, SocialAccount[]>)

  const toggleAccount = (accountId: number) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const platformIcons: Record<Platform, string> = {
    tiktok: '🎵',
    instagram: '📸',
    youtube: '▶️',
    facebook: '👥',
    linkedin: '💼',
    twitter: '𝕏'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create New Campaign
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Step {step} of 4: {
              step === 1 ? 'Topic Selection' :
              step === 2 ? 'Video Configuration' :
              step === 3 ? 'Account Selection' :
              'Review & Launch'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step 
                    ? 'w-8 bg-gradient-to-r from-blue-400 to-purple-400' 
                    : s < step 
                    ? 'w-2 bg-green-400' 
                    : 'w-2 bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Topic Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-white text-base">How should we choose the topic?</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Auto Option */}
                  <div
                    onClick={() => setTopicSource('auto')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      topicSource === 'auto'
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="h-5 w-5 text-blue-400" />
                      <span className="font-semibold text-white">Auto</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Fetch trending crypto topic automatically
                    </p>
                  </div>

                  {/* Manual Option */}
                  <div
                    onClick={() => setTopicSource('manual')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      topicSource === 'manual'
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Wand2 className="h-5 w-5 text-purple-400" />
                      <span className="font-semibold text-white">Custom</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Enter your own topic
                    </p>
                  </div>
                </div>
              </div>

              {topicSource === 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-white">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Ethereum Layer 2 Solutions, Bitcoin ETF, Solana NFTs..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="input-glass"
                  />
                  <p className="text-sm text-gray-400">
                    We'll create videos about: <span className="text-blue-400 font-medium">{topic || '(enter topic)'}</span>
                  </p>
                </div>
              )}

              {topicSource === 'auto' && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-200">
                    ✨ We'll automatically fetch the most trending cryptocurrency and create videos about it.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Video Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white text-base">How many videos to generate?</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={videoCount}
                    onChange={(e) => setVideoCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="input-glass w-24"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={videoCount}
                      onChange={(e) => setVideoCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Each video will have unique visuals and variations
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                <h4 className="font-semibold text-white mb-2">Estimated Time</h4>
                <p className="text-sm text-gray-300">
                  ⏱️ Generation: ~{Math.round(videoCount * 3.5)} minutes <span className="text-gray-500">(~3-5 min per video)</span>
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  📱 Posting: ~{Math.round(selectedAccounts.length * 2)} minutes <span className="text-gray-500">({selectedAccounts.length || 0} accounts selected)</span>
                </p>
              </div>

              {/* Video Approval Option */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <Checkbox
                  id="requireApproval"
                  checked={requireApproval}
                  onCheckedChange={(checked) => setRequireApproval(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="requireApproval" className="text-white font-medium cursor-pointer">
                    Require video approval before posting
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Preview and approve each video before it's posted to your accounts
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Account Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-white text-base">Select accounts to post to *</Label>

              {accounts.length === 0 ? (
                <div className="p-6 text-center rounded-lg bg-gray-800/50 border border-gray-700">
                  <p className="text-gray-400">
                    No active accounts found. Please add accounts first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(platformGroups).map(([platform, platformAccounts]) => (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <span className="text-xl">{platformIcons[platform as Platform]}</span>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {platformAccounts.map((account) => (
                          <div
                            key={account.id}
                            onClick={() => toggleAccount(account.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedAccounts.includes(account.id)
                                ? 'border-green-400 bg-green-500/10'
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">
                                @{account.username || 'Unnamed'}
                              </span>
                              {selectedAccounts.includes(account.id) && (
                                <Check className="h-4 w-4 text-green-400" />
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {account.followers_count} followers
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-400">
                {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Step 4: Review & Launch */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 space-y-3">
                <h4 className="font-semibold text-white">Campaign Summary</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Topic:</span>
                    <span className="text-white font-medium">
                      {topicSource === 'auto' ? '🎲 Auto (Trending Crypto)' : topic}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Videos:</span>
                    <span className="text-white font-medium">{videoCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accounts:</span>
                    <span className="text-white font-medium">{selectedAccounts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Approval:</span>
                    <span className="text-white font-medium">
                      {requireApproval ? '✓ Required' : '✗ Auto-post'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                    <span className="text-gray-400">Est. Time:</span>
                    <span className="text-white font-medium">
                      ~{Math.round(videoCount * 3.5 + selectedAccounts.length * 2)} minutes
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-200">
                  ⚠️ Campaign will start immediately. You'll be able to monitor progress in real-time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className="btn-gradient"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateCampaign}
              disabled={!canCreate || loading}
              className="btn-gradient"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Launch Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}




