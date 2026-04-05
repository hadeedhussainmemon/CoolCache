import React from 'react';

const Skeleton = ({
    className = '',
    variant = 'text', // text, rectangular, circular
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 rounded';

    const variantClasses = {
        text: 'h-4 w-full rounded',
        rectangular: 'rounded-xl',
        circular: 'rounded-full'
    };

    const style = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
