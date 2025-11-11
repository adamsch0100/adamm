import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import UploadPostService from '../../../../../../services/upload-post.js';

/**
 * GET /api/upload-post/pages/linkedin - Get LinkedIn pages for a profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profile = searchParams.get('profile');

    // Get Upload-Post API key from operator settings
    const { data: settings } = await supabase
      .from('operator_settings')
      .select('upload_post_api_key')
      .eq('user_id', user.id)
      .single();

    const apiKey = settings?.upload_post_api_key || process.env.UPLOAD_POST_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Upload-Post API key not configured' },
        { status: 500 }
      );
    }

    const uploadPostService = new UploadPostService(apiKey);
    const pages = await uploadPostService.getLinkedInPages(profile || undefined);

    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    console.error('Get LinkedIn pages error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get LinkedIn pages' },
      { status: 500 }
    );
  }
}

