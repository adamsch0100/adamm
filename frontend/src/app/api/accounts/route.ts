import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select(`
        id,
        platform,
        username,
        display_name,
        status,
        verification_status,
        warmup_days,
        warmup_completed,
        followers_count,
        following_count,
        posts_count,
        engagement_rate,
        last_activity,
        last_warmup,
        bio_link,
        notes,
        daily_post_limit,
        posts_today,
        last_post_at,
        created_at
      `)
      .eq('user_id', user.id)
      .order('platform', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error('Get accounts error:', error)
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
    const {
      platform,
      username,
      email,
      phoneNumber,
      password,
      uploadPostProfileKey,
      cloudPhoneId,
      notes
    } = body

    if (!platform || !username) {
      return NextResponse.json({
        error: 'Platform and username are required'
      }, { status: 400 })
    }

    // Validate platform
    const validPlatforms = ['tiktok', 'instagram', 'youtube', 'facebook', 'linkedin', 'twitter']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({
        error: 'Invalid platform'
      }, { status: 400 })
    }

    const { data: account, error } = await supabase
      .from('social_accounts')
      .insert({
        user_id: user.id,
        platform,
        username,
        email,
        phone_number: phoneNumber,
        password_encrypted: password, // Note: This should be encrypted in production
        upload_post_profile_key: uploadPostProfileKey,
        cloud_phone_id: cloudPhoneId,
        notes,
        status: 'creating'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // TODO: Trigger account creation workflow in MCP server
    // This would call the MCP server to set up the account with MoreLogin

    return NextResponse.json({ account }, { status: 201 })
  } catch (error: any) {
    console.error('Create account error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
