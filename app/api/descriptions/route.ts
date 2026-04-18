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
    
    // Query last 100 invoices to get common descriptions
    const query = "select Line from Invoice orderby MetaData.LastUpdatedTime desc maxresults 100";
    const response = await oauthClient.makeApiCall({
      url: `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = response.json || response.data || response;
    const invoices = data?.QueryResponse?.Invoice || [];
    
    const descriptions = new Set<string>();
    invoices.forEach((inv: any) => {
      inv.Line?.forEach((line: any) => {
        if (line.Description) {
          descriptions.add(line.Description.trim());
        }
      });
    });

    return NextResponse.json(Array.from(descriptions).sort());
  } catch (error: any) {
    console.error('Failed to fetch descriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch descriptions' }, { status: 500 });
  }
}
