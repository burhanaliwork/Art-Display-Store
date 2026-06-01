import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Painting } from '@workspace/api-client-react/src/generated/api.schemas';

export interface CartItem {
  painting: Painting;
  selectedSize: string;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (painting: Painting, size: string, price: number) => void;
  removeFromCart: (paintingId: number, size: string) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('art_gallery_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('art_gallery_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (painting: Painting, size: string, price: number) => {
    setItems(prev => {
      // Check if already in cart with same size
      const exists = prev.find(item => item.painting.id === painting.id && item.selectedSize === size);
      if (exists) return prev;
      return [...prev, { painting, selectedSize: size, price }];
    });
  };

  const removeFromCart = (paintingId: number, size: string) => {
    setItems(prev => prev.filter(item => !(item.painting.id === paintingId && item.selectedSize === size)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
