import { NextResponse } from 'next/server';
import { getQboClient } from '@/lib/qbo-auth';
import OAuthClient from 'intuit-oauth';
import crypto from 'crypto';

export async function GET() {
  const oauthClient = getQboClient();
  const state = crypto.randomBytes(16).toString('hex');
  
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: state,
  });

  const response = NextResponse.redirect(authUri);
  response.cookies.set('oauth_state', state, { httpOnly: true, path: '/', maxAge: 600 });
  
  return response;
}
