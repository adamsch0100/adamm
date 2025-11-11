import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = parseInt(params.id)
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    const body = await req.json()
    const { topics, daysTotal = 14 } = body

    // Forward to warmup API
    const mcpResponse = await fetch('http://localhost:3000/api/warmup/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId,
        platform: body.platform || 'tiktok',
        daysTotal,
        topics
      })
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP warmup error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Warmup start error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = parseInt(params.id)
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    // Forward to warmup status API
    const mcpResponse = await fetch(`http://localhost:3000/api/warmup/status/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${user.id}`
      }
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP warmup status error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Warmup status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
