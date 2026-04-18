import { NextRequest, NextResponse } from 'next/server';
import { getQboClient } from '@/lib/qbo-auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const realmId = url.searchParams.get('realmId');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, req.url));
  }

  const savedState = req.cookies.get('oauth_state')?.value;
  if (state !== savedState) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  try {
    const oauthClient = getQboClient();
    
    // The intuit library createToken requires the full URL string to parse the code/state/realmId
    const authResponse = await oauthClient.createToken(req.url);
    const fullToken = authResponse.token;
    
    // Trim token to avoid 4KB cookie limit
    const token = {
      access_token: fullToken.access_token,
      refresh_token: fullToken.refresh_token,
      token_type: fullToken.token_type,
      expires_in: fullToken.expires_in,
      x_refresh_token_expires_in: fullToken.x_refresh_token_expires_in,
      createdAt: fullToken.createdAt
    };

    console.log('OAuth successful, saving token for realm:', realmId);

    // Redirect to home page
    const response = NextResponse.redirect(new URL('/', req.url));
    
    // Store token securely in HTTP-only cookie
    const NINETY_DAYS = 60 * 60 * 24 * 90;
    
    response.cookies.set('qbo_token', JSON.stringify(token), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      path: '/', 
      maxAge: NINETY_DAYS 
    });
    
    if (realmId) {
      response.cookies.set('qbo_realm_id', realmId, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/', 
        maxAge: NINETY_DAYS 
      });
    }
    
    response.cookies.delete('oauth_state');
    return response;
  } catch (error: any) {
    console.error('OAuth token exchange failed:', error?.authResponse || error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
