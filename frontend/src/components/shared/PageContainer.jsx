import React from 'react';

export default function PageContainer({ 
  children, 
  className = '', 
  withScanlines = false 
}) {
  return (
    <div className={`relative min-h-screen bg-background text-foreground overflow-hidden font-sans ${withScanlines ? 'animate-scanline' : ''} ${className}`}>
      

      
      {/* 2. Grid Táctico y Degradados Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-0 pointer-events-none" />

      {/* 3. Resplandores Ambientales Neón */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-primary/8 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[55vw] h-[55vh] bg-primary/6 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 4. Contenido Principal */}
      <div className="relative z-10 w-full min-h-screen pt-32 md:pt-40 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        {children}
      </div>

    </div>
  );
}
