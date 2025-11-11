import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = parseInt(params.accountId)
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    // Verify account ownership
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Call MCP server
    const mcpResponse = await fetch(`http://localhost:3000/api/warmup/status/${accountId}`)

    if (!mcpResponse.ok) {
      // If warmup not found, return default status
      if (mcpResponse.status === 404) {
        return NextResponse.json({
          accountId,
          status: 'not_started',
          dayNumber: 0,
          totalDays: 0,
          actionsCompleted: 0
        })
      }
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Get warmup status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
