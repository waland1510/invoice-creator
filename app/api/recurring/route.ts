import { NextRequest, NextResponse } from 'next/server';
import { getQboClient } from '@/lib/qbo-auth';

export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('qbo_token')?.value;
    const realmId = req.cookies.get('qbo_realm_id')?.value;

    if (!tokenCookie || !realmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = JSON.parse(tokenCookie);
    const oauthClient = getQboClient(token);

    const baseUrl = process.env.QBO_ENVIRONMENT === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com' 
      : 'https://quickbooks.api.intuit.com';

    const query = 'SELECT * FROM RecurringTransaction';
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const response = await oauthClient.makeApiCall({
      url: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = response.getJson?.() || response.json || response.data || response;
    
    // Normalize response
    const transactions = data.QueryResponse?.RecurringTransaction || [];
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Failed to fetch recurring transactions:', error?.authResponse?.getJson?.() || error.message);
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}
