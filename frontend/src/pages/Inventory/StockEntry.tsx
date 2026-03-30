import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, ShoppingBag, ArrowLeft, Calendar, Share2, Check, User, ChevronDown, Trash } from 'lucide-react';
import api from '../../api/api';
import { Product } from '../../types';
import { useNavigate } from 'react-router-dom';

// Custom Floating-Style Input Component
const CustomInput = ({ label, value, onChange, placeholder, type = "text", disabled = false, icon = null }: any) => (
  <div className="relative group mb-6">
    <label className="absolute -top-2.5 left-3 px-1 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider z-10">
      {label}
    </label>
    <div className={`flex items-center gap-3 w-full p-2.5 border-[1.5px] rounded-xl transition-all ${disabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 group-focus-within:border-blue-500 group-focus-within:ring-1 group-focus-within:ring-blue-100'}`}>
      {icon && <div className="text-slate-400 pl-1">{icon}</div>}
      <input 
        type={type} 
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-bold placeholder:text-slate-200 p-0 text-[15px]"
        autoComplete="off"
      />
    </div>
  </div>
);

const StockEntry = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState('');

  // Step Control
  const [step, setStep] = useState<'main' | 'add-item'>('main');

  // Current Working Item State (for the detail screen)
  const [workingItem, setWorkingItem] = useState({
    productId: '',
    name: '',
    quantity: '',
    unit: 'Nos',
    price: '',
    discountPercent: 0,
    total: 0
  });
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [prodRes, sugRes, countRes] = await Promise.all([
          api.get('/products'),
          api.get('/purchases/suppliers/suggestions'),
          api.get('/purchases/count').catch(() => ({ data: 0 })) // Fallback
        ]);
        setProducts(prodRes.data);
        setSuggestions(sugRes.data);
        const count = countRes.data.count || 0;
        setBillNo(`PUR-${1001 + count}`);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitial();
  }, []);

  // Main UI Calculation
  const subtotalMain = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const grandTotal = subtotalMain;

  // Add Item Logic
  const handleSelectItem = (p: Product) => {
    setWorkingItem({
      ...workingItem,
      productId: p.id,
      name: p.name,
      unit: p.unit || 'Nos',
      price: p.purchasePrice.toString()
    });
    setItemSearch(p.name);
  };

  const addToCartInternal = (shouldReset: boolean) => {
    if (!workingItem.productId || !workingItem.quantity) return alert('Please select item and enter quantity');
    
    const qty = parseFloat(workingItem.quantity);
    const prc = parseFloat(workingItem.price);
    const ttl = qty * prc;

    const newItem = {
      ...workingItem,
      quantity: qty,
      price: prc,
      total: ttl
    };

    setCart([...cart, newItem]);

    if (shouldReset) {
      setWorkingItem({ productId: '', name: '', quantity: '', unit: 'Nos', price: '', discountPercent: 0, total: 0 });
      setItemSearch('');
    } else {
      setStep('main');
    }
  };

  const handleSubmitFinal = async (shouldReset: boolean = true) => {
    if (!supplierName) return alert('Please enter Party Name');
    if (cart.length === 0) return alert('No items added');

    setLoading(true);
    try {
      const purchaseData = {
        supplierName,
        purchaseItems: cart,
        subtotal: grandTotal,
        taxTotal: 0,
        grandTotal: grandTotal,
        amountPaid: grandTotal, // Defaulting to full payment on this simple flow for now
        paymentStatus: 'PAID',
        paymentMode: 'CASH',
        date: purchaseDate
      };

      await api.post('/purchases', purchaseData);
      alert('Stock Updated Successfully!');
      
      if (shouldReset) {
        setCart([]);
        setSupplierName('');
        setStep('main');
      } else {
        navigate('/inventory');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------------
  // RENDER: MAIN VIEW
  // --------------------------------------------------------------------------------
  if (step === 'main') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header (Image 1) */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[17px] font-black tracking-tight text-slate-800">Purchase</h1>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Date</span>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                    <input 
                      type="date" 
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-black cursor-pointer"
                    />
                    <ChevronDown size={12} />
                </div>
             </div>
          </div>
        </div>

        <div className="p-4 space-y-6 max-w-xl mx-auto">
           {/* Bill No display (Static as per request) */}
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bill No.</span>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
                      {billNo || '---'}
                  </div>
              </div>
           </div>

           {/* Party Name Input (Image 1 Style) */}
           <div className="relative group">
              <label className="absolute -top-2.5 left-3 px-1 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest z-10 group-focus-within:text-blue-500 transition-colors">Party Name *</label>
              <div className="w-full p-3.5 border-[1.5px] border-slate-300 rounded-xl flex items-center bg-white group-focus-within:border-blue-500 transition-all">
                <input 
                  type="text" 
                  placeholder="Abc company" 
                  value={supplierName}
                  autoComplete="off"
                  onChange={(e) => {
                      setSupplierName(e.target.value);
                      setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-700 placeholder:text-slate-200"
                />
              </div>

              {showSuggestions && (
                <div className="absolute z-[60] w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                    {suggestions
                        .filter(s => s.toLowerCase().includes(supplierName.toLowerCase()))
                        .map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setSupplierName(s); setShowSuggestions(false); }}
                                className="w-full p-4 text-left hover:bg-blue-50 text-slate-700 font-black border-b border-slate-50 last:border-0"
                            >
                                {s}
                            </button>
                        ))
                    }
                </div>
              )}
           </div>

           {/* Add Items Toggle - Exact Button from Image 1 */}
           <button 
             onClick={() => setStep('add-item')}
             className="w-full border-2 border-slate-200 p-3.5 rounded-xl flex items-center justify-center gap-2 text-blue-600 font-black text-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
           >
              <Plus size={20} strokeWidth={3} /> Add Items <span className="text-slate-300 font-bold ml-1">(Optional)</span>
           </button>

           {/* Running List Summary */}
           <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div>
                     <p className="font-black text-slate-800 text-sm">{item.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 capitalize">{item.quantity} {item.unit} x ₹{item.price}</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <p className="font-black text-slate-800">₹{item.total}</p>
                      <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 p-2"><Trash size={16} /></button>
                   </div>
                </div>
              ))}
           </div>

           {/* Total Amount (Image 1 Style) */}
           <div className="bg-[#F8FAFC] p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                 <span className="font-black text-slate-800 text-sm">Total Amount</span>
                 <div className="flex items-center gap-2 flex-1 ml-4 overflow-hidden">
                    <span className="font-black text-slate-800">₹</span>
                    <div className="border-b-[1.5px] border-dotted border-slate-300 h-1 flex-1 min-w-[50px]"></div>
                    <span className="font-black text-slate-800 text-lg">{grandTotal}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Global Footer (Image 1) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
           <div className="max-w-xl mx-auto flex gap-3 h-14">
              <button 
                 onClick={() => { setSupplierName(''); setCart([]); }}
                 className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-3xl transition-all"
              >
                  Save & New
              </button>
              <button 
                 onClick={() => handleSubmitFinal(false)}
                 disabled={loading}
                 className="flex-[2] bg-[#F51F45] hover:bg-red-600 text-white font-black rounded-3xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                  {loading ? 'PROCESSING...' : 'Save'}
              </button>
              <button className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-all">
                  <Share2 size={24} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // RENDER: ADD ITEM VIEW (Image 2/3)
  // --------------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white">
      {/* Detail Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 border-b border-slate-50 sticky top-0 z-50">
        <button onClick={() => setStep('main')} className="p-2 -ml-2 text-slate-500">
           <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-black tracking-tight text-slate-800">Add Items to Purchase</h1>
      </div>

      <div className="p-4 space-y-1 max-w-xl mx-auto">
          {/* Item Name (Searchable) */}
          <div className="relative h-24">
            <CustomInput 
              label="Item Name" 
              value={itemSearch}
              onChange={(e: any) => setItemSearch(e.target.value)}
              placeholder="Start typing..."
              icon={<Search size={18} />}
            />
            {itemSearch && products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()) && p.name !== workingItem.name).length > 0 && (
              <div className="absolute top-16 left-0 right-0 z-50 bg-white shadow-2xl rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                 {products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()) && p.name !== workingItem.name).map(p => (
                   <button 
                    key={p.id}
                    onClick={() => handleSelectItem(p)}
                    className="w-full p-4 text-left hover:bg-blue-50 font-black text-slate-700 border-b border-slate-50 last:border-0"
                   >
                     {p.name}
                   </button>
                 ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
             <CustomInput 
                label="Quantity" 
                type="number"
                value={workingItem.quantity}
                onChange={(e: any) => setWorkingItem({...workingItem, quantity: e.target.value})}
                placeholder="0"
             />
             <CustomInput 
                label="Unit" 
                value={workingItem.unit}
                disabled={true}
                placeholder="Nos"
                icon={<ChevronDown size={14} className="ml-auto" />}
             />
          </div>

          <CustomInput 
            label="Rate (Price/Unit)" 
            type="number"
            value={workingItem.price}
            onChange={(e: any) => setWorkingItem({...workingItem, price: e.target.value})}
            placeholder="0.0"
          />

          <div className="pt-8 space-y-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Totals & Taxes</h3>
             <div className="border-t border-slate-100 pt-4 flex justify-between items-center px-1">
                <span className="text-[13px] font-bold text-slate-500">Subtotal <span className="text-[10px] text-slate-300 ml-1">(Rate x Qty)</span></span>
                <div className="flex items-center gap-4 text-slate-800 font-black">
                   <span className="text-xs text-slate-400">₹</span>
                   <span className="text-lg">{(parseFloat(workingItem.quantity || '0') * parseFloat(workingItem.price || '0')) || '0.0'}</span>
                </div>
             </div>
          </div>
      </div>

      {/* Detail Footer (Image 2) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-50">
         <div className="max-w-xl mx-auto flex gap-4 h-12">
            <button 
               onClick={() => addToCartInternal(true)}
               className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all"
            >
                Save & New
            </button>
            <button 
               onClick={() => addToCartInternal(false)}
               className="flex-1 bg-[#F51F45] hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/10 transition-all"
            >
                Save
            </button>
         </div>
      </div>
    </div>
  );
};

export default StockEntry;
