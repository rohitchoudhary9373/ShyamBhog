import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('shyam_bhog_cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error("Cart parse error", e);
      }
    }
    return [];
  });

  // Call sync on mount if cart has items
  useEffect(() => {
    if (cart.length > 0) {
      syncCart(cart);
    }
  }, []);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('shyam_bhog_cart', JSON.stringify(cart));
  }, [cart]);

  // Synchronize cart items with database to update prices and remove inactive/deleted items
  const syncCart = async (currentCart = cart) => {
    if (!currentCart || currentCart.length === 0) return;
    try {
      const ids = currentCart.map(i => i._id);
      const response = await API.post('/services/sync', { ids });
      if (response.data && response.data.success) {
        const backendItems = response.data.data;
        const backendItemsMap = new Map(backendItems.map(item => [item._id, item]));

        setCart(prev => {
          const updated = prev.map(item => {
            const backendItem = backendItemsMap.get(item._id);
            if (!backendItem || !backendItem.isActive) {
              return null; // Remove inactive or deleted service
            }
            return {
              ...item,
              ...backendItem, // update details like name, price, description, etc.
              quantity: item.quantity
            };
          }).filter(Boolean);
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to sync cart with backend:", err);
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: (i.quantity || 1) + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i._id !== id));
  };

  const updateQuantity = (id, q) => {
    if (q < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: q } : i));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const totalPrice = cart.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, syncCart }}>
      {children}
    </CartContext.Provider>
  );
};
