'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Twitter, Download, Sparkles, Send, Image, 
  TrendingUp, Users, DollarSign, Target
} from 'lucide-react'

export default function TwitterPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const supabase = createClient()

  // AI Generation state
  const [niche, setNiche] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [contentStyle, setContentStyle] = useState('educational')
  const [tweetCount, setTweetCount] = useState(50)
  const [generating, setGenerating] = useState(false)

  // Rewriter state
  const [rewrites, setRewrites] = useState<any[]>([])
  const [showRewrites, setShowRewrites] = useState(false)

  // Lead capture state
  const [triggers, setTriggers] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])

  // Multi-account state
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])

  useEffect(() => {
    fetchData()
    fetchRewrites()
    fetchAccounts()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch triggers
      const triggerRes = await fetch('http://localhost:3000/api/lead-triggers', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (triggerRes.ok) {
        const data = await triggerRes.json()
        setTriggers(data.triggers || [])
      }

      // Fetch leads
      const leadsRes = await fetch('http://localhost:3000/api/leads?limit=50', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }

      // Fetch lead stats
      const statsRes = await fetch('http://localhost:3000/api/leads/stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }

    } catch (error) {
      console.error('Fetch data error:', error)
    }
  }

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/accounts', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const activeAccounts = data.accounts.filter((a: any) => 
          a.status === 'active' && a.platform === 'twitter'
        )
        setAccounts(activeAccounts)
        // Auto-select all active accounts
        setSelectedAccounts(activeAccounts.map((a: any) => a.id))
      }
    } catch (error) {
      console.error('Fetch accounts error:', error)
    }
  }

  const handleGenerateViral = async () => {
    if (!niche.trim()) {
      toast.error('Please enter a niche/topic')
      return
    }

    setGenerating(true)
    setShowRewrites(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login first')
        return
      }

      const response = await fetch('http://localhost:3000/api/twitter/generate-viral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          niche: niche.trim(),
          count: tweetCount,
          style: contentStyle,
          targetAudience: targetAudience.trim() || 'General audience'
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Generated ${result.generated} viral tweets!`)
        await fetchRewrites()
        setShowRewrites(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Generation failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate tweets')
    } finally {
      setGenerating(false)
    }
  }


  const handleDeleteRewrite = async (rewriteId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('twitter_rewrites')
        .delete()
        .eq('id', rewriteId)

      if (!error) {
        setRewrites(prev => prev.filter(r => r.id !== rewriteId))
        toast.success('Variation removed')
      }
    } catch (error) {
      toast.error('Failed to delete variation')
    }
  }


  const fetchRewrites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/twitter/rewrites?limit=100', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRewrites(data.rewrites || [])
      }
    } catch (error) {
      console.error('Fetch rewrites error:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Twitter className="h-8 w-8" />
          X/Twitter Automation
        </h1>
        <p className="text-gray-400 mt-2">
          Mass posting, lead capture, and auto-DM system
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.total_leads || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.conversions?.conversion_rate || 0}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Send className="h-4 w-4" />
                DM Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.dm_metrics?.open_rate || 0}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                ${stats.conversions?.total_value?.toFixed(0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="mass-tweet" className="space-y-6">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="mass-tweet">Mass Tweet Generator</TabsTrigger>
          <TabsTrigger value="leads">Lead Capture</TabsTrigger>
          <TabsTrigger value="carousels">Carousels</TabsTrigger>
        </TabsList>

        {/* Mass Tweet Generator */}
        <TabsContent value="mass-tweet" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Step 1: Generate Viral Tweets with AI</CardTitle>
              <CardDescription>
                Enter your niche and let GPT-4 create viral-ready content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Content Niche/Topic
                </label>
                <Input
                  placeholder="e.g., 'AI side hustles', 'weight loss tips', 'productivity hacks'"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Target Audience (Optional)
                </label>
                <Input
                  placeholder="e.g., 'Beginners trying to make first $1K online'"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Content Style
                </label>
                <select 
                  value={contentStyle} 
                  onChange={(e) => setContentStyle(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                >
                  <option value="educational">Educational & Tactical</option>
                  <option value="motivational">Motivational & Inspiring</option>
                  <option value="controversial">Contrarian & Bold</option>
                  <option value="storytelling">Personal Stories</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Number of Tweets
                </label>
                <Input
                  type="number"
                  min="10"
                  max="100"
                  value={tweetCount}
                  onChange={(e) => setTweetCount(parseInt(e.target.value) || 50)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Button 
                onClick={handleGenerateViral} 
                disabled={generating || !niche.trim()} 
                className="w-full" 
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {generating ? 'Generating...' : 'Generate Viral Tweets'}
              </Button>
            </CardContent>
          </Card>


          {/* Show AI Generated Tweets */}
          {rewrites.length > 0 && showRewrites && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Step 2: Review Generated Tweets ({rewrites.length})</CardTitle>
                <CardDescription>
                  Review AI-generated tweets and remove any that don't meet your quality standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {rewrites.map((rewrite: any) => (
                  <div key={rewrite.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-white mb-2">{rewrite.rewritten_text}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {rewrite.variation_style}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-emerald-600/20 text-emerald-400">
                            Quality: {rewrite.quality_score}/10
                          </Badge>
                          {rewrite.used && (
                            <Badge variant="secondary" className="text-xs bg-yellow-600/20 text-yellow-400">
                              Already Used
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteRewrite(rewrite.id)}
                        className="shrink-0"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lead Capture */}
        <TabsContent value="leads" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Active Triggers</CardTitle>
              <CardDescription>
                Keyword triggers that auto-capture leads from comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {triggers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No triggers configured. Create one to start capturing leads.
                </div>
              ) : (
                <div className="space-y-2">
                  {triggers.map((trigger: any) => (
                    <div key={trigger.id} className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            Keyword: "{trigger.trigger_keyword}"
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {trigger.require_follow && '✓ Requires follow'}{' '}
                            {trigger.require_like && '✓ Requires like'}{' '}
                            {trigger.require_repost && '✓ Requires repost'}
                          </div>
                        </div>
                        <Badge variant={trigger.active ? "default" : "secondary"}>
                          {trigger.active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Leads</CardTitle>
              <CardDescription>
                Latest captured leads and their funnel status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No leads captured yet
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.slice(0, 10).map((lead: any) => (
                    <div key={lead.id} className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            @{lead.lead_username}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Keyword: {lead.trigger_keyword} • 
                            Captured: {new Date(lead.captured_at).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2 mt-2 text-xs">
                            {lead.dm_sent && <Badge variant="secondary">DM Sent</Badge>}
                            {lead.dm_opened && <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">DM Opened</Badge>}
                            {lead.link_clicked && <Badge variant="secondary" className="bg-green-500/20 text-green-400">Link Clicked</Badge>}
                            {lead.converted && <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">Converted ${lead.conversion_value}</Badge>}
                          </div>
                        </div>
                        <Badge>{lead.funnel_stage}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carousels */}
        <TabsContent value="carousels" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">X/Twitter Carousels</CardTitle>
              <CardDescription>
                Create viral carousel posts (3-4 image threads)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Image className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <p>Carousel creator coming soon</p>
                <p className="text-sm mt-2">Generate hook → advice → advice → CTA carousels</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


