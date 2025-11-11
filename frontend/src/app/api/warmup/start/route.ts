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
    const { accountId, platform, daysTotal } = body

    if (!accountId || !platform || !daysTotal) {
      return NextResponse.json({
        error: 'Account ID, platform, and days total are required'
      }, { status: 400 })
    }

    // Verify account ownership
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, platform, username')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Call MCP server
    const mcpResponse = await fetch('http://localhost:3000/api/warmup/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        accountId,
        platform,
        daysTotal
      })
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Start warmup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
