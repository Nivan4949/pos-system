import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { BarChart3, TrendingUp, ShoppingBag, Users, Clock, Calendar, FileText, IndianRupee, PieChart, Package, Receipt } from 'lucide-react';

const reportCategories = [
  {
    title: 'Main Reports',
    reports: [
      { id: 'sales', name: 'Sale Report', icon: <TrendingUp size={16} /> },
      { id: 'purchase', name: 'Purchase Report', icon: <ShoppingBag size={16} /> },
      { id: 'daybook', name: 'Day Book', icon: <FileText size={16} /> },
      { id: 'profit-loss', name: 'Profit & Loss', icon: <PieChart size={16} /> },
      { id: 'transactions', name: 'All Transactions', icon: <Receipt size={16} /> },
      { id: 'cashflow', name: 'Cashflow', icon: <IndianRupee size={16} /> },
      { id: 'balance-sheet', name: 'Balance Sheet', icon: <BarChart3 size={16} /> },
    ]
  },
  {
    title: 'Party Reports',
    reports: [
      { id: 'parties', name: 'All Parties', icon: <Users size={16} /> },
      { id: 'party-statement', name: 'Party Statement', icon: <FileText size={16} /> },
      { id: 'party-profit', name: 'Party-wise Profit', icon: <TrendingUp size={16} /> },
    ]
  },
  {
    title: 'Item / Stock Reports',
    reports: [
      { id: 'stock-summary', name: 'Stock Summary', icon: <Package size={16} /> },
      { id: 'item-profit', name: 'Item-wise Profit', icon: <TrendingUp size={16} /> },
      { id: 'stock-detail', name: 'Stock Detail', icon: <FileText size={16} /> },
    ]
  },
  {
    title: 'Expense Reports',
    reports: [
      { id: 'expenses', name: 'Expense Report', icon: <Clock size={16} /> },
    ]
  }
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [dateFilter, setDateFilter] = useState('Today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(''); // For specific party/item queries
  const [entities, setEntities] = useState<any[]>([]); // To populate dropdowns for statement/details

  // Initial load for specific entities
  useEffect(() => {
    if (activeReport === 'party-statement') {
      api.get('/customers').then(res => setEntities(res.data)).catch(console.error);
    } else if (activeReport === 'stock-detail') {
      api.get('/products').then(res => setEntities(res.data)).catch(console.error);
    }
  }, [activeReport]);

  const fetchReport = async () => {
    // Only block specific reports if ID is missing
    if ((activeReport === 'party-statement' || activeReport === 'stock-detail') && !selectedEntityId) {
      setReportData(null);
      return;
    }

    setLoading(true);
    let url = `/reports/${activeReport}?filter=${dateFilter}`;
    if (dateFilter === 'Custom') url += `&startDate=${customStart}&endDate=${customEnd}`;
    
    // Adjust URL for parameterized routes
    if (activeReport === 'party-statement') url = `/reports/party-statement/${selectedEntityId}`;
    if (activeReport === 'stock-detail') url = `/reports/stock-detail/${selectedEntityId}`;

    try {
      const response = await api.get(url);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateFilter, customStart, customEnd, selectedEntityId]);

  const renderActiveReport = () => {
    if (loading) return <div className="p-20 text-center animate-pulse text-indigo-400">Loading Report Data...</div>;
    if (!reportData && (activeReport === 'party-statement' || activeReport === 'stock-detail')) {
      return <div className="p-20 text-center text-slate-400">Please select an entity from the dropdown above.</div>;
    }
    if (!reportData) return <div className="p-20 text-center text-slate-400">No data available.</div>;

    // Based on activeReport, format the rendering
    switch (activeReport) {
      case 'sales':
      case 'purchase':
        return (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total {activeReport}</p>
                <h3 className="text-2xl font-black text-slate-800">₹{(activeReport === 'sales' ? reportData.summary.totalSales : reportData.summary.totalPurchases)?.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bill Count</p>
                <h3 className="text-2xl font-black text-slate-800">{reportData.summary.billCount}</h3>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Tax</p>
                <h3 className="text-2xl font-black text-slate-800">₹{reportData.summary.totalTax?.toFixed(2)}</h3>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Invoice</th>
                    {activeReport === 'sales' ? <th className="p-4">Customer</th> : <th className="p-4">Supplier</th>}
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {reportData.details.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-indigo-600 font-bold">{item.invoiceNo}</td>
                      <td className="p-4">{activeReport === 'sales' ? item.customer?.name || 'Walk-in' : item.supplierName}</td>
                      <td className="p-4 text-right font-bold text-slate-900">₹{item.grandTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.details.length === 0 && <div className="p-8 text-center text-slate-400">No records found.</div>}
            </div>
          </div>
        );
      
      case 'profit-loss':
        return (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-600">Total Sales</span>
              <span className="font-black text-xl text-slate-800">₹{reportData.salesAmount?.toFixed(2)}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center text-red-500">
              <span className="font-bold">Cost of Goods Sold</span>
              <span className="font-black text-xl">- ₹{reportData.cogs?.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-200"></div>
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex justify-between items-center">
              <span className="font-bold text-indigo-600">Gross Profit</span>
              <span className="font-black text-2xl text-indigo-700">₹{reportData.grossProfit?.toFixed(2)}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center text-red-500">
              <span className="font-bold">Total Expenses</span>
              <span className="font-black text-xl">- ₹{reportData.expenses?.toFixed(2)}</span>
            </div>
            <div className="h-0.5 bg-slate-300"></div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center">
              <span className="font-black text-lg text-emerald-700 uppercase tracking-widest">Net Profit</span>
              <span className="font-black text-4xl text-emerald-600">₹{reportData.netProfit?.toFixed(2)}</span>
            </div>
          </div>
        );

      case 'daybook':
      case 'transactions':
      case 'cashflow':
        return (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm">
                <p className="text-xs font-bold text-slate-400">Cash In</p>
                <h3 className="text-xl font-black text-green-600">₹{reportData.cashIn?.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
                <p className="text-xs font-bold text-slate-400">Cash Out</p>
                <h3 className="text-xl font-black text-red-600">₹{reportData.cashOut?.toFixed(2)}</h3>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl shadow-sm text-white">
                <p className="text-xs font-bold text-slate-400">Net Flow</p>
                <h3 className="text-xl font-black">₹{reportData.netBalance?.toFixed(2)}</h3>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Details</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {reportData.transactions?.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{new Date(t.date).toLocaleTimeString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black ${t.type === 'SALE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-800">{t.details}</td>
                      <td className={`p-4 text-right font-black ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount > 0 ? '+' : ''}₹{t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'stock-summary':
        return (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Inventory Cost Value</p>
                <h3 className="text-3xl font-black text-slate-800">₹{reportData.summary?.totalStockValue?.toFixed(2)}</h3>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                <p className="text-xs font-bold text-indigo-400 uppercase">Retail Potential Value</p>
                <h3 className="text-3xl font-black text-indigo-700">₹{reportData.summary?.totalRetailValue?.toFixed(2)}</h3>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4 text-center">In Stock</th>
                    <th className="p-4 text-right">Cost Price</th>
                    <th className="p-4 text-right">Retail Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.details?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="p-4 font-bold text-slate-800">{item.name}</td>
                      <td className="p-4 text-center font-black text-indigo-600">{item.stockQuantity}</td>
                      <td className="p-4 text-right text-slate-500 font-medium">₹{item.purchasePrice?.toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-slate-900">₹{item.sellingPrice?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Expenses</p>
                <h3 className="text-3xl font-black text-red-600">₹{reportData.total?.toFixed(2)}</h3>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium">
                  {reportData.details?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-4">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-slate-900">{item.type}</td>
                      <td className="p-4 text-slate-500">{item.description || '-'}</td>
                      <td className="p-4 text-right font-black text-red-600">₹{item.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {reportData.details?.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No expenses found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'parties':
      case 'party-profit':
      case 'item-profit':
        const isParty = activeReport === 'parties';
        const isItemProfit = activeReport === 'item-profit';
        return (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">{isItemProfit ? 'Item Name' : 'Party Name'}</th>
                  {isParty ? (
                    <>
                      <th className="p-4 text-center">Phone</th>
                      <th className="p-4 text-center">Loyalty Pts</th>
                      <th className="p-4 text-right">Credit Bal</th>
                      <th className="p-4 text-right">Total Spent</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 text-right">Sales Revenue</th>
                      <th className="p-4 text-right">COGS / Cost</th>
                      <th className="p-4 text-right">Net Profit</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700 font-medium">
                {reportData.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{item.name}</td>
                    {isParty ? (
                      <>
                        <td className="p-4 text-center">{item.phone || '-'}</td>
                        <td className="p-4 text-center text-indigo-600 font-bold">{item.loyaltyPoints}</td>
                        <td className="p-4 text-right font-bold text-slate-600">₹{item.creditBalance?.toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-slate-800">₹{item.totalSpent?.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-right font-bold text-green-600">₹{(item.totalSales || item.revenue)?.toFixed(2)}</td>
                        <td className="p-4 text-right text-red-500">₹{(item.cogs || item.cost)?.toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-emerald-600">₹{item.profit?.toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'party-statement':
        return (
          <div>
             <div className="bg-indigo-50 p-6 rounded-2xl mb-6 flex justify-between items-center border border-indigo-100">
               <div>
                 <h2 className="text-2xl font-black text-indigo-900">{reportData.name}</h2>
                 <p className="text-sm font-bold text-indigo-500">{reportData.phone}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs uppercase font-bold text-indigo-400">Total Spent</p>
                 <h3 className="text-2xl font-black text-indigo-700">₹{reportData.totalSpent?.toFixed(2)}</h3>
               </div>
             </div>
             <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Invoice</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium">
                  {reportData.orders?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-slate-800">{item.invoiceNo}</td>
                      <td className="p-4"><span className="bg-green-100 text-green-600 px-2 py-1 rounded-md text-[10px] uppercase font-black">{item.status}</span></td>
                      <td className="p-4 text-right font-black text-slate-900">₹{item.grandTotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!reportData.orders || reportData.orders.length === 0) && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No orders found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'balance-sheet':
        return (
          <div className="max-w-xl mx-auto space-y-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 border-b pb-4 mb-4">Assets</h3>
                <div className="flex justify-between items-center py-2 text-slate-600 font-medium">
                  <span>Inventory Value</span>
                  <span>₹{reportData.assets?.inventoryValue?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-slate-600 font-medium">
                  <span>Receivables (Customer Credits)</span>
                  <span>₹{reportData.assets?.receivables?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-4 mt-2 border-t font-black text-lg text-slate-900">
                  <span>Total Assets</span>
                  <span>₹{reportData.assets?.totalAssets?.toFixed(2)}</span>
                </div>
             </div>
          </div>
        );

      case 'stock-detail':
        return (
          <div>
            <div className="bg-white p-6 rounded-2xl mb-6 shadow-sm border flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black text-slate-900">{reportData.name}</h2>
                 <p className="text-sm font-bold text-slate-500">Barcode: {reportData.barcode || 'N/A'} | Unit: {reportData.unit}</p>
               </div>
               <div className="flex gap-4 text-right">
                 <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Current Stock</p>
                   <h3 className="text-2xl font-black text-indigo-600">{reportData.stockQuantity}</h3>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
               <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">Inventory Logs</div>
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm font-medium">
                    {reportData.inventoryLogs?.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-600">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-4 font-black">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="p-4 font-black text-slate-800">{log.type === 'IN' ? '+' : '-'}{log.quantity}</td>
                        <td className="p-4 text-slate-500">{log.reason || '-'}</td>
                      </tr>
                    ))}
                    {(!reportData.inventoryLogs || reportData.inventoryLogs.length === 0) && (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400">No inventory history found.</td></tr>
                    )}
                  </tbody>
               </table>
             </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <pre className="text-xs text-slate-600 overflow-auto max-h-[600px] bg-slate-50 p-4 rounded-xl">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-slate-100 font-sans">
      {/* Sidebar / Report Categories */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto flex-shrink-0 mt-16 md:mt-0 pb-20">
        <h2 className="font-black text-2xl text-slate-800 mb-6 px-2">Reports</h2>
        <div className="space-y-6">
          {reportCategories.map((cat, i) => (
             <div key={i}>
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 px-2">{cat.title}</h3>
               <div className="space-y-1">
                 {cat.reports.map(report => (
                   <button
                     key={report.id}
                     onClick={() => { setActiveReport(report.id); setSelectedEntityId(''); }}
                     className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${
                       activeReport === report.id 
                         ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                         : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                     }`}
                   >
                     {report.icon}
                     {report.name}
                   </button>
                 ))}
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {reportCategories.flatMap(c => c.reports).find(r => r.id === activeReport)?.name}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Real-time data synchronization</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Entity Selectors (Only visible for certain reports) */}
            {(activeReport === 'party-statement') && (
              <select 
                value={selectedEntityId} 
                onChange={e => setSelectedEntityId(e.target.value)}
                className="bg-white border rounded-xl px-4 py-2 font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Customer...</option>
                {entities.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>)}
              </select>
            )}

            {(activeReport === 'stock-detail') && (
              <select 
                value={selectedEntityId} 
                onChange={e => setSelectedEntityId(e.target.value)}
                className="bg-white border rounded-xl px-4 py-2 font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Product...</option>
                {entities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}

            {/* Date Filters (Hidden for some static reports like parties, stock-summary) */}
            {['parties', 'stock-summary', 'balance-sheet'].indexOf(activeReport) === -1 && (
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <Calendar className="w-5 h-5 ml-2 text-slate-400" />
                <select 
                  className="bg-transparent border-none text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 mr-2 py-1.5"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="Today">Today</option>
                  <option value="Week">This Week</option>
                  <option value="Month">This Month</option>
                  <option value="Custom">Custom Range</option>
                  <option value="All">All Time</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Inputs */}
        {dateFilter === 'Custom' && ['parties', 'stock-summary', 'balance-sheet'].indexOf(activeReport) === -1 && (
          <div className="flex gap-4 mb-6">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-2 border rounded-xl text-sm font-medium" />
            <span className="self-center font-bold text-slate-400">To</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-2 border rounded-xl text-sm font-medium" />
          </div>
        )}

        <div className="w-full">
          {renderActiveReport()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
