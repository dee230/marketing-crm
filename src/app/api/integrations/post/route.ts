import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  const body = await request.json();
  const { provider, content, mediaUrl, title } = body;
  
  if (!provider || !content) {
    return NextResponse.json({ error: 'Provider and content required' }, { status: 400 });
  }
  
  // Get integration
  const integrations = await sqlRaw`
    SELECT * FROM integrations WHERE user_id = ${userId} AND provider = ${provider} AND status = 'connected'
  `;
  
  const integration = integrations[0];
  
  if (!integration) {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 });
  }
  
  const accessToken = integration.access_token;
  let result = null;
  
  if (provider === 'linkedin') {
    // Post to LinkedIn
    const postUrl = 'https://api.linkedin.com/v2/ugcPosts';
    
    const postData = {
      author: `urn:li:person:${integration.company_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };
    
    if (mediaUrl) {
      // First upload media then post
      (postData.specificContent as any)['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: mediaUrl,
      }];
    }
    
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });
    
    result = await postRes.json();
  } else if (provider === 'facebook') {
    // Post to Facebook Page
    const pageId = integration.page_id;
    const postUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        message: content,
        access_token: accessToken,
      }),
    });
    
    result = await postRes.json();
  } else if (provider === 'canva') {
    // For Canva, we'll just return success - actual export happens via frontend
    result = { success: true, message: 'Canva integration ready' };
  } else {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  
  if (result?.id || result?.success) {
    return NextResponse.json({ success: true, postId: result.id || result.post_id });
  }
  
  return NextResponse.json({ error: 'Failed to post', details: result }, { status: 400 });
}