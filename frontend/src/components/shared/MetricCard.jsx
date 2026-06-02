import React from 'react';

export default function MetricCard({ 
  value, 
  label, 
  className = '' 
}) {
  return (
    <div className={`bg-card/40 border border-border/50 p-4 rounded-xl text-center space-y-1 relative overflow-hidden group hover:border-red-500/25 transition-all shadow-md ${className}`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/2 rounded-full blur-xl pointer-events-none" />
      <span className="font-display text-4xl md:text-5xl font-black bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground tracking-wider block leading-none">
        {value}
      </span>
      <span className="text-[9px] text-red-500 font-condensed font-black tracking-widest uppercase block mt-1">
        {label}
      </span>
    </div>
  );
}
