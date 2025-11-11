'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Users, Video, Loader2 } from 'lucide-react'
import { Platform, PLATFORM_CONFIG, Campaign, Analytics } from '@/types'
import { toast } from 'sonner'

// Mock data - replace with real data from Supabase
const viewsData = [
  { date: 'Mon', tiktok: 1200, instagram: 800, youtube: 600, facebook: 400, linkedin: 200, twitter: 300 },
  { date: 'Tue', tiktok: 1900, instagram: 1200, youtube: 800, facebook: 500, linkedin: 250, twitter: 400 },
  { date: 'Wed', tiktok: 2400, instagram: 1500, youtube: 1000, facebook: 600, linkedin: 300, twitter: 500 },
  { date: 'Thu', tiktok: 2800, instagram: 1800, youtube: 1200, facebook: 700, linkedin: 350, twitter: 600 },
  { date: 'Fri', tiktok: 3500, instagram: 2200, youtube: 1500, facebook: 900, linkedin: 450, twitter: 750 },
  { date: 'Sat', tiktok: 4200, instagram: 2800, youtube: 1800, facebook: 1100, linkedin: 500, twitter: 900 },
  { date: 'Sun', tiktok: 5000, instagram: 3200, youtube: 2100, facebook: 1300, linkedin: 600, twitter: 1000 }
]

const engagementData = [
  { date: 'Mon', likes: 450, comments: 120, shares: 80 },
  { date: 'Tue', likes: 680, comments: 180, shares: 120 },
  { date: 'Wed', likes: 920, comments: 240, shares: 160 },
  { date: 'Thu', likes: 1100, comments: 290, shares: 190 },
  { date: 'Fri', likes: 1380, comments: 360, shares: 240 },
  { date: 'Sat', likes: 1650, comments: 430, shares: 290 },
  { date: 'Sun', likes: 1920, comments: 500, shares: 340 }
]

const followerGrowthData = [
  { date: 'Week 1', followers: 1000 },
  { date: 'Week 2', followers: 1250 },
  { date: 'Week 3', followers: 1680 },
  { date: 'Week 4', followers: 2340 }
]

const platformDistributionData = [
  { name: 'TikTok', value: 45, color: '#00f2ea' },
  { name: 'Instagram', value: 25, color: '#e1306c' },
  { name: 'YouTube', value: 15, color: '#ff0000' },
  { name: 'Facebook', value: 8, color: '#1877f2' },
  { name: 'LinkedIn', value: 4, color: '#0077b5' },
  { name: 'Twitter', value: 3, color: '#1da1f2' }
]

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all')
  const [dateRange, setDateRange] = useState<string>('7d')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch campaigns for filter dropdown
      const campaignsResponse = await fetch('/api/campaigns?limit=100')
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        setCampaigns(campaignsData.campaigns || [])
      }

      // Fetch analytics data
      await fetchAnalytics()
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCampaign !== 'all') params.append('campaignId', selectedCampaign)
      if (selectedPlatform !== 'all') params.append('platform', selectedPlatform)
      params.append('dateRange', dateRange)

      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics || [])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchAnalytics()
    }
  }, [selectedCampaign, selectedPlatform, dateRange])

  // Transform analytics data for charts
  const viewsData = analytics.reduce((acc: any[], item) => {
    const date = new Date(item.recorded_at).toLocaleDateString()
    const existing = acc.find(d => d.date === date)
    if (existing) {
      existing[item.platform] = (existing[item.platform] || 0) + item.impressions
    } else {
      acc.push({ date, [item.platform]: item.impressions })
    }
    return acc
  }, [])

  const engagementData = analytics.reduce((acc: any[], item) => {
    const date = new Date(item.recorded_at).toLocaleDateString()
    const existing = acc.find(d => d.date === date)
    if (existing) {
      existing.likes = (existing.likes || 0) + item.clicks
      existing.shares = (existing.shares || 0) + item.conversions
    } else {
      acc.push({ date, likes: item.clicks, shares: item.conversions, comments: 0 })
    }
    return acc
  }, [])

  const platformDistributionData = Object.entries(
    analytics.reduce((acc: Record<string, number>, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + item.impressions
      return acc
    }, {})
  ).map(([platform, value]) => ({
    name: PLATFORM_CONFIG[platform as Platform]?.name || platform,
    value,
    color: PLATFORM_CONFIG[platform as Platform]?.color || '#666'
  }))

  const totalStats = analytics.reduce((acc, item) => ({
    impressions: acc.impressions + item.impressions,
    clicks: acc.clicks + item.clicks,
    conversions: acc.conversions + item.conversions,
    revenue: acc.revenue + item.revenue
  }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0 })

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
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-gray-400 mt-1">
          Track performance across all platforms
        </p>
      </div>

      {/* Filters */}
      <Card className="card-glass">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-white mb-2 block">Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-white mb-2 block">Platform</label>
              <Select value={selectedPlatform} onValueChange={(value: Platform | 'all') => setSelectedPlatform(value)}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-white mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAnalytics}
                className="btn-gradient w-full"
              >
                Refresh
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStats.impressions.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Views across all platforms</p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Clicks</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStats.clicks.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Engagement interactions</p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStats.conversions.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Goal completions</p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Revenue</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalStats.revenue.toFixed(2)}</div>
            <p className="text-xs text-gray-400">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="views" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="views">Views & Impressions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="platforms">Platform Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="space-y-4">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Impressions by platform and date</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(PLATFORM_CONFIG).map((platform) => (
                    <Area
                      key={platform}
                      type="monotone"
                      dataKey={platform}
                      stackId="1"
                      stroke={PLATFORM_CONFIG[platform as Platform].color}
                      fill={PLATFORM_CONFIG[platform as Platform].color}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Clicks and conversions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="shares" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Impressions by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={platformDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Detailed metrics by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformDistributionData.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: platform.color }}
                        />
                        <span className="text-white">{platform.name}</span>
                      </div>
                      <span className="text-white font-semibold">{platform.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
