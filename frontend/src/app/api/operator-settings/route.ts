import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Call MCP server
    const mcpResponse = await fetch('http://localhost:3000/api/operator-settings')

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Get operator settings error:', error)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { service, apiKey, apiSecret } = body

    if (!service || !apiKey) {
      return NextResponse.json({
        error: 'Service and API key are required'
      }, { status: 400 })
    }

    // Call MCP server
    const mcpResponse = await fetch('http://localhost:3000/api/operator-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        service,
        apiKey,
        apiSecret
      })
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Create operator setting error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
