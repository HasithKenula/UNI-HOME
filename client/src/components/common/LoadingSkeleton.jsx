import React from 'react';

const LoadingSkeleton = ({ type = 'card', count = 1, className = '' }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className={`rounded-xl border border-gray-200 bg-white p-4 animate-pulse ${className}`}>
                        <div className="h-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg mb-3 bg-shimmer"></div>
                        <div className="space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className={`rounded-xl border border-gray-200 bg-white p-5 animate-pulse ${className}`}>
                        <div className="flex gap-4">
                            <div className="h-24 w-32 bg-gray-200 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    </div>
                );

            case 'detail':
                return (
                    <div className={`animate-pulse ${className}`}>
                        <div className="h-80 bg-gray-200 rounded-2xl mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className={`space-y-2 animate-pulse ${className}`}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 10}%` }}></div>
                        ))}
                    </div>
                );

            default:
                return (
                    <div className={`h-20 bg-gray-200 rounded-lg animate-pulse ${className}`}></div>
                );
        }
    };

    return (
        <>
            {[...Array(count)].map((_, index) => (
                <div key={index}>{renderSkeleton()}</div>
            ))}
        </>
    );
};

export default LoadingSkeleton;
