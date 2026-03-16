import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Users, UserPlus, Phone, Mail, Award, CreditCard } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyaltyPoints: number;
  creditBalance: number;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customer Network</h1>
            <p className="text-slate-500 font-medium">Track loyalty, credit, and purchase history.</p>
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            <UserPlus size={20} />
            <span>Add New Customer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-medium text-lg">Loading customer database...</div>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 text-orange-500 font-black">
                      <Award size={16} />
                      {customer.loyaltyPoints}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Loyalty Points</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-4">{customer.name}</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">{customer.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm font-medium truncate">{customer.email || 'No email registered'}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Credit Balance</p>
                    <p className={`text-lg font-black ${customer.creditBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{customer.creditBalance.toFixed(2)}
                    </p>
                  </div>
                  <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                    <CreditCard size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <Users size={64} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold text-xl">No customers found</p>
               <p className="text-slate-300">Add customers to track their shopping experience.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
