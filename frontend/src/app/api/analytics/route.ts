import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const platform = searchParams.get('platform')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('analytics')
      .select(`
        *,
        campaigns(name),
        content_posts(video_url, thumbnail_url, caption)
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (platform) {
      query = query.eq('platform', platform)
    }

    if (startDate) {
      query = query.gte('recorded_at', startDate)
    }

    if (endDate) {
      query = query.lte('recorded_at', endDate)
    }

    const { data: analytics, error } = await query
      .order('recorded_at', { ascending: false })
      .limit(1000)

    if (error) {
      throw error
    }

    // Calculate summary statistics
    const summary = analytics?.reduce((acc, record) => ({
      totalImpressions: acc.totalImpressions + (record.impressions || 0),
      totalClicks: acc.totalClicks + (record.clicks || 0),
      totalConversions: acc.totalConversions + (record.conversions || 0),
      totalRevenue: acc.totalRevenue + (record.revenue || 0),
      recordCount: acc.recordCount + 1
    }), {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      recordCount: 0
    }) || {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      recordCount: 0
    }

    // Calculate CTR if there are impressions
    summary.averageCTR = summary.totalImpressions > 0
      ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2)
      : '0.00'

    return NextResponse.json({
      analytics: analytics || [],
      summary
    })

  } catch (error: any) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      postId,
      campaignId,
      platform,
      impressions,
      clicks,
      conversions,
      revenue
    } = body

    if (!postId || !campaignId || !platform) {
      return NextResponse.json({
        error: 'Post ID, campaign ID, and platform are required'
      }, { status: 400 })
    }

    // Verify ownership
    const { data: post, error: postError } = await supabase
      .from('content_posts')
      .select('id, user_id')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const { data: analytics, error } = await supabase
      .from('analytics')
      .insert({
        post_id: postId,
        campaign_id: campaignId,
        platform,
        impressions: impressions || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ analytics }, { status: 201 })

  } catch (error: any) {
    console.error('Create analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
