import React from 'react';

interface SkeletonLoaderProps {
    className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = 'h-4' }) => {
    return (
        <div className={`skeleton-loader ${className}`} />
    );
};

export const StatCardSkeleton: React.FC = () => (
    <div className="flex items-center space-x-3">
        <SkeletonLoader className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-3 w-20" />
            <SkeletonLoader className="h-5 w-12" />
        </div>
    </div>
);

export const ActivityItemSkeleton: React.FC = () => (
    <div className="flex items-center space-x-3 py-2 border-b border-dark-700/50">
        <SkeletonLoader className="w-5 h-5 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
           <SkeletonLoader className="h-4 w-4/5" />
        </div>
        <SkeletonLoader className="h-3 w-16" />
    </div>
);

export default SkeletonLoader;
