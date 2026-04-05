import React from 'react';
import Skeleton from '../UI/Skeleton';

const ProductDetailSkeleton = () => {
    return (
        <div className="min-h-screen pt-20 pb-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Left Column: Image Skeleton */}
                    <div className="w-full aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <Skeleton variant="rectangular" className="w-full h-full" />
                    </div>

                    {/* Right Column: Key Details */}
                    <div className="space-y-8 mt-4 lg:mt-0">
                        <div>
                            <Skeleton variant="text" width="20%" className="mb-2" /> {/* Category Label */}
                            <Skeleton variant="text" width="80%" height="3rem" className="mb-4" /> {/* Big Title */}
                            <Skeleton variant="text" width="40%" height="2rem" /> {/* Price */}
                        </div>

                        <div className="space-y-3">
                            <Skeleton variant="text" width="30%" className="mb-2" /> {/* Color Label */}
                            <div className="flex gap-3">
                                <Skeleton variant="circular" width="3rem" height="3rem" />
                                <Skeleton variant="circular" width="3rem" height="3rem" />
                                <Skeleton variant="circular" width="3rem" height="3rem" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Skeleton variant="rectangular" className="flex-1 h-12 md:h-14 rounded-xl" /> {/* Add to Cart */}
                            <Skeleton variant="rectangular" className="flex-1 h-12 md:h-14 rounded-xl" /> {/* Buy Now */}
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <Skeleton variant="text" width="40%" height="1.5rem" className="mb-2" />
                            <Skeleton variant="text" width="100%" />
                            <Skeleton variant="text" width="95%" />
                            <Skeleton variant="text" width="90%" />
                            <Skeleton variant="text" width="80%" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailSkeleton;
