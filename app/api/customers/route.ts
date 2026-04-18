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
      
    // Query all active customers
    const query = "select * from Customer where Active = true maxresults 1000";
    
    const response = await oauthClient.makeApiCall({
      url: `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = response.json || response.data || response;
    
    return NextResponse.json(data?.QueryResponse?.Customer || []);
  } catch (error: any) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('qbo_token')?.value;
    const realmId = req.cookies.get('qbo_realm_id')?.value;
    if (!tokenCookie || !realmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = JSON.parse(tokenCookie);
    const oauthClient = getQboClient(token);
    const baseUrl = process.env.QBO_ENVIRONMENT === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';
    
    const body = await req.json();

    const response = await oauthClient.makeApiCall({
      url: `${baseUrl}/v3/company/${realmId}/customer`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = response.json || response.data || response;
    return NextResponse.json(data?.Customer || data);
  } catch (error: any) {
    console.error('Failed to create customer:', error?.authResponse || error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
