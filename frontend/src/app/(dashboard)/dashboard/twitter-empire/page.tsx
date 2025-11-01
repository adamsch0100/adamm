'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Twitter, ChevronDown, ChevronUp, Loader2, DollarSign, Users, MessageSquare, TrendingUp, FileText, X, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function TwitterEmpirePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [showPlan, setShowPlan] = useState(false)
  
  // Step 2: Content Generation
  const [influencerHandles, setInfluencerHandles] = useState('naval, elonmusk, naval')
  const [scraping, setScraping] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  
  // Step 3: Lead Capture
  const [keyword, setKeyword] = useState('PDF')
  const [dmMessage, setDmMessage] = useState('Thanks for your interest! Here\'s your free guide: [LINK]')
  const [productLink, setProductLink] = useState('')
  
  // Step 4: Posting
  const [postsPerDay, setPostsPerDay] = useState(10)
  const [posting, setPosting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      // Load Twitter accounts
      const { data: accountsData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('platform', 'twitter')

      setAccounts(accountsData || [])

      // Load stats
      const response = await fetch('http://localhost:3000/api/twitter/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }

    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleScrapeTweets = async () => {
    try {
      setScraping(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      const usernames = influencerHandles.split(',').map(h => h.trim().replace('@', ''))

      toast.info(`Scraping tweets from ${usernames.length} influencers...`)

      const response = await fetch('http://localhost:3000/api/twitter/scrape-tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usernames,
          minEngagement: 50000
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Scraped ${data.scraped} viral tweets!`)
        loadData()
      } else {
        throw new Error(data.error)
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to scrape tweets')
    } finally {
      setScraping(false)
    }
  }

  const handleGenerateVariations = async () => {
    try {
      setGenerating(true)
      setGenerationProgress(0)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      toast.info('Generating 500 tweet variations... This may take 2-3 minutes.')

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 1, 95))
      }, 500)

      const response = await fetch('http://localhost:3000/api/twitter/generate-variations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: 500
        })
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const data = await response.json()

      if (response.ok) {
        toast.success(`Generated ${data.generated} tweet variations!`)
        loadData()
      } else {
        throw new Error(data.error)
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to generate variations')
    } finally {
      setGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleStartPosting = async () => {
    try {
      if (accounts.length === 0) {
        toast.error('Please add a Twitter account first')
        return
      }

      setPosting(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in')
        return
      }

      const response = await fetch('http://localhost:3000/api/twitter/start-posting', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: accounts[0].id,
          postsPerDay
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Scheduled ${data.scheduled} posts!`)
        loadData()
      } else {
        throw new Error(data.error)
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to start posting')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Twitter className="h-8 w-8 text-blue-500" />
            Twitter Money Machine
          </h1>
          <p className="text-gray-400">
            Scrape → Generate → Post → Earn
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showPlan} onOpenChange={setShowPlan}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-gray-800 border-blue-600 text-blue-400 hover:bg-gray-700">
                <FileText className="h-4 w-4 mr-2" />
                📋 Execution Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                  Twitter Money Machine - Execution Plan
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Follow these steps to make your first sales within 48 hours
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Current Phase Badge */}
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-600">CURRENT PHASE</Badge>
                    <span className="text-white font-semibold">Phase 2: Twitter Money Machine</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Goal: Scrape viral tweets → Generate 500 variations → Start posting → Make first sales
                  </p>
                </div>

                {/* Step 1: Setup Accounts */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
                      Setup Twitter Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Add 1-3 Twitter accounts</p>
                        <p className="text-xs text-gray-400">Click "Add Twitter Account" in Step 1 section above</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Login to each account</p>
                        <p className="text-xs text-gray-400">MoreLogin browser will open for secure login</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded">
                      <p className="text-xs text-blue-300">
                        💡 Tip: Start with 1 account to test, then scale to 5-10 accounts for $2k-5k/week
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Generate Content */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">2</span>
                      Generate Content (500 Tweets)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Scrape viral tweets from influencers</p>
                        <p className="text-xs text-gray-400">Enter: naval, elonmusk, balajis (or your niche)</p>
                        <p className="text-xs text-gray-400">Click "Scrape Viral Tweets" → takes 2-3 min</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Generate 500 AI variations</p>
                        <p className="text-xs text-gray-400">Click "Generate 500 Variations" → takes 2-3 min</p>
                        <p className="text-xs text-gray-400">AI creates unique hooks, CTAs, writing styles</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700 rounded">
                      <p className="text-xs text-purple-300">
                        ⏱️ Time: 5-10 minutes total | Result: 500 tweets ready to post
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: Create Product (Optional but Recommended) */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-600 text-white text-sm font-bold">3</span>
                      Create Digital Product (Next: Phase 3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <div className="h-4 w-4 border-2 border-gray-600 rounded mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Generate AI ebook (200 pages, 30 min)</p>
                        <p className="text-xs text-gray-400">Topic: "Make Money with AI" or your niche</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-4 w-4 border-2 border-gray-600 rounded mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Create Whop product ($49-99)</p>
                        <p className="text-xs text-gray-400">Get payment link for Twitter bio</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                      <p className="text-xs text-yellow-300">
                        💰 Coming Soon: Phase 3 adds ebook generator + Whop integration
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4: Setup Lead Capture */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold">4</span>
                      Setup Lead Capture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Set trigger keyword: "PDF"</p>
                        <p className="text-xs text-gray-400">When someone comments "PDF", auto-DM them</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Write auto-DM message</p>
                        <p className="text-xs text-gray-400">"Thanks! Here's your guide: [LINK]"</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded">
                      <p className="text-xs text-green-300">
                        🎯 Expected: 100k impressions → 250 clicks → 25 leads → 2-3 sales ($100-300)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 5: Start Posting */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold">5</span>
                      Start Auto-Posting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Choose posting frequency: 10 posts/day</p>
                        <p className="text-xs text-gray-400">Safe rate for Twitter, spreads throughout day</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Click "Start Posting Now"</p>
                        <p className="text-xs text-gray-400">Automated posting begins immediately</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded">
                      <p className="text-xs text-red-300">
                        🚀 Week 1: 10 posts/day × 7 days = 70 posts → $50-500 revenue expected
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Timeline */}
                <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-600 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Expected Revenue Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Week 1 (1-3 accounts):</span>
                      <span className="text-green-400 font-bold">$50-500</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Week 2 (5-10 accounts):</span>
                      <span className="text-green-400 font-bold">$500-2,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Month 1 (scaled + TikTok):</span>
                      <span className="text-green-400 font-bold">$2,000-5,000</span>
                    </div>
                  </div>
                </div>

                {/* Next Phases */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Coming Next: Scale to $10k/Month</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-yellow-600 text-yellow-400">Phase 3</Badge>
                      <span>Whop Integration (ebook generator, payment links)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-600 text-purple-400">Phase 4</Badge>
                      <span>TikTok Empire (warmup automation, mass posting)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-blue-600 text-blue-400">Phase 5</Badge>
                      <span>YouTube Shorts (repurpose long videos)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-600 text-green-400">Phase 6</Badge>
                      <span>Reddit Traffic (comment hijacking)</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowPlan(false)} className="bg-blue-600 hover:bg-blue-700">
                  Got It! Let's Execute 🚀
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-right">
            <div className="text-sm text-gray-400">Revenue This Week</div>
            <div className="text-3xl font-bold text-green-500">
              ${stats?.revenue?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Content Ready</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.unusedVariations || 0}</div>
            <p className="text-xs text-gray-400">Tweets ready to post</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Impressions</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.impressions?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-400">Total views</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Leads</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.leads || 0}</div>
            <p className="text-xs text-gray-400">Captured</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.sales || 0}</div>
            <p className="text-xs text-gray-400">${stats?.revenue?.toFixed(2) || '0.00'} revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Step 1: Accounts */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Step 1: Twitter Accounts</CardTitle>
              <CardDescription>
                {accounts.length > 0 ? `${accounts.length} account(s) connected` : 'Add your Twitter accounts'}
              </CardDescription>
            </div>
            {accounts.length > 0 && (
              <Badge className="bg-green-600">
                ✓ Ready
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length > 0 ? (
            <div className="space-y-2">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-white">@{account.username}</div>
                      <div className="text-sm text-gray-400">{account.followers_count?.toLocaleString() || 0} followers</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No Twitter accounts connected yet</p>
              <Button onClick={() => toast.info('Add account feature coming soon!')}>
                Add Twitter Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Content Generation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Step 2: Generate Content</CardTitle>
              <CardDescription>
                Scraped {stats?.scrapedTweets || 0} tweets | Generated {stats?.generatedVariations || 0} variations
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('content')}
            >
              {expandedSections.content ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Influencer Handles (comma separated)</label>
              <Input
                value={influencerHandles}
                onChange={(e) => setInfluencerHandles(e.target.value)}
                placeholder="naval, elonmusk, balajis"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Button
              onClick={handleScrapeTweets}
              disabled={scraping}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {scraping ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Scraping...</>
              ) : (
                'Scrape Viral Tweets'
              )}
            </Button>

            <div className="border-t border-gray-700 pt-4">
              <Button
                onClick={handleGenerateVariations}
                disabled={generating || (stats?.scrapedTweets || 0) === 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating {generationProgress}%...</>
                ) : (
                  'Generate 500 Variations'
                )}
              </Button>

              {generating && (
                <Progress value={generationProgress} className="mt-2" />
              )}
            </div>
          </div>

          {/* Technical Details - Collapsible */}
          {expandedSections.content && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-2">
              <h4 className="font-semibold text-white text-sm">Technical Details</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>• Scraped Tweets: {stats?.scrapedTweets || 0}</div>
                <div>• Total Variations: {stats?.generatedVariations || 0}</div>
                <div>• Unused: {stats?.unusedVariations || 0}</div>
                <div>• Used: {(stats?.generatedVariations || 0) - (stats?.unusedVariations || 0)}</div>
                <div>• AI Model: GPT-4</div>
                <div>• Min Engagement: 50,000</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Lead Capture */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Step 3: Lead Capture (Optional)</CardTitle>
          <CardDescription>Auto-DM when someone comments with your trigger keyword</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Trigger Keyword</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="PDF"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Auto-DM Message</label>
              <Textarea
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
                placeholder="Thanks! Here's your guide..."
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Product Link (Whop)</label>
              <Input
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="https://whop.com/your-product"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Button className="w-full" variant="outline">
              Save Lead Trigger
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Start Posting */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Step 4: Start Posting</CardTitle>
          <CardDescription>Auto-post tweets throughout the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Posts Per Day</label>
              <select
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(parseInt(e.target.value))}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
              >
                <option value={5}>5 posts/day</option>
                <option value={10}>10 posts/day</option>
                <option value={20}>20 posts/day</option>
              </select>
            </div>

            <Button
              onClick={handleStartPosting}
              disabled={posting || (stats?.unusedVariations || 0) === 0 || accounts.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              {posting ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Scheduling...</>
              ) : (
                'Start Posting Now'
              )}
            </Button>

            {(stats?.unusedVariations || 0) === 0 && (
              <p className="text-sm text-yellow-500 text-center">
                Generate tweet variations first!
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-white">{stats?.posts || 0}</div>
              <div className="text-xs text-gray-400">Posts Today</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-white">{stats?.leads || 0}</div>
              <div className="text-xs text-gray-400">Leads</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-500">${stats?.revenue?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-gray-400">Sales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

