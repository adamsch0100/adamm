'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Users, Video } from 'lucide-react'
import { Platform, PLATFORM_CONFIG } from '@/types'

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

const topPerformingPosts = [
  { id: 1, platform: 'tiktok', title: 'Bitcoin Hits New High 🚀', views: 45000, likes: 3200, engagement: 7.1 },
  { id: 2, platform: 'instagram', title: 'Ethereum Update', views: 28000, likes: 2100, engagement: 7.5 },
  { id: 3, platform: 'youtube', title: 'Crypto Trends 2024', views: 18000, likes: 1400, engagement: 7.8 },
  { id: 4, platform: 'tiktok', title: 'Trading Tips', views: 15000, likes: 1100, engagement: 7.3 },
  { id: 5, platform: 'instagram', title: 'Market Analysis', views: 12000, likes: 900, engagement: 7.5 }
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all')

  const platforms: (Platform | 'all')[] = ['all', 'tiktok', 'instagram', 'youtube', 'facebook', 'linkedin', 'twitter']

  // Calculate totals
  const totalViews = viewsData[viewsData.length - 1].tiktok + 
                      viewsData[viewsData.length - 1].instagram + 
                      viewsData[viewsData.length - 1].youtube +
                      viewsData[viewsData.length - 1].facebook +
                      viewsData[viewsData.length - 1].linkedin +
                      viewsData[viewsData.length - 1].twitter

  const totalEngagement = engagementData[engagementData.length - 1].likes + 
                          engagementData[engagementData.length - 1].comments + 
                          engagementData[engagementData.length - 1].shares

  const totalFollowers = followerGrowthData[followerGrowthData.length - 1].followers

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">
            Track performance across all your social platforms
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPlatform} onValueChange={(value: Platform | 'all') => setSelectedPlatform(value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platforms.map(p => (
                <SelectItem key={p} value={p}>
                  {p === 'all' ? 'All Platforms' : PLATFORM_CONFIG[p as Platform].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setTimeRange(value)}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +24.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +18.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Followers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalFollowers.toLocaleString()}</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +39.2% this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg Engagement</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">7.4%</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +2.1% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="views" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Views by Platform</CardTitle>
              <CardDescription className="text-gray-400">
                Daily views across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={viewsData}>
                  <defs>
                    <linearGradient id="colorTiktok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00f2ea" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e1306c" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorYoutube" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff0000" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff0000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="tiktok" stroke="#00f2ea" fillOpacity={1} fill="url(#colorTiktok)" />
                  <Area type="monotone" dataKey="instagram" stroke="#e1306c" fillOpacity={1} fill="url(#colorInstagram)" />
                  <Area type="monotone" dataKey="youtube" stroke="#ff0000" fillOpacity={1} fill="url(#colorYoutube)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Engagement Metrics</CardTitle>
              <CardDescription className="text-gray-400">
                Likes, comments, and shares over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="likes" fill="#ef4444" />
                  <Bar dataKey="comments" fill="#3b82f6" />
                  <Bar dataKey="shares" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Follower Growth</CardTitle>
              <CardDescription className="text-gray-400">
                Total followers across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={followerGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="followers" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Platform Distribution</CardTitle>
              <CardDescription className="text-gray-400">
                Views by platform (percentage)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={platformDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Performing Posts */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Posts</CardTitle>
          <CardDescription className="text-gray-400">
            Your best content this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformingPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <Video className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{post.title}</div>
                    <div className="text-sm text-gray-400">
                      {PLATFORM_CONFIG[post.platform as Platform].name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">Views</div>
                    <div className="text-white font-semibold">{post.views.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Likes</div>
                    <div className="text-white font-semibold">{post.likes.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Engagement</div>
                    <div className="text-green-400 font-semibold">{post.engagement}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
