import React from 'react';

/**
 * Spinner Component - High-quality gaming/eSports circular loader.
 * Uses double concentric rings spinning in opposite directions for sizes md, lg, and xl.
 */
export default function Spinner({ size = 'md', className = '', variant = 'primary' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
    xl: 'border-4'
  };

  const variants = {
    primary: 'border-primary',
    destructive: 'border-destructive',
    muted: 'border-muted-foreground/30',
    white: 'border-white',
  };

  const chosenSize = sizes[size] || sizes.md;
  const chosenBorder = borderSizes[size] || borderSizes.md;
  const chosenVariant = variants[variant] || variants.primary;

  // Single clean ring for small inputs/buttons
  if (size === 'sm') {
    return (
      <div className={`relative ${chosenSize} ${className}`}>
        <div className={`w-full h-full rounded-full ${chosenBorder} ${chosenVariant} border-t-transparent animate-spin`} />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${chosenSize} ${className}`}>
      {/* Outer Ring - Clockwise Rotation */}
      <div className={`absolute inset-0 rounded-full ${chosenBorder} ${chosenVariant} border-t-transparent border-b-transparent animate-[spin_1.2s_linear_infinite]`} />
      
      {/* Inner Ring - Counter-Clockwise Rotation */}
      <div className={`absolute w-[70%] h-[70%] rounded-full ${chosenBorder} border-dashed border-destructive/50 animate-[rotate-counter_1.8s_linear_infinite]`} />
      
      {/* Core Dot - Pulsating */}
      <div className="absolute w-[20%] h-[20%] rounded-full bg-primary animate-pulse" />
    </div>
  );
}