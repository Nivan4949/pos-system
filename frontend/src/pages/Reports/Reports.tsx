import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { BarChart3, TrendingUp, ShoppingBag, Users, Clock, ArrowUpRight } from 'lucide-react';

const Reports = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/reports/summary');
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Analyzing sales data...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp size={20} className="md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">Total Revenue</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">₹{summary?.totalRevenue.toFixed(2)}</h2>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 text-green-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4">
              <ShoppingBag size={20} className="md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">Total Orders</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">{summary?.totalOrders}</h2>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4">
              <Users size={20} className="md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">New Customers</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">12</h2>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4">
              <Clock size={20} className="md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">Avg Order Value</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">₹{(summary?.totalRevenue / (summary?.totalOrders || 1)).toFixed(2)}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-lg md:text-xl text-slate-800">Recent Transactions</h3>
            <button className="text-blue-600 font-bold text-xs md:text-sm flex items-center gap-1 hover:underline">
              View All <ArrowUpRight size={14} className="md:w-4 md:h-4" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                  <th className="px-4 md:px-8 py-4">Invoice</th>
                  <th className="px-4 md:px-8 py-4">Customer</th>
                  <th className="px-4 md:px-8 py-4">Mode</th>
                  <th className="px-4 md:px-8 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary?.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors text-sm md:text-base">
                    <td className="px-4 md:px-8 py-4 font-bold text-slate-600">{order.invoiceNo}</td>
                    <td className="px-4 md:px-8 py-4 text-slate-800 font-medium truncate max-w-[150px]">{order.customer?.name || 'Walk-in Customer'}</td>
                    <td className="px-4 md:px-8 py-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase text-slate-500">{order.paymentMode}</span>
                    </td>
                    <td className="px-4 md:px-8 py-4 text-right font-black text-slate-900">₹{order.grandTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
