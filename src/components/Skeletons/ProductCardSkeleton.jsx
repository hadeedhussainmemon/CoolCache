import React from 'react';
import Skeleton from '../UI/Skeleton';

const ProductCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 h-full flex flex-col">
            {/* Image Hologram */}
            <Skeleton variant="rectangular" className="w-full aspect-[4/5] md:aspect-square mb-3 rounded-xl" />

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                    <Skeleton variant="text" width="40%" className="mb-1" /> {/* Category */}
                    <Skeleton variant="text" width="90%" height="1.25rem" /> {/* Title */}
                </div>

                <div className="flex justify-between items-center mt-2">
                    <Skeleton variant="text" width="30%" height="1.1rem" /> {/* Price */}
                    <Skeleton variant="circular" width="2rem" height="2rem" /> {/* Add Button */}
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
