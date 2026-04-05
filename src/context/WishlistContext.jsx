import { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast as sonnerToast } from 'sonner';
import {
  toggleWishlist as toggleWishlistAction,
  clearWishlist as clearWishlistAction,
  clearToast
} from '../store/slices/wishlistSlice';

const WishlistContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const dispatch = useDispatch();
  const { items: wishlistItems, toast } = useSelector(state => state.wishlist);

  useEffect(() => {
    if (toast) {
      if (toast.type === 'error') {
        sonnerToast.error(toast.message);
      } else if (toast.type === 'success') {
        sonnerToast.success(toast.message);
      } else {
        sonnerToast(toast.message);
      }

      dispatch(clearToast());
    }
  }, [toast, dispatch]);

  const addToWishlist = (product) => {
    // Redux toggle handles checking if exists, but strictly speaking we only have toggle in Redux for now.
    // If we need explicit add, we can check here.
    if (!isInWishlist(product.id)) {
      dispatch(toggleWishlistAction(product));
    }
  };

  const removeFromWishlist = (productId) => {
    // The Redux toggle action removes it if it exists
    const product = wishlistItems.find(i => String(i.id) === String(productId));
    if (product) {
      dispatch(toggleWishlistAction(product));
    }
  };

  const toggleWishlist = (product) => {
    dispatch(toggleWishlistAction(product));
  };

  const clearWishlist = () => {
    dispatch(clearWishlistAction());
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => String(item.id) === String(productId));
  };

  const value = {
    wishlistItems,
    toast,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    showToast: () => { } // Handled by Redux
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
