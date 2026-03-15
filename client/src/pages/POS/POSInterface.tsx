import React, { useState, useEffect, ChangeEvent } from 'react';
import { Search, ShoppingCart, User, CreditCard, Trash2, Plus, Minus, Scan, Maximize, Minimize, Camera, Wifi, WifiOff, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import usePOSStore from '../../store/posStore';
import PaymentModal from '../../components/PaymentModal';
import ReceiptPreview from '../../components/ReceiptPreview';
import { Product, CartItem } from '../../types';
import { offlineDB } from '../../utils/offlineDB';
import { addToSyncQueue } from '../../utils/syncQueue';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import InstallPrompt from '../../components/InstallPrompt';

const POSInterface: React.FC = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotals } = usePOSStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const isOnline = useNetworkStatus();

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await axios.get(`/api/products?search=${query}`);
        setProducts(response.data);
        // Cache products for offline use
        if (query === '') {
          for (const product of response.data) {
            await offlineDB.put('products', product);
          }
        }
      } else {
        // Fetch from IndexedDB when offline
        const offlineProducts = await offlineDB.getAll('products');
        const filtered = query 
          ? offlineProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode?.includes(query))
          : offlineProducts;
        setProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to offline DB on error
      const offlineProducts = await offlineDB.getAll('products');
      setProducts(offlineProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchProducts(e.target.value);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false);
      scanner.render((decodedText: string) => {
        // Find product by barcode
        const product = products.find((p: Product) => p.barcode === decodedText);
        if (product) {
          addToCart(product);
          setShowScanner(false);
          scanner.clear();
        }
      }, (error: any) => {
        // Ignore errors
      });
      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner, products]);

  const handlePaymentComplete = async (method: string, amount: string) => {
    const { subtotal, taxTotal, grandTotal } = getTotals();
    const orderData = {
      id: crypto.randomUUID(), 
      orderItems: cart,
      subtotal,
      taxTotal,
      grandTotal,
      paymentMode: method,
      discount: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const response = await axios.post('/api/orders', orderData, {
          headers: { 'x-terminal-id': 'T1' }
        });
        setRecentOrder(response.data);
      } else {
        // Offline Flow: Add to Sync Queue
        await addToSyncQueue('CREATE_ORDER', orderData);
        setRecentOrder(orderData);
        alert('Order saved offline. It will sync when internet returns.');
      }
      clearCart();
      setIsPaymentModalOpen(false);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Payment Error:', error);
      // If online request fails, fall back to offline queue
      await addToSyncQueue('CREATE_ORDER', orderData);
      setRecentOrder(orderData);
      clearCart();
      setIsPaymentModalOpen(false);
      setIsPreviewOpen(true);
      alert('Order saved offline due to connection error.');
    }
  };

  const { subtotal, taxTotal, grandTotal } = getTotals();

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Top Header */}
      <header className="bg-blue-600 text-white p-3 flex justify-between items-center shadow-md select-none">
        <div className="flex items-center gap-2">
          <div className="bg-white text-blue-600 p-1 rounded font-bold text-xl">POS</div>
          <span className="font-semibold tracking-tight">Retail Pro v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-blue-700 rounded-lg transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button className="flex items-center gap-1 bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition-colors">
            <User size={18} />
            <span>Cashier Mode</span>
          </button>
          <div className="text-sm font-light">
            {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side - Product Selection (60%) */}
        <section className="w-3/5 flex flex-col p-4 gap-4 overflow-hidden border-r border-slate-200">
          <div className="relative group flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search by name or scan barcode..."
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
                value={search}
                onChange={handleSearch}
                autoFocus
              />
            </div>
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className={`px-4 rounded-xl shadow-sm border transition-all flex items-center justify-center ${showScanner ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
              title="Camera Scanner"
            >
              <Camera size={24} />
            </button>
          </div>

          {showScanner && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner relative animate-in fade-in zoom-in-95">
              <div id="reader" className="overflow-hidden rounded-lg"></div>
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">Loading products...</div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col bg-white rounded-xl p-3 shadow-sm border border-transparent hover:border-blue-400 hover:shadow-md active:scale-95 transition-all text-left group"
                  >
                    <div className="w-full h-32 bg-slate-50 mb-2 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="object-contain" />
                      ) : (
                        <div className="text-slate-300 font-bold text-4xl select-none group-hover:text-blue-200 transition-colors">{product.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="font-semibold text-slate-700 truncate mb-1">{product.name}</div>
                    <div className="text-blue-600 font-bold text-lg">₹{product.sellingPrice.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-1 flex justify-between items-end">
                      <span>Stock: {product.stockQuantity}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">{product.unit}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-400">No products found</div>
              )}
            </div>
          </div>
        </section>

        {/* Right Side - Cart & Billing (40%) */}
        <section className="w-2/5 flex flex-col bg-white shadow-xl overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart size={22} className="text-blue-600" />
              <h2 className="font-bold text-lg text-slate-700">Billing Cart</h2>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{cart.length} ITEMS</span>
            </div>
            <button 
              onClick={clearCart}
              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors group"
              title="Clear Cart"
            >
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {cart.map((item: CartItem) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors flex gap-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 mb-1">{item.name}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                         <span>₹{item.sellingPrice.toFixed(2)}</span>
                         <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                         <span className="text-xs font-medium text-slate-400 underline decoration-slate-200 uppercase tracking-wider">{item.category?.name || 'General'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-500 transition-all font-bold"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="w-10 text-center font-bold text-slate-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-600 transition-all font-bold"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="font-bold text-slate-900">₹{(item.sellingPrice * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-60">
                 <ShoppingCart size={80} strokeWidth={1} className="mb-4" />
                 <p className="text-lg font-medium">Your cart is empty</p>
                 <p className="text-sm">Scan a barcode or search for products</p>
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="p-6 bg-slate-900 text-white rounded-t-3xl shadow-2xl">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Subtotal</span>
                <span className="text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>GST Tax</span>
                <span className="text-white">₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-800 my-2"></div>
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-blue-400">Total Amount</span>
                <span className="text-4xl font-black text-white tracking-tight">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                disabled={cart.length === 0}
              >
                <Scan size={20} />
                <span>Save Bill</span>
              </button>
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
                disabled={cart.length === 0}
              >
                <CreditCard size={20} />
                <span>PAY NOW</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {isPaymentModalOpen && (
        <PaymentModal 
          total={grandTotal} 
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {isPreviewOpen && (
        <ReceiptPreview 
          order={recentOrder} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <InstallPrompt />
    </div>
  );
};

export default POSInterface;
