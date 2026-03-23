import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative group">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-offset-0 transition-all duration-300 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400'
          } ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${className} placeholder:text-gray-400 font-medium`}
          {...props}
        />

        {/* Focus Indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-center scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 ${error ? 'from-red-500 to-rose-500' : ''}`}></div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in-up">
          <span className="mr-1">⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;
