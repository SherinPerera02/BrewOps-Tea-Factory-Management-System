import React from 'react';

const Spinner = ({ size = 'medium', color = '#3b82f6' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-2 ${sizeClasses[size]}`}
        style={{ borderTopColor: color }}
      ></div>
    </div>
  );
};

export default Spinner;