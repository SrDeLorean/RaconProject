import React from 'react';
import Button from '../ui/Button';

export default function CrudHeader({
  title,
  description,
  buttonText,
  onAddClick,
  tabs = [],
  activeTab,
  onTabChange
}) {
  return (
    <div className="flex flex-col gap-6 w-full relative mb-4">
      {/* Luz de fondo sutil (Ambient Glow) */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-primary/5 blur-[80px] -z-10 rounded-full pointer-events-none"></div>

      {/* 🌟 1. SECCIÓN SUPERIOR: Título y Botón (Responsive) */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/40 shadow-lg rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        {/* Acento lateral luminiscente */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>

        <div>
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-wide text-foreground uppercase drop-shadow-[0_0_10px_hsla(var(--primary),0.3)] flex items-center gap-3">
            {title}
          </h2>
          {description && (
            <p className="text-sm font-medium text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {buttonText && onAddClick && (
          <Button
            onClick={onAddClick}
            className="w-full sm:w-auto shrink-0 shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:shadow-[0_0_20px_hsla(var(--primary),0.5)] transition-all"
          >
            {buttonText}
          </Button>
        )}
      </div>

      {/* 🌟 2. SECCIÓN DE PESTAÑAS: Premium Glass Tabs */}
      {tabs.length > 0 && (
        <div className="w-full bg-card/30 backdrop-blur-md border border-border/30 rounded-xl overflow-hidden shadow-sm">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto custom-scrollbar px-2 py-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex items-center gap-2.5 py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg relative overflow-hidden shrink-0
                    ${isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_10px_hsla(var(--primary),0.1)]'
                      : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-primary rounded-t-full shadow-[0_0_8px_hsla(var(--primary),0.8)]"></div>
                  )}
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}