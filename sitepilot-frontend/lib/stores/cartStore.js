import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  isOpen: false,
  items: [
    {
      id: "prod-1",
      title: "SitePilot Pro Wireless Headphones",
      price: 2499,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      quantity: 1,
      variant: "Midnight Black",
    },
  ],
  currency: "₹",

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + (product.quantity || 1) }
              : item
          ),
          isOpen: true,
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: product.id || `prod-${Date.now()}`,
            title: product.title || "Custom Product",
            price: Number(product.price) || 999,
            image: product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
            quantity: product.quantity || 1,
            variant: product.variant || "Standard",
          },
        ],
        isOpen: true,
      };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  updateQuantity: (id, delta) => {
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotalCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
