'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Calendar, Repeat, User, DollarSign } from 'lucide-react';

export default function RecurringList() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRecurring() {
      try {
        const res = await fetch('/api/recurring');
        if (res.ok) {
          setTemplates(await res.json());
        } else {
          setError('Failed to load recurring templates');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchRecurring();
  }, []);

  const formatInterval = (info: any) => {
    const { IntervalType, NumInterval } = info.ScheduleInfo;
    if (NumInterval === 1) return `Every ${IntervalType.replace('ly', '')}`;
    return `Every ${NumInterval} ${IntervalType.replace('ly', '')}s`;
  };

  const getEntityData = (template: any) => {
    // In QBO, a recurring transaction is often wrapped in an object where the key is the txn type
    // e.g., { "Invoice": { ... } } or { "Purchase": { ... } }
    const keys = Object.keys(template).filter(k => k !== 'Id' && k !== 'MetaData' && k !== 'Status');
    const txnType = keys[0]; 
    const entity = template[txnType];
    
    return {
      txnType,
      entity,
      customer: entity?.CustomerRef?.name || entity?.VendorRef?.name || entity?.EntityRef?.name || '---',
      amount: entity?.TotalAmt || 0
    };
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="text-slate-400 font-medium">Loading recurring templates...</span>
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
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 rounded-tl-2xl">Template Name</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Type</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Txn Type</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Interval</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Dates</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Customer</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Amount</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 rounded-tr-2xl text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {templates.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">No recurring templates found.</td>
            </tr>
          ) : (
            templates.map((template) => {
              const { customer, amount, txnType, entity } = getEntityData(template);
              const info = template.RecurringInfo || entity?.RecurringInfo;

              if (!info) return null; // Skip if no recurring info found

              return (
                <tr key={template.Id || entity?.Id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{info.Name || 'Unnamed Template'}</span>
                      <span className={`text-[10px] uppercase tracking-tighter font-black ${info.Active ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {info.Active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {info.RecurType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {txnType}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-blue-400">
                      <Repeat className="w-3.5 h-3.5" />
                      {info.ScheduleInfo ? formatInterval(info) : 'No Schedule'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Prev: {info.ScheduleInfo?.PreviousDate || '---'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 font-medium">
                        <Calendar className="w-3 h-3" /> Next: {info.ScheduleInfo?.NextDate || '---'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {customer}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-white">
                    ${parseFloat(amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      title="Actions"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
