import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedFlavors?: string[];
  selectedWeight?: string | number;
  packItemFlavors?: Record<string, string[]>; // product_id -> array of flavors
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedFlavors?: string[], packItemFlavors?: Record<string, string[]>, selectedWeight?: string | number) => void;
  updateQuantity: (productId: string, quantity: number, selectedFlavors?: string[], packItemFlavors?: Record<string, string[]>, selectedWeight?: string | number) => void;
  removeItem: (productId: string, selectedWeight?: string | number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const lastAddedTime: Record<string, number> = {};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1, selectedFlavors = [], packItemFlavors = {}, selectedWeight) => {
        const now = Date.now();
        // Prevent double adds within 500ms
        const cacheKey = `${product.id}-${selectedWeight || 'default'}`;
        if (lastAddedTime[cacheKey] && now - lastAddedTime[cacheKey] < 500) {
          return;
        }
        lastAddedTime[cacheKey] = now;

        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id && String(item.selectedWeight || '') === String(selectedWeight || '')
          );

          if (existingItem) {
            const newQuantity = Math.min(existingItem.quantity + quantity, 10);
            // Append new flavors up to the new quantity
            const combinedFlavors = [...(existingItem.selectedFlavors || []), ...selectedFlavors].slice(0, newQuantity);
            
            return {
              items: state.items.map((item) =>
                item.product.id === product.id && String(item.selectedWeight || '') === String(selectedWeight || '')
                  ? { 
                      ...item, 
                      quantity: newQuantity,
                      selectedFlavors: combinedFlavors.length > 0 ? combinedFlavors : undefined,
                      packItemFlavors: Object.keys(packItemFlavors).length > 0 ? packItemFlavors : item.packItemFlavors
                    }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { 
              product, 
              quantity, 
              selectedFlavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
              packItemFlavors: Object.keys(packItemFlavors).length > 0 ? packItemFlavors : undefined,
              selectedWeight
            }],
          };
        });
      },

      updateQuantity: (productId: string, quantity: number, selectedFlavors?: string[], packItemFlavors?: Record<string, string[]>, selectedWeight?: string | number) => {
        if (quantity < 1) {
          get().removeItem(productId, selectedWeight);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.product.id === productId && String(item.selectedWeight || '') === String(selectedWeight || '')) {
              const newQty = Math.min(quantity, 10);
              let newFlavors = selectedFlavors || item.selectedFlavors || [];
              
              // Adjust flavors array to match new quantity
              if (newFlavors.length > 0) {
                if (newFlavors.length > newQty) {
                  newFlavors = newFlavors.slice(0, newQty);
                } else {
                  // If we need more flavors than we have, pad with the last one or first one
                  const padValue = newFlavors[newFlavors.length - 1] || "";
                  while (newFlavors.length < newQty) {
                    newFlavors.push(padValue);
                  }
                }
              }

              return { 
                ...item, 
                quantity: newQty,
                selectedFlavors: newFlavors.length > 0 ? newFlavors : undefined,
                packItemFlavors: packItemFlavors || item.packItemFlavors
              };
            }
            return item;
          }),
        }));
      },

      removeItem: (productId: string, selectedWeight?: string | number) => {
        set((state) => ({
          items: state.items.filter((item) => !(item.product.id === productId && String(item.selectedWeight || '') === String(selectedWeight || ''))),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => {
            let price = item.product.price;
            if (item.selectedWeight && (item.product as any).weight_prices) {
              const wp = (item.product as any).weight_prices.find((w: any) => String(w.weight) === String(item.selectedWeight));
              if (wp) {
                price = wp.price;
              }
            }
            return total + price * item.quantity;
          },
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "maison-cart",
    }
  )
);

// Sync across multiple tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "maison-cart") {
      useCart.persist.rehydrate();
    }
  });
}
