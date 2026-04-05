import React from 'react';
import Skeleton from '../UI/Skeleton';

const PageSkeleton = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Fake Navbar */}
            <div className="h-16 border-b border-gray-100 flex items-center px-4 md:px-8 justify-between">
                <Skeleton variant="rectangular" width="120px" height="32px" />
                <div className="hidden md:flex gap-6">
                    <Skeleton variant="text" width="60px" />
                    <Skeleton variant="text" width="60px" />
                    <Skeleton variant="text" width="60px" />
                </div>
                <div className="flex gap-3">
                    <Skeleton variant="circular" width="32px" height="32px" />
                    <Skeleton variant="circular" width="32px" height="32px" />
                </div>
            </div>

            {/* Fake Hero / Content Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                <div className="space-y-2 text-center max-w-2xl mx-auto">
                    <Skeleton variant="text" height="3rem" className="mx-auto" />
                    <Skeleton variant="text" width="60%" className="mx-auto" />
                </div>

                {/* Fake Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton variant="rectangular" className="w-full aspect-square rounded-2xl" />
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="40%" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageSkeleton;
