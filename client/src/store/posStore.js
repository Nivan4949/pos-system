import { create } from 'zustand';

import { io } from 'socket.io-client';

const socket = io(); // Automatically connects to the current host and port

const usePOSStore = create((set, get) => ({
  cart: [],
  customer: null,
  
  initSocket: () => {
    socket.on('INVENTORY_UPDATE', ({ items }) => {
      // Logic to update local product stock if needed
      // Most products are fetched fresh, but we could update state here
      console.log('Real-time inventory update received:', items);
    });

    socket.on('ORDER_CREATED', (order) => {
      console.log('New order synced from another terminal:', order.invoiceNo);
    });
  },

  addToCart: (product, quantity = 1) => set((state) => {
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

  clearCart: () => set({ cart: [] }),
  
  setCustomer: (customer) => set({ customer }),
  
  getTotals: () => {
    const { cart } = get();
    const subtotal = cart.reduce(
      (acc, item) => acc + item.sellingPrice * item.quantity,
      0
    );
    const taxTotal = cart.reduce(
      (acc, item) => acc + (item.sellingPrice * (item.gstRate / 100)) * item.quantity,
      0
    );
    const grandTotal = subtotal + taxTotal;
    
    return { subtotal, taxTotal, grandTotal };
  },
}));

export default usePOSStore;
