'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuth } from './auth-provider';

export interface CartItemType {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSlug: string;
  brand?: string | null;
  unit: string;
  imageUrl?: string | null;
  isMedicine: boolean;
  isPrescriptionRequired: boolean;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  stockAvailable: number;
  storeName?: string;
  pharmacyName?: string;
}

export interface CartData {
  id: string;
  items: CartItemType[];
  itemCount: number;
  subtotal: number;
  hasPrescriptionItems: boolean;
}

interface CartContextType {
  cart: CartData | null;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiGet<CartData>('/cart');
      setCart(data);
    } catch (err) {
      console.warn('Could not fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity = 1, variantId?: string) => {
    if (!isAuthenticated) {
      // Redirect to login or prompt
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setIsLoading(true);
    try {
      const updated = await apiPost<CartData>('/cart/items', { productId, quantity, variantId });
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const updated = await apiPatch<CartData>(`/cart/items/${itemId}`, { quantity });
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const updated = await apiDelete<CartData>(`/cart/items/${itemId}`);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const updated = await apiDelete<CartData>('/cart');
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
