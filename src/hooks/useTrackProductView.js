import { useEffect } from 'react';

// Hook to track product views
export function useTrackProductView(productId, productData) {
    useEffect(() => {
        if (!productId || !productData) return;

        try {
            const viewHistory = JSON.parse(localStorage.getItem('coolcacheViewHistory') || '[]');

            // Add current product to history (max 50 items)
            const updated = [
                {
                    id: productId,
                    title: productData.title,
                    category: productData.category,
                    viewedAt: Date.now()
                },
                ...viewHistory.filter(item => item.id !== productId)
            ].slice(0, 50);

            localStorage.setItem('coolcacheViewHistory', JSON.stringify(updated));
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    }, [productId, productData]);
}

export default useTrackProductView;
