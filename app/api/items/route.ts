import { NextRequest, NextResponse } from 'next/server';
import { getQboClient } from '@/lib/qbo-auth';

export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('qbo_token')?.value;
    const realmId = req.cookies.get('qbo_realm_id')?.value;
    if (!tokenCookie || !realmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = JSON.parse(tokenCookie);
    const oauthClient = getQboClient(token);
    const baseUrl = process.env.QBO_ENVIRONMENT === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';
    
    const query = "select * from Item where Active = true maxresults 1000";
    const response = await oauthClient.makeApiCall({
      url: `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = response.json || response.data || response;
    let items = data?.QueryResponse?.Item || [];
    
    // Filter out categories since they cannot be used directly as line items on an invoice
    items = items.filter((item: any) => item.Type !== 'Category');
    
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
