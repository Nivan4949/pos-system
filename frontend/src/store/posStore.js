import { create } from 'zustand';

import { io } from 'socket.io-client';

const socketUrl = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}` 
  : '';

const socket = io(socketUrl, {
  transports: ['polling', 'websocket'],
  autoConnect: true,
  reconnectionAttempts: 5
});

const usePOSStore = create((set, get) => ({
  cart: [],
  customer: null,
  loyaltyDiscount: 0,
  appliedPoints: 0,
  
  initSocket: () => {
    socket.on('connect', () => console.log('Socket connected successfully'));
    socket.on('connect_error', (err) => console.log('Socket connection error:', err.message));

    socket.on('INVENTORY_UPDATE', ({ items }) => {
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

  clearCart: () => set({ cart: [], loyaltyDiscount: 0, appliedPoints: 0 }),
  
  setCustomer: (customer) => set({ customer, loyaltyDiscount: 0, appliedPoints: 0 }),

  setLoyaltyDiscount: (discount, points) => set({ loyaltyDiscount: discount, appliedPoints: points }),
  
  getTotals: () => {
    const { cart, loyaltyDiscount } = get();
    const subtotal = cart.reduce(
      (acc, item) => acc + item.sellingPrice * item.quantity,
      0
    );
    const taxTotal = cart.reduce(
      (acc, item) => acc + (item.sellingPrice * (item.gstRate / 100)) * item.quantity,
      0
    );
    const grandTotal = Math.max(0, subtotal + taxTotal - loyaltyDiscount);
    
    return { subtotal, taxTotal, grandTotal, loyaltyDiscount };
  },
}));

export default usePOSStore;
