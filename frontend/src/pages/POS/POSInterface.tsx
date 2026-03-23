import React, { useState, useEffect, ChangeEvent } from 'react';
import { Search, ShoppingCart, User, CreditCard, Trash2, Plus, Minus, Scan, Maximize, Minimize, Camera, Wifi, WifiOff, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/api';
import usePOSStore from '../../store/posStore';
import PaymentModal from '../../components/PaymentModal';
import ReceiptPreview from '../../components/ReceiptPreview';
import { Product, CartItem } from '../../types';
import { offlineDB } from '../../utils/offlineDB';
import { addToSyncQueue } from '../../utils/syncQueue';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import InstallPrompt from '../../components/InstallPrompt';
import CustomerSelectionModal from '../../components/CustomerSelectionModal';
import RedeemPointsModal from '../../components/RedeemPointsModal';

const POSInterface: React.FC = () => {
  const cart = usePOSStore(state => state.cart);
  const addToCart = usePOSStore(state => state.addToCart);
  const removeFromCart = usePOSStore(state => state.removeFromCart);
  const updateQuantity = usePOSStore(state => state.updateQuantity);
  const clearCart = usePOSStore(state => state.clearCart);
  const getTotals = usePOSStore(state => state.getTotals);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  const isOnline = useNetworkStatus();
  
  const customer = usePOSStore(state => state.customer);
  const setCustomer = usePOSStore(state => state.setCustomer);
  const loyaltyDiscount = usePOSStore(state => state.loyaltyDiscount);
  const appliedPoints = usePOSStore(state => state.appliedPoints);

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await api.get(`/products?search=${query}&activeOnly=true`);
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

  // Global Keyboard Barcode Scanner Listener
  useEffect(() => {
    let barcodeBuffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          const product = products.find(p => p.barcode === barcodeBuffer);
          if (product) {
            addToCart(product);
          } else {
            console.warn('Barcode scanned but no product found:', barcodeBuffer);
          }
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcodeBuffer = ''; // Reset if typing is too slow (not a scanner)
        }, 80); // Scanners type very fast
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [products, addToCart]);

  const handlePaymentComplete = async (method: string, amount: string) => {
    const { subtotal, taxTotal, grandTotal } = getTotals();
    const orderData = {
      id: crypto.randomUUID(), 
      invoiceNo: `OFFLINE-${Date.now()}`,
      orderItems: cart.map((item: any) => ({
        ...item,
        price: item.sellingPrice, // Standardize for ReceiptPreview
        total: item.sellingPrice * item.quantity
      })),
      subtotal,
      taxTotal,
      grandTotal,
      paymentMode: method,
      discount: loyaltyDiscount,
      loyaltyPointsRedeemed: appliedPoints,
      customerId: customer?.id || null,
      createdAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const response = await api.post('/orders', orderData, {
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
    } catch (error: any) {
      console.error('Payment Error:', error);
      // If online request fails, fall back to offline queue
      await addToSyncQueue('CREATE_ORDER', orderData);
      setRecentOrder(orderData);
      clearCart();
      setIsPaymentModalOpen(false);
      // Only show preview if it's a critical success or offline fallback
      setIsPreviewOpen(true); 
      alert(`Checkout Status: ${error.response?.data?.error || 'Server connection issue'}. Order saved locally.`);
    }
  };

  const { subtotal, taxTotal, grandTotal } = getTotals();

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      {/* Top Header */}
      <header className="bg-blue-600 text-white p-3 flex justify-between items-center shadow-md select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white text-blue-600 p-1 rounded font-bold text-xl">POS</div>
          <span className="font-semibold tracking-tight hidden sm:block">Retail Pro v1.0</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className={`flex items-center gap-2 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border ${isOnline ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden xs:block">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 md:p-2 hover:bg-blue-700 rounded-lg transition-all hidden xs:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <div className="text-[10px] md:text-sm font-light hidden lg:block">
            {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side - Product Selection */}
        <section className="flex-1 lg:w-3/5 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-hidden border-b lg:border-r border-slate-200">
          <div className="relative group flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white rounded-xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg transition-all"
                value={search}
                onChange={handleSearch}
              />
            </div>
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className={`px-3 md:px-4 rounded-xl shadow-sm border transition-all flex items-center justify-center ${showScanner ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
            >
              <Camera size={20} />
            </button>
          </div>

          {showScanner && (
            <div className="bg-white p-2 md:p-4 rounded-xl border border-slate-200 shadow-inner relative animate-in fade-in zoom-in-95">
              <div id="reader" className="overflow-hidden rounded-lg min-h-[200px]"></div>
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-all z-10"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {loading ? (
                <div className="col-span-full text-center py-10 md:py-20 text-slate-400 animate-pulse">Loading...</div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col bg-white rounded-xl p-2 md:p-3 shadow-sm border border-transparent hover:border-blue-400 hover:shadow-md active:scale-95 transition-all text-left group"
                  >
                    <div className="w-full h-24 md:h-32 bg-slate-50 mb-2 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="object-contain" />
                      ) : (
                        <div className="text-slate-300 font-bold text-3xl md:text-4xl select-none group-hover:text-blue-200 transition-colors uppercase">{product.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="font-semibold text-slate-700 truncate text-xs md:text-sm mb-0.5">{product.name}</div>
                    <div className="text-blue-600 font-bold text-sm md:text-lg">₹{product.sellingPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-end">
                      <span className="truncate">Stock: {product.stockQuantity}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-400">No products</div>
              )}
            </div>
          </div>
        </section>

        {/* Right Side - Cart & Billing */}
        <section id="cart-section" className="w-full lg:w-2/5 flex flex-col bg-white shadow-xl overflow-hidden lg:h-full max-h-[50vh] lg:max-h-none">
          {/* Cart Header */}
          <div className="p-3 md:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-600 md:hidden" />
              <ShoppingCart size={22} className="text-blue-600 hidden md:block" />
              <h2 className="font-bold text-base md:text-lg text-slate-700">Cart ({cart.length})</h2>
            </div>
            <button 
              onClick={clearCart}
              className="text-red-500 hover:bg-red-50 p-1.5 md:p-2 rounded-lg transition-colors group"
            >
              <Trash2 size={18} className="md:w-5 md:h-5" />
            </button>
          </div>

          {/* Customer Selection attached to Cart Section */}
          <div className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 bg-white shrink-0">
            {customer ? (
              <div className="flex justify-between items-center bg-indigo-50/50 p-2 md:p-3 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{customer.name}</div>
                    <div className="text-[10px] md:text-xs text-slate-500">Pts: <span className="font-bold text-indigo-600">{customer.loyaltyPoints}</span> | Cr: ₹{customer.creditBalance}</div>
                  </div>
                </div>
                <button onClick={() => setCustomer(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 md:py-2.5 bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 font-medium rounded-xl transition-all text-sm group"
              >
                <Plus size={16} className="group-hover:scale-110 transition-transform" />
                <span>Add Customer for Loyalty</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {cart.map((item: CartItem) => (
                  <div key={item.id} className="p-3 md:p-4 hover:bg-slate-50/50 transition-colors flex gap-3 md:gap-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm md:text-base truncate">{item.name}</div>
                      <div className="text-xs md:text-sm text-slate-500 flex items-center gap-1.5">
                         <span>₹{item.sellingPrice.toFixed(2)}</span>
                         <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                         <span className="truncate">{item.category?.name || 'General'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 md:p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 md:w-8 h-6 md:h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-500"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-6 md:w-10 text-center font-bold text-xs md:text-base text-slate-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 md:w-8 h-6 md:h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-600"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="font-bold text-slate-900 text-xs md:text-base">₹{(item.sellingPrice * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300 opacity-60">
                 <ShoppingCart size={40} strokeWidth={1} className="mb-2" />
                 <p className="text-sm font-medium">Cart is empty</p>
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="p-4 md:p-6 bg-slate-900 text-white rounded-t-2xl md:rounded-t-3xl shadow-2xl shrink-0">
            <div className="space-y-2 mb-4 md:mb-6">
              <div className="flex justify-between text-xs md:text-sm text-slate-400">
                <span>Total Items</span>
                <span className="text-white font-bold">{cart.length}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm text-slate-400">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm text-slate-400">
                <span>Tax (GST)</span>
                <span>₹{taxTotal.toFixed(2)}</span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-xs md:text-sm text-green-400 font-medium">
                  <span>Loyalty Discount ({appliedPoints} pts)</span>
                  <span>- ₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-slate-800 my-2"></div>
              <div className="flex justify-between items-end">
                <span className="text-sm md:text-lg font-bold text-blue-400">Total</span>
                <div className="text-right">
                  <div className="text-2xl md:text-4xl font-black text-white tracking-tight">₹{grandTotal.toFixed(2)}</div>
                  {customer && (
                    <div className="text-[10px] text-indigo-300 mt-1">Earn: +{Math.floor(grandTotal / 100)} pts</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <button 
                onClick={() => setIsRedeemModalOpen(true)}
                className="py-3 md:py-4 col-span-1 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold rounded-xl md:rounded-2xl text-xs flex flex-col items-center justify-center transition-all disabled:opacity-50"
                disabled={cart.length === 0 || !customer || customer.loyaltyPoints === 0}
              >
                <span>Redeem</span>
                <span className="text-[10px] font-normal opacity-80">Points</span>
              </button>
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="py-3 md:py-4 col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl md:rounded-2xl text-sm md:text-base shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={cart.length === 0}
              >
                <CreditCard size={18} /> PAY NOW
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Cart Button for Mobile */}
      {cart.length > 0 && (
        <button 
          onClick={() => document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="lg:hidden fixed bottom-6 right-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-2xl animate-bounce"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600">
              {cart.length}
            </span>
          </div>
        </button>
      )}

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

      {isCustomerModalOpen && (
        <CustomerSelectionModal 
          onClose={() => setIsCustomerModalOpen(false)}
          onSelect={(c: any) => {
            setCustomer(c);
            setIsCustomerModalOpen(false);
          }}
        />
      )}

      {isRedeemModalOpen && (
        <RedeemPointsModal onClose={() => setIsRedeemModalOpen(false)} />
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
