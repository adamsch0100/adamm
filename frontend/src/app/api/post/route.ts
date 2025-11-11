import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      campaignId,
      content,
      platforms,
      accountIds,
      scheduleTime,
      mediaUrls = []
    } = body

    if (!campaignId || !content || !platforms || !accountIds) {
      return NextResponse.json({
        error: 'Campaign ID, content, platforms, and account IDs are required'
      }, { status: 400 })
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify account ownership
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('id, platform, username')
      .eq('user_id', user.id)
      .in('id', accountIds)

    if (accountsError || !accounts || accounts.length !== accountIds.length) {
      return NextResponse.json({
        error: 'Some accounts not found or not owned by user'
      }, { status: 404 })
    }

    // Call MCP server for posting
    const mcpResponse = await fetch('http://localhost:3000/api/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        campaignId,
        content,
        platforms,
        accountIds,
        scheduleTime,
        mediaUrls
      })
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()

    // Create posting queue entries for tracking
    const queueEntries = platforms.flatMap(platform =>
      accountIds.map(accountId => ({
        user_id: user.id,
        platform,
        content,
        scheduled_for: scheduleTime || new Date().toISOString(),
        status: 'pending',
        campaign_id: campaignId,
        social_account_id: accountId,
        content_data: {
          media_urls: mediaUrls,
          platform_specific: result.platformData?.[platform]
        }
      }))
    )

    const { data: queueItems, error: queueError } = await supabase
      .from('posting_queue')
      .insert(queueEntries)
      .select()

    if (queueError) {
      console.warn('Failed to create posting queue entries:', queueError)
    }

    return NextResponse.json({
      success: true,
      postIds: result.postIds,
      queueItems: queueItems?.length || 0,
      campaignId
    })

  } catch (error: any) {
    console.error('Post content error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
