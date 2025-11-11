import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const mcpResponse = await fetch('http://localhost:3000/api/morelogin/instances', {
        cache: 'no-store'
      })

      if (!mcpResponse.ok) {
        const errorText = await mcpResponse.text()
        console.warn('MoreLogin instances fetch failed:', errorText)
        return NextResponse.json({ devices: [], warning: 'MoreLogin not configured' })
      }

      const result = await mcpResponse.json()

      const transformedDevices = result.instances?.map((instance: any) => ({
        id: instance.id,
        name: instance.envRemark || instance.envName || 'Unnamed Device',
        morelogin_env_name: instance.envName ?? null,
        country: instance.proxy?.countryCode || 'Unknown',
        status: instance.envStatus === 1 ? 'running' : 'stopped',
        adb_enabled: Boolean(instance.enableAdb),
        adb_ip: instance.adbInfo?.host || null,
        adb_port: instance.adbInfo?.port || null,
        proxy_id: instance.proxyId && instance.proxyId !== '0' ? instance.proxyId : null,
        proxy_status: instance.proxy ? 'connected' : 'disconnected',
        proxy_country: instance.proxy?.countryCode || null,
        proxy_city: instance.proxy?.city || null,
        created_at: instance.createDate
      })) ?? []

      return NextResponse.json({ devices: transformedDevices })
    } catch (fetchError: any) {
      console.warn('MoreLogin instances fetch error:', fetchError?.message)
      return NextResponse.json({ devices: [], warning: 'Unable to reach MoreLogin service' })
    }
  } catch (error: any) {
    console.error('Devices route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
