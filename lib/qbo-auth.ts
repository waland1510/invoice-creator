import OAuthClient from 'intuit-oauth';

export function getQboClient(token?: any) {
  return new OAuthClient({
    clientId: process.env.QBO_CLIENT_ID || '',
    clientSecret: process.env.QBO_CLIENT_SECRET || '',
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QBO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    token: token,
  });
}
