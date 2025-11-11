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
    const { envId, serialNumber } = body

    if (!envId || !serialNumber) {
      return NextResponse.json({
        error: 'Environment ID and serial number are required'
      }, { status: 400 })
    }

    // Call MCP server
    const mcpResponse = await fetch('http://localhost:3000/api/morelogin/browser/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        envId,
        serialNumber
      })
    })

    if (!mcpResponse.ok) {
      const error = await mcpResponse.text()
      throw new Error(`MCP server error: ${error}`)
    }

    const result = await mcpResponse.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Start browser error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
