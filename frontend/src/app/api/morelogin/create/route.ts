import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      name,
      country = 'US',
      skuId = 'android_1',
      autoProxy = true
    } = body

    const payload = {
      userId: user.id,
      name: name || `auto_device_${Date.now()}`,
      country,
      skuId,
      autoProxy
    }

    try {
      const mcpResponse = await fetch('http://localhost:3000/api/morelogin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!mcpResponse.ok) {
        const error = await mcpResponse.text()
        console.error('MoreLogin create device error:', error)
        return NextResponse.json({ error: 'Failed to create MoreLogin device', details: error }, { status: 502 })
      }

      const result = await mcpResponse.json()
      return NextResponse.json(result)
    } catch (requestError: any) {
      console.error('MoreLogin create device request error:', requestError?.message)
      return NextResponse.json({ error: 'Unable to reach MoreLogin service' }, { status: 502 })
    }
  } catch (error: any) {
    console.error('Create MoreLogin instance error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
