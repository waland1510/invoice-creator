'use client';

import { useState } from 'react';
import { PlusCircle, List, Repeat, LayoutDashboard } from 'lucide-react';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';
import RecurringList from './RecurringList';

type Tab = 'create' | 'invoices' | 'recurring';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('create');

  const tabs = [
    { id: 'create', label: 'Create Invoice', icon: PlusCircle },
    { id: 'invoices', label: 'All Invoices', icon: List },
    { id: 'recurring', label: 'Recurring Templates', icon: Repeat },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <nav className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-2xl shadow-xl">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 text-slate-500">
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] uppercase font-black tracking-widest">QBO Dashboard v1.0</span>
        </div>
      </nav>

      <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden min-h-[600px] transition-all duration-500 ease-out">
        {activeTab === 'create' && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            <InvoiceForm />
          </div>
        )}
        {activeTab === 'invoices' && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Invoice History</h2>
                <p className="text-slate-400 text-sm">Review and manage your recently created invoices.</p>
              </div>
            </div>
            <InvoiceList />
          </div>
        )}
        {activeTab === 'recurring' && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="p-8 pb-0">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recurring Templates</h2>
              <p className="text-slate-400 text-sm">Manage scheduled invoice templates and automation.</p>
            </div>
            <RecurringList />
          </div>
        )}
      </div>
    </div>
  );
}
