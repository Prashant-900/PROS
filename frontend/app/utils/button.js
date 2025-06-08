import React from 'react';

const Button = ({ children, bgColor = 'bg-gray-800', textColor = 'text-white', className = '', ...props }) => {
  return (
    <button
      className={`border-3 active:opacity-70 border-gray-700 rounded-lg px-4 py-2 text-center font-medium ${bgColor} ${textColor} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
