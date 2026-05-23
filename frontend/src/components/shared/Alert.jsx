import React, { useEffect, useState } from 'react';

export default function Alert({ 
  children, 
  variant = 'neutral', 
  onClose, 
  className = '',
  autoCloseTime = 4000 // 4 segundos por defecto
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoCloseTime && onClose) {
      const timer = setTimeout(() => handleClose(), autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoCloseTime]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Espera a que termine la animación para desmontar
  };

  const variants = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
    error: 'bg-destructive/10 border-destructive/30 text-destructive-foreground shadow-[0_8px_30px_hsla(var(--destructive),0.2)]',
    neutral: 'bg-white/5 border-white/10 text-foreground shadow-xl',
  };

  const icons = {
    success: (
      <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
        <span className="absolute w-full h-full bg-emerald-400/20 rounded-full animate-ping"></span>
        <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>
      </div>
    ),
    error: (
      <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
        <div className="w-2 h-2 bg-destructive rounded-full shadow-[0_0_8px_hsla(var(--destructive),1)] animate-pulse"></div>
      </div>
    ),
    neutral: (
      <div className="w-6 h-6 shrink-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
      </div>
    )
  };

  return (
    <div 
      className={`
        flex items-center gap-4 p-4 border backdrop-blur-xl rounded-lg
        transition-all duration-300 ease-in-out
        ${isClosing ? 'opacity-0 translate-y-[-10px] scale-95' : 'opacity-100 translate-y-0 scale-100'}
        ${variants[variant]} 
        ${className}
      `}
      role="alert"
    >
      {icons[variant]}
      
      <div className="flex-1 font-sans text-sm font-medium tracking-wide">
        {children}
      </div>

      {onClose && (
        <button 
          onClick={handleClose}
          className="shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"
        >
          ✕
        </button>
      )}
    </div>
  );
}