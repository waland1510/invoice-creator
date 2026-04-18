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

    // Fetch a larger set of recent invoices to ensure we find the highest number
    // ORDERBY MetaData.CreateTime DESC is most reliable for "recent"
    const query = 'SELECT DocNumber FROM Invoice ORDERBY MetaData.CreateTime DESC MAXRESULTS 20';
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const response = await oauthClient.makeApiCall({
      url: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = response.getJson?.() || response.json || response.data || response;
    const invoices = data.QueryResponse?.Invoice || [];
    
    let maxNum = 1000;
    
    invoices.forEach((inv: any) => {
      if (inv.DocNumber) {
        const num = parseInt(inv.DocNumber);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNumber = (maxNum + 1).toString();
    return NextResponse.json({ nextNumber });
  } catch (error: any) {
    console.error('Failed to fetch next invoice number:', error);
    return NextResponse.json({ nextNumber: '1001' }); // Fallback
  }
}
