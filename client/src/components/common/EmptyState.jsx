import React from 'react';
import { Home, Search, FileX, Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}) => {
    const defaultIcons = {
        search: Search,
        listings: Home,
        general: FileX,
        inbox: Inbox
    };

    const IconComponent = Icon || defaultIcons[variant] || defaultIcons.general;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative">
                {/* Animated Background Circle */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full animate-pulse opacity-50"></div>

                {/* Icon */}
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6 mb-6">
                    <IconComponent className="w-16 h-16 text-blue-500" strokeWidth={1.5} />
                </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-600 text-center max-w-md mb-6">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <Button onClick={onAction} size="md">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
