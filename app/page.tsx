import Dashboard from '@/components/Dashboard';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('qbo_token')?.value;
  console.log('Home page token status:', token ? 'Found' : 'NOT Found');

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)] p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-6 transition-transform">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Invoice Creator</h1>
            <p className="text-slate-400">Connect to QuickBooks Online to easily generate and send professional invoices.</p>
          </div>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] focus:ring-4 focus:ring-blue-500/50"
          >
            Connect QuickBooks
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tighter">
              QuickBooks <span className="text-blue-500">Invoice</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Enterprise Invoice Management System</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-2xl shadow-inner">
            <div className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs text-emerald-400 font-black uppercase tracking-widest">QBO LIVE</span>
          </div>
        </header>

        <Dashboard />
      </div>
    </main>
  );
}
