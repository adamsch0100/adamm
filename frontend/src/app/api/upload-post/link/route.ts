import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import UploadPostService from '../../../../../services/upload-post.js';

/**
 * POST /api/upload-post/link - Generate JWT URL for connecting social accounts
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, platforms, redirect_url, logo_image, redirect_button_text } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

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
    
    const options: any = {};
    if (platforms) options.platforms = platforms;
    if (redirect_url) options.redirect_url = redirect_url;
    if (logo_image) options.logo_image = logo_image;
    if (redirect_button_text) options.redirect_button_text = redirect_button_text;

    const result = await uploadPostService.generateJwtUrl(username, options);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Generate link JWT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate link URL' },
      { status: 500 }
    );
  }
}

