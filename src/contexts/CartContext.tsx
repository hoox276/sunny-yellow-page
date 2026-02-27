import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItemVariation {
  groupName: string;
  optionName: string;
  priceModifier: number;
}

export interface CartItemAddon {
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  variations: CartItemVariation[];
  addons: CartItemAddon[];
  notes: string;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  discount: number;
  setDiscount: (d: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode("");
    setDiscount(0);
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const variationExtra = item.variations.reduce((s, v) => s + v.priceModifier, 0);
    const addonExtra = item.addons.reduce((s, a) => s + a.price, 0);
    return sum + (item.unitPrice + variationExtra + addonExtra) * item.quantity;
  }, 0);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalItems, couponCode, setCouponCode, discount, setDiscount }}
    >
      {children}
    </CartContext.Provider>
  );
}
