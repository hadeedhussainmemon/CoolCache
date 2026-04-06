import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const fetchProductFn = async ({ queryKey }) => {
    const [_, idOrSlug] = queryKey;
    if (!idOrSlug) return null;

    // Remove trailing slash from base if present
    const base = API_BASE_URL.replace(/\/$/, '');
    const res = await fetch(`${base}/api/products/${idOrSlug}`);

    if (!res.ok) {
        throw new Error('Failed to load product');
    }
    return res.json();
};

export const useProductQuery = (idOrSlug) => {
    return useQuery({
        queryKey: ['product', idOrSlug],
        queryFn: fetchProductFn,
        enabled: !!idOrSlug,
        staleTime: 5 * 60 * 1000, // 5 minutes fresh
        placeholderData: (previousData) => previousData, // Keep showing old data while fetching
    });
};
