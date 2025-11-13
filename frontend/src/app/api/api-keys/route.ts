import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('id, service, status, created_at, last_verified')
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ apiKeys })
  } catch (error: any) {
    console.error('Get API keys error:', error)
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
    const { service, apiKey, apiSecret } = body

    if (!service || !apiKey) {
      return NextResponse.json({ error: 'Service and API key are required' }, { status: 400 })
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey)
    const encryptedSecret = apiSecret ? encrypt(apiSecret) : null

    // Check if key already exists for this service
    const { data: existing } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('service', service)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_api_keys')
        .update({
          api_key_encrypted: encryptedKey,
          api_secret_encrypted: encryptedSecret,
          status: 'active',
          last_verified: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error

      return NextResponse.json({ message: 'API key updated successfully' })
    } else {
      // Insert new
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          service,
          api_key_encrypted: encryptedKey,
          api_secret_encrypted: encryptedSecret,
          status: 'active',
          last_verified: new Date().toISOString()
        })

      if (error) throw error

      return NextResponse.json({ message: 'API key added successfully' })
    }
  } catch (error: any) {
    console.error('Add API key error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ message: 'API key deleted successfully' })
  } catch (error: any) {
    console.error('Delete API key error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


















