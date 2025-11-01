import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/types'

export function useCampaignProgress(campaignId: number | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCampaignStatus = useCallback(async () => {
    if (!campaignId) {
      setLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch campaign status')
      }

      const data = await response.json()
      setCampaign(data as Campaign)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch campaign status:', err)
      setError(err.message || 'Failed to fetch campaign status')
    } finally {
      setLoading(false)
    }
  }, [campaignId, supabase])

  useEffect(() => {
    if (!campaignId) return

    // Initial fetch
    fetchCampaignStatus()

    // Set up polling interval
    // Poll every 3 seconds if campaign is active
    const pollInterval = setInterval(() => {
      // Only poll if campaign is in an active state
      if (campaign?.status && [
        'creating',
        'generating_script',
        'generating_videos',
        'downloading',
        'posting'
      ].includes(campaign.status)) {
        fetchCampaignStatus()
      } else if (campaign?.status && [
        'completed',
        'failed',
        'cancelled'
      ].includes(campaign.status)) {
        // Stop polling for finished campaigns
        clearInterval(pollInterval)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [campaignId, campaign?.status, fetchCampaignStatus])

  const refresh = useCallback(() => {
    fetchCampaignStatus()
  }, [fetchCampaignStatus])

  return {
    campaign,
    loading,
    error,
    refresh,
    isActive: campaign?.status && [
      'creating',
      'generating_script',
      'generating_videos',
      'downloading',
      'posting'
    ].includes(campaign.status),
    isPendingReview: campaign?.status === 'pending_review',
    isCompleted: campaign?.status === 'completed',
    isFailed: campaign?.status === 'failed'
  }
}




