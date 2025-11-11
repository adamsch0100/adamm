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
    const { campaignId, contentType, platform, keywords, topics, count = 10 } = body

    if (!campaignId || !contentType || !platform) {
      return NextResponse.json({
        error: 'Campaign ID, content type, and platform are required'
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

    // Call MCP server for content generation
    const mcpResponse = await fetch('http://localhost:3000/api/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        campaignId,
        contentType,
        platform,
        keywords,
        topics,
        count
      })
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()

    // Store generated content in campaign
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        content_json: result.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (updateError) {
      console.warn('Failed to update campaign content_json:', updateError)
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      campaignId
    })

  } catch (error: any) {
    console.error('Generate content error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
