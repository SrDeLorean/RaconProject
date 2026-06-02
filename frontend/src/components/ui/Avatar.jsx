import React, { useState } from 'react';

export default function Avatar({ src, name = 'Usuario', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  // Función para extraer iniciales (Ej: "Juan Perez" -> "JP")
  const getInitials = (fullName) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const backendBaseUrl = 'http://localhost:8000';
  const displaySrc = src
    ? (src.startsWith('http') ? src : `${backendBaseUrl}${src}`)
    : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-bold bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-600/20 shadow-sm transition-all ${sizes[size]} ${className}`}
    >
      {src && !imageError ? (
        <img
          src={displaySrc}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}