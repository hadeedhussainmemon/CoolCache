import { createSlice } from '@reduxjs/toolkit';

const loadWishlist = () => {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem('coolcacheWishlist');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const initialState = {
    items: loadWishlist(),
    toast: null
};

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        toggleWishlist: (state, action) => {
            const product = action.payload;
            // Use string ID comparison for safety
            const existsIndex = state.items.findIndex(item => String(item.id) === String(product.id));

            if (existsIndex >= 0) {
                state.items.splice(existsIndex, 1);
                state.toast = { message: `${product.title} removed from wishlist`, type: 'info' };
            } else {
                state.items.push(product);
                state.toast = { message: `${product.title} added to wishlist!`, type: 'success' };
            }
            if (typeof window !== 'undefined') {
                localStorage.setItem('coolcacheWishlist', JSON.stringify(state.items));
            }
        },
        clearWishlist: (state) => {
            state.items = [];
            state.toast = { message: 'Wishlist cleared', type: 'info' };
            if (typeof window !== 'undefined') {
                localStorage.setItem('coolcacheWishlist', JSON.stringify([]));
            }
        },
        clearToast: (state) => {
            state.toast = null;
        }
    }
});

export const { toggleWishlist, clearWishlist, clearToast } = wishlistSlice.actions;
export default wishlistSlice.reducer;
