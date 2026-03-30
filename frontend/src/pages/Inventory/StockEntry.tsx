import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, ShoppingBag, ArrowLeft, Calendar, Share2, Check, User, IndianRupee, Minus } from 'lucide-react';
import api from '../../api/api';
import { Product } from '../../types';
import { useNavigate } from 'react-router-dom';

const StockEntry = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Payment State
  const [isPaid, setIsPaid] = useState(true);
  const [paidAmount, setPaidAmount] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/purchases/suppliers/suggestions');
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching supplier suggestions:', error);
      }
    };
    fetchProducts();
    fetchSuggestions();
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
        discountPercent: 0,
        discount: 0,
        taxAmount: 0,
        total: product.purchasePrice
      }]);
    }
    setSearch('');
  };

  const updateCartItem = (productId: string, field: string, value: any) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        
        // Handle discount logic
        if (field === 'discountPercent') {
            updated.discount = (updated.price * updated.quantity * (value / 100));
        }
        
        updated.total = (updated.quantity * updated.price) - (updated.discount || 0);
        return updated;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const grandTotal = subtotal - totalDiscount;
  const balanceDue = grandTotal - (isPaid ? (parseFloat(paidAmount) || grandTotal) : 0);

  const handleSubmit = async (shouldReset: boolean = true) => {
    if (!supplierName) return alert('Please enter supplier name');
    if (cart.length === 0) return alert('Cart is empty');

    setLoading(true);
    try {
      const finalPaid = isPaid ? (parseFloat(paidAmount) || grandTotal) : 0;
      const purchaseData = {
        supplierName,
        purchaseItems: cart,
        subtotal,
        totalDiscount,
        taxTotal: 0,
        grandTotal,
        amountPaid: finalPaid,
        balanceDue: grandTotal - finalPaid,
        paymentStatus: finalPaid === grandTotal ? 'PAID' : finalPaid > 0 ? 'PARTIAL' : 'PENDING',
        paymentMode: 'CASH',
        date: purchaseDate
      };

      await api.post('/purchases', purchaseData);
      alert('Stock Updated Successfully!');
      
      if (shouldReset) {
        setCart([]);
        setSupplierName('');
        setPaidAmount('');
        setIsPaid(true);
      }
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Mobile-Friendly App Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">PURCHASE</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
               <Calendar size={14} className="text-slate-400" />
               <input 
                 type="date" 
                 value={purchaseDate}
                 onChange={(e) => setPurchaseDate(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none p-0 cursor-pointer"
               />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {/* Party Name Section */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <div className="relative group">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest absolute -top-2 left-3 bg-white px-1 group-focus-within:text-blue-600 transition-colors">Party Name *</label>
              <div className="flex items-center gap-3 w-full p-1">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                    <User size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Abc company" 
                  className="w-full py-2 bg-transparent border-none focus:ring-0 font-bold text-slate-800 text-lg placeholder:text-slate-200"
                  value={supplierName}
                  onChange={(e) => {
                      setSupplierName(e.target.value);
                      setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </div>

              {showSuggestions && supplierName && suggestions.filter(s => s.toLowerCase().includes(supplierName.toLowerCase()) && s !== supplierName).length > 0 && (
                <div className="absolute z-[60] w-full mt-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                    {suggestions
                        .filter(s => s.toLowerCase().includes(supplierName.toLowerCase()) && s !== supplierName)
                        .map((s, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    setSupplierName(s);
                                    setShowSuggestions(false);
                                }}
                                className="w-full p-4 text-left hover:bg-blue-50 text-slate-700 font-bold border-b border-slate-100 last:border-0 transition-colors flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                {s}
                            </button>
                        ))
                    }
                </div>
              )}
           </div>
        </div>

        {/* Billed Items Section Header */}
        <div className="flex items-center gap-2 px-2">
            <div className="bg-blue-500 p-1 rounded-md text-white">
                <Check size={12} strokeWidth={4} />
            </div>
            <h3 className="font-black text-xs text-blue-500 uppercase tracking-widest">Billed Items</h3>
        </div>

        {/* Card Based Item List */}
        <div className="space-y-3">
            {cart.map((item, idx) => (
                <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-slate-100 text-[10px] font-black text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">#{idx + 1}</span>
                                <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h4>
                            </div>
                            
                            <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-400">Item Subtotal</span>
                                    <div className="flex items-center gap-1.5">
                                        <input 
                                          type="number" 
                                          value={item.quantity}
                                          onChange={(e) => updateCartItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                                          className="w-12 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-blue-600 font-black text-center"
                                        />
                                        <span className="text-slate-300 mx-1">Nos x</span>
                                        <input 
                                          type="number" 
                                          value={item.price}
                                          onChange={(e) => updateCartItem(item.productId, 'price', parseFloat(e.target.value) || 0)}
                                          className="w-16 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-slate-600 font-black text-center"
                                        />
                                        <span className="text-slate-400">= ₹{item.quantity * item.price}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                                    <span>Discount (%):</span>
                                    <div className="flex items-center gap-2">
                                        <input 
                                          type="number" 
                                          value={item.discountPercent}
                                          onChange={(e) => updateCartItem(item.productId, 'discountPercent', parseFloat(e.target.value) || 0)}
                                          className="w-12 bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5 text-orange-500 font-black text-center"
                                        />
                                        <span className="bg-orange-100 px-2 py-0.5 rounded uppercase text-[10px]">₹{item.discount?.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                           <p className="text-sm font-black text-slate-800">₹{item.total.toFixed(0)}</p>
                           <button 
                             onClick={() => removeFromCart(item.productId)}
                             className="mt-6 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                    </div>
                </div>
            ))}

            {cart.length === 0 && (
                <div className="bg-dashed border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
                    <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                        <ShoppingBag size={24} />
                    </div>
                    <p className="text-slate-400 text-sm font-bold">No items added yet</p>
                </div>
            )}
        </div>

        {/* Simple Totals Row */}
        {cart.length > 0 && (
            <div className="px-2 py-4 grid grid-cols-2 gap-y-3 gap-x-8 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
               <div className="flex justify-between"><span>Total Disc:</span> <span className="text-orange-500">{totalDiscount.toFixed(1)}</span></div>
               <div className="flex justify-between"><span>Total Tax Amt:</span> <span>0.0</span></div>
               <div className="flex justify-between"><span>Total Qty:</span> <span className="text-slate-900">{cart.reduce((s, i) => s + i.quantity, 0).toFixed(1)}</span></div>
               <div className="flex justify-between"><span>Subtotal:</span> <span className="text-slate-900">{subtotal.toFixed(1)}</span></div>
            </div>
        )}

        {/* Add Items Toggle */}
        <div className="relative">
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full bg-white border border-blue-200 p-4 rounded-xl flex items-center justify-center gap-2 text-blue-600 font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
                <Plus size={20} strokeWidth={3} /> Add Items
            </button>
            <div className={`mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 transition-all duration-200 overflow-hidden ${search ? 'max-h-96 p-2' : 'max-h-0'}`}>
                <div className="relative mb-2 px-2 pt-2">
                    <input 
                      type="text" 
                      placeholder="Search Products..." 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    {filteredProducts.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="w-full flex justify-between items-center p-3 hover:bg-blue-50 rounded-xl transition-all group"
                        >
                            <div className="text-left">
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{p.unit} | Stock: {p.stockQuantity}</p>
                            </div>
                            <p className="font-black text-blue-600 text-sm">₹{p.purchasePrice}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Payment Summary Section */}
        <div className="bg-[#EDF2F7] p-6 rounded-[2rem] space-y-4">
            <div className="flex justify-between items-center">
                <span className="font-black text-slate-700 text-sm">Total Amount</span>
                <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <span>₹</span>
                    <div className="border-b-2 border-dotted border-slate-300 flex-1 min-w-[120px] text-right">{grandTotal.toFixed(1)}</div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsPaid(!isPaid)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isPaid ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-300'}`}
                    >
                        {isPaid && <Check size={16} strokeWidth={4} />}
                    </button>
                    <span className="font-black text-slate-700 text-sm">Paid</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <span>₹</span>
                    <input 
                      type="number" 
                      placeholder={grandTotal.toString()}
                      disabled={!isPaid}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="bg-transparent border-none border-b-2 border-dotted border-slate-300 w-32 text-right p-0 focus:ring-0 focus:border-blue-500 placeholder:text-slate-300"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center text-emerald-500 pt-2">
                <span className="font-black text-sm">Balance Due</span>
                <div className="flex items-center gap-2 text-lg font-black">
                    <span>₹</span>
                    <div className="border-b-2 border-dotted border-emerald-200 flex-1 min-w-[120px] text-right">{balanceDue.toFixed(1)}</div>
                </div>
            </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-[100]">
        <div className="max-w-xl mx-auto flex gap-3">
          <button 
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-2xl transition-all active:scale-95"
          >
            Save & New
          </button>
          
          <button 
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="flex-[2] py-4 bg-[#F51F45] hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'SAVING...' : 'Save'}
          </button>

          <button className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all">
            <Share2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockEntry;
