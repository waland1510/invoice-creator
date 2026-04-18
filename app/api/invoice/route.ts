import { NextRequest, NextResponse } from 'next/server';
import { getQboClient } from '@/lib/qbo-auth';

export async function POST(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('qbo_token')?.value;
    const realmId = req.cookies.get('qbo_realm_id')?.value;

    if (!tokenCookie || !realmId) {
      return NextResponse.json({ error: 'Unauthorized. Please login to QuickBooks first.' }, { status: 401 });
    }

    const token = JSON.parse(tokenCookie);
    const oauthClient = getQboClient(token);

    const body = await req.json();
    
    // Determine the base URL based on the environment
    const baseUrl = process.env.QBO_ENVIRONMENT === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com' 
      : 'https://quickbooks.api.intuit.com';

    // Check if this is a recurring transaction
    const isRecurring = !!body.Invoice?.RecurringInfo;
    const endpoint = isRecurring ? 'recurringtransaction' : 'invoice';

    const response = await oauthClient.makeApiCall({
      url: `${baseUrl}/v3/company/${realmId}/${endpoint}?minorversion=65`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = response.getJson?.() || response.json || response.data || response;
    return NextResponse.json(data);
  } catch (error: any) {
    const errorDetail = error?.authResponse?.getJson?.() || error.message;
    console.error('Invoice creation failed:', JSON.stringify(errorDetail, null, 2));
    return NextResponse.json({ 
      error: 'Failed to create invoice',
      details: errorDetail
    }, { status: 500 });
  }
}
