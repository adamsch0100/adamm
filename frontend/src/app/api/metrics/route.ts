import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { performanceMonitor } from '@/lib/performance'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Only allow admin users to access metrics
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '24h'

    // Calculate time range
    const now = new Date()
    const timeRange = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    const startTime = new Date(now.getTime() - (timeRange[timeframe] || timeRange['24h']))

    // Get user registration metrics
    const { data: userMetrics } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startTime.toISOString())

    // Get campaign metrics
    const { data: campaignMetrics } = await supabase
      .from('twitter_campaigns')
      .select('created_at, status')
      .gte('created_at', startTime.toISOString())

    // Get posting metrics
    const { data: postingMetrics } = await supabase
      .from('posting_queue')
      .select('created_at, status, scheduled_for')
      .gte('created_at', startTime.toISOString())

    // Get lead metrics
    const { data: leadMetrics } = await supabase
      .from('leads')
      .select('captured_at, converted')
      .gte('captured_at', startTime.toISOString())

    // Get content metrics
    const { data: contentMetrics } = await supabase
      .from('content_posts')
      .select('created_at, status, total_views, total_likes, total_comments, total_shares')
      .gte('created_at', startTime.toISOString())

    // Calculate metrics
    const metrics = {
      timeframe,
      period: {
        start: startTime.toISOString(),
        end: now.toISOString()
      },
      users: {
        total: userMetrics?.length || 0,
        new: userMetrics?.filter(u => new Date(u.created_at) >= startTime).length || 0
      },
      campaigns: {
        total: campaignMetrics?.length || 0,
        byStatus: campaignMetrics?.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1
          return acc
        }, {}) || {}
      },
      posts: {
        total: postingMetrics?.length || 0,
        byStatus: postingMetrics?.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1
          return acc
        }, {}) || {},
        scheduled: postingMetrics?.filter(p => new Date(p.scheduled_for) > now).length || 0
      },
      leads: {
        total: leadMetrics?.length || 0,
        converted: leadMetrics?.filter(l => l.converted).length || 0,
        conversionRate: leadMetrics?.length ?
          ((leadMetrics.filter(l => l.converted).length / leadMetrics.length) * 100).toFixed(2) : '0'
      },
      content: {
        total: contentMetrics?.length || 0,
        totalViews: contentMetrics?.reduce((sum, c) => sum + (c.total_views || 0), 0) || 0,
        totalLikes: contentMetrics?.reduce((sum, c) => sum + (c.total_likes || 0), 0) || 0,
        totalComments: contentMetrics?.reduce((sum, c) => sum + (c.total_comments || 0), 0) || 0,
        totalShares: contentMetrics?.reduce((sum, c) => sum + (c.total_shares || 0), 0) || 0,
        byStatus: contentMetrics?.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1
          return acc
        }, {}) || {}
      },
      performance: performanceMonitor.getSummary(),
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    }

    return NextResponse.json(metrics)

  } catch (error: any) {
    console.error('Metrics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
