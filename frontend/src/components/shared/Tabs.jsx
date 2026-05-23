import React from 'react';

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex space-x-1 p-1 bg-background/60 backdrop-blur-md border border-border/50 rounded-lg shrink-0 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 whitespace-nowrap
              ${isActive 
                ? 'bg-card text-primary shadow-sm border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span className="font-sans uppercase tracking-wider text-xs">{tab.label}</span>
            
            {/* Indicador inferior brillante si está activo */}
            {isActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full shadow-[0_0_10px_hsla(var(--primary),0.8)]"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}