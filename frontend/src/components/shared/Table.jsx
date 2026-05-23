import React from 'react';

export default function Table({ columns, data, onRowClick }) {
  return (
    // 🌟 1. Contenedor con Glassmorphism y Scrollbar fina
    <div className="glass-card w-full overflow-x-auto custom-scrollbar relative">
      <table className="w-full text-left border-collapse">
        
        {/* 🌟 2. Cabecera Táctica (Tipografía Rajdhani) */}
        <thead className="bg-card/60 backdrop-blur-md border-b border-border/50">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                className="py-4 px-6 text-technical text-muted-foreground whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        
        {/* 🌟 3. Cuerpo de la tabla con divisores sutiles */}
        <tbody className="divide-y divide-border/20">
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                // 🌟 4. Efecto hover moderno: ligero brillo y movimiento lateral si es clickeable
                className={`transition-all duration-300 relative z-10 group
                  ${onRowClick 
                    ? 'cursor-pointer hover:bg-white/5 hover:translate-x-1' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="py-4 px-6 text-sm text-foreground/90 whitespace-nowrap font-sans">
                    {/* Permite renderizar componentes personalizados o texto plano */}
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            /* 🌟 5. Estado Vacío Integrado (Más elegante) */
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
                  <svg className="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="font-sans text-sm tracking-wide">No hay datos disponibles para mostrar.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}