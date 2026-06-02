import React from 'react';

export default function ActionBar({ 
  children, 
  className = '' 
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border border-border/50 bg-card/25 backdrop-blur-md p-4 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}
