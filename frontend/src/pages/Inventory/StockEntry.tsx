import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, ShoppingBag } from 'lucide-react';
import api from '../../api/api';
import { Product } from '../../types';

const StockEntry = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } 
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.purchasePrice,
        taxAmount: 0,
        total: product.purchasePrice
      }]);
    }
  };

  const updateCartItem = (productId: string, field: string, value: any) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.price;
        return updated;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleSubmit = async () => {
    if (!supplierName) return alert('Please enter supplier name');
    if (cart.length === 0) return alert('Cart is empty');

    setLoading(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const purchaseData = {
        supplierName,
        purchaseItems: cart,
        subtotal,
        taxTotal: 0,
        grandTotal: subtotal,
        paymentMode: 'CASH',
        date: new Date().toISOString()
      };

      await api.post('/purchases', purchaseData);
      alert('Stock Updated Successfully!');
      setCart([]);
      setSupplierName('');
    } catch (error: any) {
      alert('Error saving purchase: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode?.includes(search)
  ).slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 border-l-4 border-blue-600 pl-4 uppercase tracking-tight">Stock Procurement (Stock-In)</h1>
          <p className="text-slate-500 font-medium ml-5 mt-1">Accept inventory from suppliers and update stock levels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Product Search */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Search size={18} className="text-blue-600" /> Find Product
            </h3>
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Name or Barcode..." 
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full p-4 flex justify-between items-center bg-slate-50 hover:bg-blue-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all text-left group"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Stock: {p.stockQuantity}</div>
                  </div>
                  <Plus size={18} className="text-slate-300 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart and Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl text-white">
                      <ShoppingBag size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Procurement List</h3>
               </div>
               <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{cart.length} Items</span>
            </div>
            
            <div className="p-6">
               <div className="mb-6">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Supplier Details</label>
                  <input 
                    type="text" 
                    placeholder="Enter Supplier Name or ID" 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
               </div>

               <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Qty</th>
                        <th className="pb-3">Unit Cost (₹)</th>
                        <th className="pb-3 text-right">Total (₹)</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm font-medium">
                      {cart.map(item => (
                        <tr key={item.productId} className="group">
                          <td className="py-4 font-bold text-slate-800">{item.name}</td>
                          <td className="py-4">
                            <input 
                              type="number" 
                              className="w-16 p-2 bg-slate-50 border-none rounded-lg font-bold text-blue-600"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-4">
                            <input 
                              type="number" 
                              className="w-24 p-2 bg-slate-50 border-none rounded-lg font-bold text-slate-800"
                              value={item.price}
                              onChange={(e) => updateCartItem(item.productId, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-4 text-right font-black text-slate-900">₹{item.total.toFixed(2)}</td>
                          <td className="py-4 text-right">
                             <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {cart.length === 0 && (
                        <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">Add products to start Stock-In process.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>

               <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Procurement Cost</p>
                    <h2 className="text-5xl font-black tracking-tight">₹{cart.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</h2>
                  </div>
                  <button 
                    disabled={loading || cart.length === 0}
                    onClick={handleSubmit}
                    className="w-full md:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    <Save size={20} /> {loading ? 'UPDATING STOCK...' : 'CONFIRM STOCK ENTRY'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockEntry;
