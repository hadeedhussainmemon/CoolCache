'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <WishlistProvider>
            <Toaster richColors position="bottom-right" closeButton theme="light" />
            {children}
          </WishlistProvider>
        </CartProvider>
      </QueryClientProvider>
    </Provider>
  );
}
