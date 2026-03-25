import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]';

  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-300 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary border border-gray-200 text-bodytext hover:bg-primary-50 focus:ring-primary-200',
    outline: 'border-2 border-accent-500 text-accent-700 hover:bg-accent-500 hover:text-white focus:ring-accent-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-200 shadow-sm hover:shadow-md',
    success: 'bg-accent-500 hover:bg-accent-600 text-white focus:ring-accent-200 shadow-sm hover:shadow-md',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
