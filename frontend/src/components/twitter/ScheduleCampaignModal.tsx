'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Tweet {
  id: number
  rewritten_text: string
  quality_score?: number
}

interface Campaign {
  id: number
  name: string
  posts_count: number
  status: string
}

interface Props {
  selectedTweets: Tweet[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function ScheduleCampaignModal({ selectedTweets, open, onOpenChange, onComplete }: Props) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [campaignName, setCampaignName] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [interval, setInterval] = useState('30')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      // Set default start time to 30 minutes from now
      const defaultStart = new Date(Date.now() + 30 * 60 * 1000)
      setStartDate(format(defaultStart, 'yyyy-MM-dd'))
      setStartTime(format(defaultStart, 'HH:mm'))
      
      // Generate default campaign name
      const nicheHint = 'Generated Campaign'
      setCampaignName(`${nicheHint} - ${format(new Date(), 'MMM dd, yyyy')}`)
      
      // Fetch existing campaigns
      fetchCampaigns()
    }
  }, [open])

  const fetchCampaigns = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/twitter/campaigns', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns.filter((c: Campaign) => c.status === 'active'))
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const handleSchedule = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login first')
        return
      }

      // Validate inputs
      if (mode === 'new' && !campaignName.trim()) {
        toast.error('Please enter a campaign name')
        setLoading(false)
        return
      }

      if (mode === 'existing' && !selectedCampaign) {
        toast.error('Please select a campaign')
        setLoading(false)
        return
      }

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`)
      
      if (startDateTime < new Date()) {
        toast.error('Start time must be in the future')
        setLoading(false)
        return
      }

      const tweetIds = selectedTweets.map(t => t.id)

      if (mode === 'new') {
        // Create new campaign
        const response = await fetch('http://localhost:3000/api/twitter/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            name: campaignName.trim(),
            tweetIds,
            startTime: startDateTime.toISOString(),
            interval: parseInt(interval)
          })
        })

        if (response.ok) {
          const result = await response.json()
          toast.success(`Campaign "${campaignName}" created with ${result.scheduled} tweets!`)
          onComplete()
          onOpenChange(false)
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to create campaign')
        }
      } else {
        // Add to existing campaign
        toast.info('Adding to existing campaign - feature coming soon!')
        onOpenChange(false)
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule tweets')
    } finally {
      setLoading(false)
    }
  }

  const previewSchedule = () => {
    if (!startDate || !startTime) return null
    
    const start = new Date(`${startDate}T${startTime}`)
    const intervalMin = parseInt(interval)
    const endTime = new Date(start.getTime() + (selectedTweets.length - 1) * intervalMin * 60 * 1000)

    return {
      start: format(start, 'PPp'),
      end: format(endTime, 'PPp'),
      duration: `${Math.ceil((endTime.getTime() - start.getTime()) / (60 * 60 * 1000))} hours`
    }
  }

  const preview = previewSchedule()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Schedule {selectedTweets.length} Tweet{selectedTweets.length > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new campaign or add to an existing one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Selection */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'new' | 'existing')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Campaign</TabsTrigger>
              <TabsTrigger value="existing">Add to Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="campaign-name" className="text-gray-300">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., 'Crypto Tips - Week 1'"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="existing" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="select-campaign" className="text-gray-300">Select Campaign</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-2">
                    <SelectValue placeholder="Choose a campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {campaigns.length === 0 ? (
                      <div className="p-3 text-sm text-gray-400">No active campaigns found</div>
                    ) : (
                      campaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name} ({campaign.posts_count} posts)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* Scheduling Options */}
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h4 className="font-semibold text-white">Scheduling</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-gray-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                />
              </div>

              <div>
                <Label htmlFor="start-time" className="text-gray-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="interval" className="text-gray-300">Time Between Posts</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-white text-sm">Schedule Preview</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>First post:</span>
                  <span className="text-white">{preview.start}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last post:</span>
                  <span className="text-white">{preview.end}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-white">{preview.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total tweets:</span>
                  <span className="text-white">{selectedTweets.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Scheduling...
              </>
            ) : (
              <>Schedule Campaign</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}




