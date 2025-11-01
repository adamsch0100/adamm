import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, Users, Video, TrendingUp, Zap, CheckCircle, ArrowUpRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats
  const { data: devices } = await supabase
    .from('cloud_phones')
    .select('*')
    .eq('user_id', user?.id)

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', user?.id)

  const { data: posts } = await supabase
    .from('content_posts')
    .select('*')
    .eq('user_id', user?.id)

  const stats = [
    {
      name: 'Total Devices',
      value: devices?.length || 0,
      icon: Smartphone,
      description: 'Active phone instances',
      gradient: 'from-blue-600 to-blue-500',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      name: 'Social Accounts',
      value: accounts?.length || 0,
      icon: Users,
      description: 'Across all platforms',
      gradient: 'from-emerald-600 to-teal-500',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600'
    },
    {
      name: 'Videos Posted',
      value: posts?.length || 0,
      icon: Video,
      description: 'Total content published',
      gradient: 'from-purple-600 to-pink-500',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600'
    },
    {
      name: 'Total Views',
      value: posts?.reduce((sum, post) => sum + (post.total_views || 0), 0) || 0,
      icon: TrendingUp,
      description: 'Across all posts',
      gradient: 'from-orange-600 to-rose-500',
      iconBg: 'bg-gradient-to-br from-orange-500 to-rose-600'
    }
  ]

  const platformCounts = accounts?.reduce((acc: Record<string, number>, account) => {
    acc[account.platform] = (acc[account.platform] || 0) + 1
    return acc
  }, {}) || {}

  const platformConfig: Record<string, { icon: string; gradient: string }> = {
    tiktok: { icon: '🎵', gradient: 'from-gray-700 to-gray-600' },
    instagram: { icon: '📸', gradient: 'from-pink-600 to-rose-500' },
    youtube: { icon: '▶️', gradient: 'from-red-600 to-orange-500' },
    facebook: { icon: '👥', gradient: 'from-blue-600 to-blue-500' },
    linkedin: { icon: '💼', gradient: 'from-blue-700 to-blue-600' },
    twitter: { icon: '𝕏', gradient: 'from-gray-600 to-slate-500' }
  }

  const actions = [
    { icon: Smartphone, title: 'Launch Cloud Phones', description: 'Start new device instances', color: 'from-blue-500 to-blue-600' },
    { icon: Users, title: 'Connect Accounts', description: 'Add social media profiles', color: 'from-emerald-500 to-teal-600' },
    { icon: Video, title: 'Generate Video', description: 'Create AI-powered content', color: 'from-purple-500 to-pink-600' },
    { icon: Zap, title: 'Run Warmup', description: 'Execute automation workflow', color: 'from-yellow-500 to-orange-600' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-black text-white mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-300 text-xl">
          Welcome back! Here's what's happening with your automation.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="stat-card group">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-gray-400">{stat.name}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.iconBg} text-white shadow-xl group-hover:scale-125 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div>
                <div className="text-5xl font-black text-white mb-2">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-sm text-gray-400">{stat.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Platform Breakdown */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Platform Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['tiktok', 'instagram', 'youtube', 'facebook', 'linkedin', 'twitter'].map((platform) => {
              const config = platformConfig[platform]
              const count = platformCounts[platform] || 0
              return (
                <div 
                  key={platform} 
                  className={`p-5 rounded-2xl bg-gradient-to-br ${config.gradient} transition-all duration-300 hover:shadow-2xl hover:scale-110 cursor-pointer group`}
                >
                  <div className="text-center space-y-3">
                    <span className="text-5xl block group-hover:scale-125 transition-transform">{config.icon}</span>
                    <span className="text-3xl font-black text-white block">{count}</span>
                    <span className="text-sm text-gray-100 capitalize block font-semibold">{platform}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  className={`p-5 rounded-xl bg-gradient-to-br ${action.color} transition-all duration-300 text-white group hover:shadow-2xl hover:-translate-y-2 shadow-lg`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-white/20 text-white group-hover:bg-white/30 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-white text-base mb-1">{action.title}</h3>
                      <p className="text-sm text-white/80">{action.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-blue-500/30">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-200 mb-2 text-lg">Getting Started</h4>
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  Follow the quick actions above to set up your automation. Start by launching cloud phones or connecting your social accounts.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



