import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  padding = 'p-6',
  withGlow = false // Si es true, añade un resplandor de fondo
}) {
  return (
    <div className={`glass-card relative overflow-hidden ${className}`}>
      {/* Resplandor decorativo opcional para tarjetas destacadas */}
      {withGlow && (
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[50px] pointer-events-none"></div>
      )}
      
      {/* Línea superior táctica sutil */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50"></div>
      
      <div className={`relative z-10 ${padding}`}>
        {children}
      </div>
    </div>
  );
}