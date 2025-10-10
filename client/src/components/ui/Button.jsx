import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ children, variant = 'default', size = 'default', onClick, className }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
  const variants = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
    ghost: 'hover:bg-gray-100',
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    icon: 'h-8 w-8',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'outline', 'ghost']),
  size: PropTypes.oneOf(['default', 'icon']),
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button;