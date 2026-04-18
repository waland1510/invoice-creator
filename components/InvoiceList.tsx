'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Mail, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
          setInvoices(await res.json());
        } else {
          setError('Failed to load invoices');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const getStatusBadge = (invoice: any) => {
    const balance = parseFloat(invoice.Balance);
    const total = parseFloat(invoice.TotalAmt);
    
    if (balance === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> Paid
        </span>
      );
    }
    
    if (balance < total) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock className="w-3 h-3" /> Partial
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3 h-3" /> Open
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="text-slate-400 font-medium">Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 text-center">
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-900/50">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 rounded-tl-2xl">Date</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">No.</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Customer</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Amount</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 rounded-tr-2xl">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No invoices found.</td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.Id} className="group hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-300">
                  {new Date(invoice.TxnDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-400">
                  {invoice.DocNumber || '---'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {invoice.CustomerRef.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-white">
                  ${parseFloat(invoice.TotalAmt).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(invoice)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <a 
                      href={`https://app.sandbox.qbo.intuit.com/app/invoice?txnId=${invoice.Id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="View in QuickBooks"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
