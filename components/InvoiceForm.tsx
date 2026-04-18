'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2, Calendar, Clock, Repeat, Hash } from 'lucide-react';

export default function InvoiceForm() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [taxCodes, setTaxCodes] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [descriptionSearch, setDescriptionSearch] = useState<Record<number, string>>({});
  const [showDescOptions, setShowDescOptions] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    customerRef: '',
    customerMemo: '',
    docNumber: '',
  });

  // Recurring states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringData, setRecurringData] = useState({
    templateName: '',
    interval: 'Monthly',
    startDate: new Date().toISOString().split('T')[0],
    recurType: 'Scheduled'
  });

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    displayName: '',
    email: '',
    line1: '',
    city: '',
    state: '',
    zip: ''
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [lineItems, setLineItems] = useState([
    { id: 1, itemRef: '', description: '', qty: 1, rate: 0, taxCodeRef: 'NON' }
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, itemRes, taxRes, descRes, numRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/items'),
          fetch('/api/taxcodes'),
          fetch('/api/descriptions'),
          fetch('/api/invoices/next-number')
        ]);
        if (custRes.ok) setCustomers(await custRes.json());
        if (itemRes.ok) setItems(await itemRes.json());
        if (descRes.ok) setDescriptions(await descRes.json());
        if (numRes.ok) {
          const { nextNumber } = await numRes.json();
          setFormData(prev => ({ ...prev, docNumber: nextNumber }));
        }
        
        if (taxRes.ok) {
          const fetchedTaxCodes = await taxRes.json();
          setTaxCodes(fetchedTaxCodes);
          if (fetchedTaxCodes.length > 0) {
            setLineItems([{ id: 1, itemRef: '', description: '', qty: 1, rate: 0, taxCodeRef: fetchedTaxCodes[0].Id }]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomer.displayName.trim()) return;
    setCreatingCustomer(true);
    const payload: any = { 
      DisplayName: newCustomer.displayName.trim(),
      CompanyName: newCustomer.displayName.trim()
    };
    if (newCustomer.email.trim()) payload.PrimaryEmailAddr = { Address: newCustomer.email.trim() };
    if (newCustomer.line1.trim() || newCustomer.city.trim()) {
      payload.BillAddr = {
        Line1: newCustomer.line1.trim(),
        City: newCustomer.city.trim(),
        CountrySubDivisionCode: newCustomer.state.trim(),
        PostalCode: newCustomer.zip.trim()
      };
    }
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomers([...customers, customer]);
        setFormData({ ...formData, customerRef: customer.Id });
        setShowNewCustomer(false);
        setNewCustomer({ displayName: '', email: '', line1: '', city: '', state: '', zip: '' });
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const addLineItem = () => {
    const defaultTax = taxCodes.length > 0 ? taxCodes[0].Id : 'NON';
    setLineItems([...lineItems, { id: Date.now(), itemRef: '', description: '', qty: 1, rate: 0, taxCodeRef: defaultTax }]);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: number, field: string, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const filteredCustomers = customers.filter(c => 
    c.DisplayName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredDescriptions = (id: number) => {
    const search = descriptionSearch[id] || '';
    return descriptions.filter(d => 
      d.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleItemSelect = (id: number, itemRefValue: string) => {
    const selectedItem = items.find(i => i.Id === itemRefValue);
    if (selectedItem) {
      setLineItems(lineItems.map(item => 
        item.id === id ? { 
          ...item, 
          itemRef: itemRefValue,
          description: selectedItem.Description || item.description,
          rate: selectedItem.UnitPrice || item.rate
        } : item
      ));
    } else {
      updateLineItem(id, 'itemRef', itemRefValue);
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerRef) {
      setError('Please select a customer');
      return;
    }
    if (lineItems.some(item => !item.itemRef)) {
      setError('Please select an item for all lines');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    const invoiceData: any = {
      DocNumber: formData.docNumber,
      CustomerRef: { value: formData.customerRef },
      Line: lineItems.map(item => {
        const line: any = {
          Amount: item.qty * item.rate,
          DetailType: 'SalesItemLineDetail',
          Description: item.description,
          SalesItemLineDetail: {
            ItemRef: { value: item.itemRef },
            Qty: item.qty,
            UnitPrice: item.rate
          }
        };
        if (item.taxCodeRef && item.taxCodeRef !== 'NON') {
          line.SalesItemLineDetail.TaxCodeRef = { value: item.taxCodeRef };
        }
        return line;
      })
    };

    if (formData.customerMemo) {
      invoiceData.CustomerMemo = { value: formData.customerMemo };
    }

    let payload: any = invoiceData;

    if (isRecurring) {
      const day = new Date(recurringData.startDate).getDate();
      invoiceData.RecurringInfo = {
        Name: recurringData.templateName || `Invoice for ${customers.find(c => c.Id === formData.customerRef)?.DisplayName || 'Customer'}`,
        RecurType: 'Automated',
        Active: true,
        ScheduleInfo: {
          IntervalType: recurringData.interval,
          NumInterval: 1,
          StartDate: recurringData.startDate
        }
      };
      if (recurringData.interval === 'Monthly') {
        invoiceData.RecurringInfo.ScheduleInfo.DayOfMonth = day;
      }
      payload = { Invoice: invoiceData };
    }

    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      
      const invoiceId = isRecurring ? data.RecurringTransaction?.Invoice?.Id : data.Invoice?.Id;
      setCreatedInvoiceId(invoiceId || null);
      setSuccess(true);
      
      // Reset form but fetch next number for next one
      const numRes = await fetch('/api/invoices/next-number');
      if (numRes.ok) {
        const { nextNumber } = await numRes.json();
        setFormData({ customerRef: '', customerMemo: '', docNumber: nextNumber });
      } else {
        setFormData({ customerRef: '', customerMemo: '', docNumber: '' });
      }
      
      const defaultTax = taxCodes.length > 0 ? taxCodes[0].Id : 'NON';
      setLineItems([{ id: Date.now(), itemRef: '', description: '', qty: 1, rate: 0, taxCodeRef: defaultTax }]);
      setCustomerSearch('');
      if (isRecurring) setIsRecurring(false);
      
      setTimeout(() => {
        setSuccess(false);
        setCreatedInvoiceId(null);
      }, 10000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-20 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <span className="text-slate-400 font-medium animate-pulse">Loading QuickBooks data...</span>
    </div>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">{error}</div>}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 font-medium animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0"/> 
            <div>
              <p className="text-emerald-300">Invoice created successfully!</p>
              {createdInvoiceId && <p className="text-xs text-emerald-500/80 font-mono mt-0.5">ID: {createdInvoiceId}</p>}
            </div>
          </div>
          {createdInvoiceId && (
            <a 
              href={`https://app.sandbox.qbo.intuit.com/app/invoice?txnId=${createdInvoiceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg transition-colors font-bold uppercase tracking-wider"
            >
              View in QuickBooks
            </a>
          )}
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2 col-span-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-500" /> Invoice No.
            </label>
            <button 
              type="button"
              onClick={async () => {
                const res = await fetch('/api/invoices/next-number');
                if (res.ok) {
                  const { nextNumber } = await res.json();
                  setFormData(prev => ({ ...prev, docNumber: nextNumber }));
                }
              }}
              className="text-[10px] text-slate-500 hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors"
            >
              Refresh
            </button>
          </div>
          <input 
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono shadow-inner"
            value={formData.docNumber}
            onChange={(e) => setFormData({...formData, docNumber: e.target.value})}
            placeholder="Auto-incrementing..."
          />
        </div>
        <div className="space-y-2 col-span-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-300">Customer</label>
            {!showNewCustomer && (
              <button 
                type="button" 
                onClick={() => setShowNewCustomer(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                + New Customer
              </button>
            )}
          </div>
          
          {showNewCustomer ? (
            <div className="bg-slate-900 border border-blue-500/50 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Customer / Company Name *"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                  value={newCustomer.displayName}
                  onChange={(e) => setNewCustomer({...newCustomer, displayName: e.target.value})}
                  autoFocus
                />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-2 font-medium">Billing Address</p>
                  <input 
                    type="text" 
                    placeholder="Street Address"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500 mb-2"
                    value={newCustomer.line1}
                    onChange={(e) => setNewCustomer({...newCustomer, line1: e.target.value})}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" placeholder="City"
                      className="col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="State/Prov"
                      className="col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="ZIP/Postal"
                      className="col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                      value={newCustomer.zip}
                      onChange={(e) => setNewCustomer({...newCustomer, zip: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewCustomer(false)} className="text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-colors">Cancel</button>
                <button type="button" onClick={handleCreateCustomer} disabled={creatingCustomer || !newCustomer.displayName.trim()} className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl transition-colors">{creatingCustomer ? 'Saving...' : 'Save Customer'}</button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <input 
                type="text"
                placeholder="Search or select customer..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <select 
                className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                value={formData.customerRef}
                onChange={(e) => {
                  setFormData({...formData, customerRef: e.target.value});
                  const selected = customers.find(c => c.Id === e.target.value);
                  if (selected) setCustomerSearch(selected.DisplayName);
                }}
              >
                <option value="">Select a customer...</option>
                {filteredCustomers.map(c => <option key={c.Id} value={c.Id}>{c.DisplayName}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">Customer Memo <span className="text-slate-500 font-normal">(Optional)</span></label>
        <input 
          type="text"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
          value={formData.customerMemo}
          onChange={(e) => setFormData({...formData, customerMemo: e.target.value})}
          placeholder="Thank you for your business!"
        />
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRecurring ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'} transition-colors`}>
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recurring Transaction</h3>
              <p className="text-xs text-slate-500">Automatically generate this invoice on a schedule</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
          </label>
        </div>

        {isRecurring && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Template Name</label>
              <input 
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                placeholder="Monthly retainer..."
                value={recurringData.templateName}
                onChange={(e) => setRecurringData({...recurringData, templateName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Interval</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                value={recurringData.interval}
                onChange={(e) => setRecurringData({...recurringData, interval: e.target.value})}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={recurringData.startDate}
                  onChange={(e) => setRecurringData({...recurringData, startDate: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-800/50">
        <h3 className="text-lg font-semibold text-white">Line Items</h3>
        <div className="space-y-3">
          {lineItems.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-sm group">
              <div className="w-full md:w-1/4">
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                  value={item.itemRef}
                  onChange={(e) => handleItemSelect(item.id, e.target.value)}
                >
                  <option value="">Select Item</option>
                  {items.map(i => <option key={i.Id} value={i.Id}>{i.Name}</option>)}
                </select>
              </div>
              <div className="w-full md:w-2/4 relative">
                <input 
                  type="text" placeholder="Type description..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                  value={item.description}
                  onChange={(e) => {
                    updateLineItem(item.id, 'description', e.target.value);
                    setDescriptionSearch({...descriptionSearch, [item.id]: e.target.value});
                    setShowDescOptions(item.id);
                  }}
                  onFocus={() => setShowDescOptions(item.id)}
                  onBlur={() => setTimeout(() => setShowDescOptions(null), 200)}
                />
                {showDescOptions === item.id && filteredDescriptions(item.id).length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-2">
                    {filteredDescriptions(item.id).map((desc, i) => (
                      <button key={i} type="button" className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white transition-colors" onClick={() => { updateLineItem(item.id, 'description', desc); setDescriptionSearch({...descriptionSearch, [item.id]: desc}); setShowDescOptions(null); }}>{desc}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="w-1/3 md:w-24">
                  <input type="number" min="1" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white" value={item.qty} onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)} />
                </div>
                <div className="w-1/3 md:w-32 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" min="0" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-6 pr-3 py-2.5 text-sm text-white" value={item.rate} onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                </div>
                {taxCodes.length > 0 && (
                  <div className="w-1/3 md:w-32">
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-white" value={item.taxCodeRef} onChange={(e) => updateLineItem(item.id, 'taxCodeRef', e.target.value)}>
                      <option value="NON">No Tax</option>
                      {taxCodes.map(t => <option key={t.Id} value={t.Id}>{t.Name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1} className="text-slate-500 hover:text-red-400 p-2"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLineItem} className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-blue-500/10"><Plus className="w-4 h-4" /> Add Line Item</button>
      </div>

      <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-2xl font-bold text-white flex flex-col">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Total Amount</span>
          <span className="text-blue-400">${totalAmount.toFixed(2)}</span>
        </div>
        <button type="submit" disabled={submitting} className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-600/50 text-white font-semibold py-3.5 px-10 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {submitting ? 'Generating...' : (isRecurring ? 'Create Recurring Template' : 'Generate Invoice')}
        </button>
      </div>
    </form>
  );
}
