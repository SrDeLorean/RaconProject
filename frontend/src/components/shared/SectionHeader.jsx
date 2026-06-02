import React from 'react';

export default function SectionHeader({ 
  title, 
  titleHighlight, 
  description, 
  actions 
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-border/20 mb-6 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black uppercase text-foreground tracking-tight leading-none">
          {title}
          {titleHighlight && (
            <>
              {' '}
              <span className="text-glow-red text-red-500">{titleHighlight}</span>
            </>
          )}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground font-sans max-w-xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
