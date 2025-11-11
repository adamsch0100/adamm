import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/upload-post/profiles - List connected Upload-Post profiles via MCP backend
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const [{ data: { session } }, { data: { user } }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ]);

    if (!user || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const response = await fetch('http://localhost:3000/api/upload-post/connected-accounts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn('Upload-Post list profiles warning:', error);
        return NextResponse.json({ success: false, profiles: [], warning: 'Upload-Post service unavailable' }, { status: 200 });
      }

      const result = await response.json();
      return NextResponse.json({ success: true, profiles: result?.accounts || [] });
    } catch (fetchError: any) {
      console.warn('Upload-Post list profiles fetch error:', fetchError?.message);
      return NextResponse.json({ success: false, profiles: [], warning: 'Unable to reach Upload-Post service' }, { status: 200 });
    }
  } catch (error: any) {
    console.error('List profiles error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/upload-post/profiles - Create a new Upload-Post profile via MCP backend
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const [{ data: { session } }, { data: { user }, error: authError }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ]);

    if (authError || !user || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { username } = body;

    try {
      const mcpResponse = await fetch('http://localhost:3000/api/upload-post/create-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username || undefined })
      });

      if (!mcpResponse.ok) {
        const error = await mcpResponse.text();
        console.error('Upload-Post create profile error:', error);
        return NextResponse.json({ error: 'Failed to create Upload-Post profile', details: error }, { status: 502 });
      }

      const result = await mcpResponse.json();
      return NextResponse.json(result);
    } catch (requestError: any) {
      console.error('Upload-Post create profile request error:', requestError?.message);
      return NextResponse.json({ error: 'Unable to reach Upload-Post service' }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload-post/profiles - Not yet implemented
 */
export async function DELETE() {
  return NextResponse.json({ error: 'Profile deletion not yet implemented' }, { status: 501 });
}

