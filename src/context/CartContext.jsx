import { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast as sonnerToast } from 'sonner';
import {
  addToCart as addToCartAction,
  updateQuantity as updateQuantityAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
  setCartOpen,
  clearToast
} from '../store/slices/cartSlice';

// KEEP THE CONTEXT FOR BACKWARD COMPATIBILITY
// Ideally, components should migrate to useCart completely, but this context provider
// effectively bridges the old API to the new Redux store.
const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const dispatch = useDispatch();
  const { items: cartItems, isOpen: isCartOpen, toast } = useSelector(state => state.cart);

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      // Trigger Sonner toast based on type
      if (toast.type === 'error') {
        sonnerToast.error(toast.message);
      } else if (toast.type === 'success') {
        sonnerToast.success(toast.message);
      } else {
        sonnerToast(toast.message);
      }

      // Clear redux state immediately as Sonner handles the visibility timer
      dispatch(clearToast());
    }
  }, [toast, dispatch]);

  // --- Mapped Actions ---

  const addToCart = (product, quantity = 1) => {
    dispatch(addToCartAction({ product, quantity }));
  };

  const updateQuantity = (productId, newQuantity) => {
    dispatch(updateQuantityAction({ productId, quantity: newQuantity }));
  };

  const increaseQuantity = (productId) => {
    const item = cartItems.find(i => i.id === productId);
    if (item) {
      dispatch(updateQuantityAction({ productId, quantity: item.quantity + 1 }));
    }
  };

  const decreaseQuantity = (productId) => {
    const item = cartItems.find(i => i.id === productId);
    if (item) {
      dispatch(updateQuantityAction({ productId, quantity: item.quantity - 1 }));
    }
  };

  const removeFromCart = (productId) => {
    dispatch(removeFromCartAction(productId));
  };

  const clearCart = () => {
    dispatch(clearCartAction());
  };

  const toggleCart = () => {
    dispatch(setCartOpen(!isCartOpen));
  };

  const openCart = () => {
    dispatch(setCartOpen(true));
  };

  const closeCart = () => {
    dispatch(setCartOpen(false));
  };

  // --- Getters ---

  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartTotal = () => getCartSubtotal();

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Provide the exact same API as before
  const value = {
    cartItems,
    isCartOpen,
    toast,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    getCartSubtotal,
    getCartTotal,
    getCartItemsCount,
    toggleCart,
    openCart,
    closeCart,
    hideToast: () => dispatch(clearToast()),
    showToast: () => { } // Deprecated, handled by Redux state
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}