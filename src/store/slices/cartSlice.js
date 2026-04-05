import { createSlice } from '@reduxjs/toolkit';

// Helper to load/save from localStorage
const loadCart = () => {
    try {
        const saved = localStorage.getItem('coolcacheCart');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
};

const initialState = {
    items: loadCart(),
    isOpen: false,
    toast: null, // { message, type }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const { product, quantity = 1 } = action.payload;
            // Identity: id + selectedOptions
            const productKey = `${product.id}::${JSON.stringify(product.selectedOptions || {})}`;

            const existingIndex = state.items.findIndex(
                item => `${item.id}::${JSON.stringify(item.selectedOptions || {})}` === productKey
            );

            if (existingIndex >= 0) {
                state.items[existingIndex].quantity += quantity;
                state.toast = { message: `Updated ${product.title} quantity`, type: 'success' };
            } else {
                state.items.push({ ...product, quantity });
                state.toast = { message: `${product.title} added to cart!`, type: 'success' };
            }

            // Persist side-effect (could be middleware, but doing inline for simplicity as per user context style)
            localStorage.setItem('coolcacheCart', JSON.stringify(state.items));
        },
        updateQuantity: (state, action) => {
            const { productId, quantity } = action.payload;
            if (quantity < 1) {
                // Remove logic if < 1
                const item = state.items.find(i => i.id === productId);
                if (item) state.toast = { message: `${item.title} removed from cart`, type: 'info' };
                state.items = state.items.filter(i => i.id !== productId);
            } else {
                const item = state.items.find(i => i.id === productId);
                if (item) item.quantity = quantity;
            }
            localStorage.setItem('coolcacheCart', JSON.stringify(state.items));
        },
        removeFromCart: (state, action) => {
            const productId = action.payload;
            const item = state.items.find(i => i.id === productId);
            if (item) {
                state.toast = { message: `${item.title} removed from cart`, type: 'info' };
                state.items = state.items.filter(i => i.id !== productId);
                localStorage.setItem('coolcacheCart', JSON.stringify(state.items));
            }
        },
        clearCart: (state) => {
            state.items = [];
            state.toast = { message: 'Cart cleared', type: 'info' };
            localStorage.setItem('coolcacheCart', JSON.stringify([]));
        },
        toggleCart: (state) => {
            state.isOpen = !state.isOpen;
        },
        setCartOpen: (state, action) => {
            state.isOpen = action.payload;
        },
        clearToast: (state) => {
            state.toast = null;
        }
    }
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, toggleCart, setCartOpen, clearToast } = cartSlice.actions;
export default cartSlice.reducer;
