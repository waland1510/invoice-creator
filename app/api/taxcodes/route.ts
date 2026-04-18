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
    
    // Query active tax codes
    const query = "select * from TaxCode where Active = true maxresults 100";
    const response = await oauthClient.makeApiCall({
      url: `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = response.json || response.data || response;
    let taxCodes = data?.QueryResponse?.TaxCode || [];
    
    // Filter out internal adjustment tax codes that cannot calculate tax (empty SalesTaxRateList)
    taxCodes = taxCodes.filter((t: any) => 
      t.SalesTaxRateList && 
      t.SalesTaxRateList.TaxRateDetail && 
      t.SalesTaxRateList.TaxRateDetail.length > 0
    );

    return NextResponse.json(taxCodes);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch tax codes' }, { status: 500 });
  }
}
