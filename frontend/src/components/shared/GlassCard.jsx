import React from 'react';

export default function GlassCard({ 
  children, 
  className = '', 
  padding = 'p-6',
  variant = 'default', // 'default' | 'elevated' | 'interactive' | 'stat'
  withGlow = false
}) {
  
  const baseStyles = "glass-card relative overflow-hidden transition-all duration-300 rounded-2xl";
  
  const variants = {
    default: "border-border/50 bg-card/40 backdrop-blur-2xl shadow-xl",
    elevated: "border-border bg-card/60 backdrop-blur-2xl shadow-2xl hover:translate-y-[-4px]",
    interactive: "border-border/40 bg-card/30 backdrop-blur-2xl shadow-lg hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(232,0,29,0.08)] hover:translate-y-[-4px] cursor-pointer active:scale-[0.99]",
    stat: "border-border/50 bg-card/50 backdrop-blur-2xl shadow-lg hover:border-red-500/20"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      
      {/* Resplandor táctico opcional */}
      {withGlow && (
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
      )}
      
      {/* Decoración de scanline sutil para stat card */}
      {variant === 'stat' && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-t from-primary/20 to-transparent" />
      )}

      {/* Línea táctica superior sutil */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-40" />

      <div className={`relative z-10 ${padding}`}>
        {children}
      </div>
    </div>
  );
}
