import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Wallet, Plus, Calendar, Tag, CreditCard } from 'lucide-react';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Expense Tracker</h1>
            <p className="text-slate-500 font-medium">Monitor your shop's recurring and one-time expenses.</p>
          </div>
          <button className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-500/10 active:scale-95">
            <Plus size={20} />
            <span>Add New Expense</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Description</th>
                <th className="px-8 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 animate-pulse text-slate-400">Loading expenses...</td></tr>
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 flex items-center gap-3 text-slate-600">
                      <Calendar size={16} className="text-slate-300" />
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-500">
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-slate-800 font-medium">{expense.description}</td>
                    <td className="px-8 py-4 text-right font-black text-red-500">₹{expense.amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Wallet size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-400 font-bold">No expenses recorded yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagement;
