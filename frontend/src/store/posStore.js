import { create } from 'zustand';

const usePOSStore = create((set, get) => ({
  cart: [],
  customer: null,
  loyaltyDiscount: 0,
  appliedPoints: 0,
  
  initSocket: () => {
    // No-op for now to prevent loops
    console.log('Socket initialization disabled in this build');
  },

  addToCart: (product, quantity = 1) => set((state) => {
    if (!product) return state;
    const existingItem = state.cart.find((item) => item.id === product.id);
    if (existingItem) {
      return {
        cart: state.cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      };
    }
    return { cart: [...state.cart, { ...product, quantity }] };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== productId),
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ),
  })),

  clearCart: () => set({ cart: [], loyaltyDiscount: 0, appliedPoints: 0 }),
  
  setCustomer: (customer) => set({ customer, loyaltyDiscount: 0, appliedPoints: 0 }),

  setLoyaltyDiscount: (discount, points) => set({ loyaltyDiscount: discount, appliedPoints: points }),
  
  getTotals: () => {
    const { cart, loyaltyDiscount } = get();
    if (!cart) return { subtotal: 0, taxTotal: 0, grandTotal: 0, loyaltyDiscount: 0 };
    
    const subtotal = cart.reduce(
      (acc, item) => acc + (item.sellingPrice || 0) * (item.quantity || 0),
      0
    );
    const taxTotal = cart.reduce(
      (acc, item) => acc + ((item.sellingPrice || 0) * ((item.gstRate || 0) / 100)) * (item.quantity || 0),
      0
    );
    const grandTotal = Math.max(0, subtotal + taxTotal - (loyaltyDiscount || 0));
    
    return { subtotal, taxTotal, grandTotal, loyaltyDiscount };
  },
}));

export default usePOSStore;
