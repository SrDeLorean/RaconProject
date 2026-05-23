import React from 'react';
import Button from './Button';

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
    <div className="flex flex-col gap-6 w-full">
      
      {/* 🌟 1. SECCIÓN SUPERIOR: Título y Botón (Responsive) */}
      {/* En móviles (flex-col), en tablets/PC (sm:flex-row) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-wide text-foreground uppercase">
            {title}
          </h2>
          {description && (
            <p className="text-sm font-medium text-muted-foreground mt-1">
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

      {/* 🌟 2. SECCIÓN DE PESTAÑAS: Scroll horizontal oculto en móviles */}
      {tabs.length > 0 && (
        <div className="w-full border-b border-border/50 overflow-x-auto custom-scrollbar pb-px">
          <div className="flex gap-2 sm:gap-6 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 py-3 px-3 sm:px-1 text-sm font-bold transition-all duration-300 border-b-2 relative
                    ${isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/50'
                    }
                  `}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}