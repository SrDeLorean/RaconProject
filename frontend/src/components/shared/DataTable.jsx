import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';

export default function DataTable({ 
  title,
  columns, 
  data = [], 
  onSearch, 
  searchPlaceholder = "Buscar...",
  actions,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
  totalRecords = 0,
  perPage = 10
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  // 🌟 AJUSTE LÓGICO: Si no hay registros, forzamos inicio y fin a 0
  const startRecord = totalRecords === 0 ? 0 : ((currentPage - 1) * perPage) + 1;
  const endRecord = totalRecords === 0 ? 0 : Math.min(currentPage * perPage, totalRecords);

  return (
    <div className="bg-card border border-border/50 rounded-xl flex flex-col w-full overflow-hidden relative shadow-sm font-sans">
      
      {/* Scanline decorativo si está cargando */}
      {isLoading && <div className="absolute inset-0 z-0 animate-scanline pointer-events-none"></div>}
      
      {/* ================= HEADER ================= */}
      <div className="p-5 border-b border-border/50 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between relative z-20">
        {title && (
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display font-bold tracking-wide text-foreground uppercase">{title}</h3>
            {isLoading && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="w-full sm:w-80">
            <Input 
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              icon={
                <svg className="w-5 h-5 text-muted-foreground opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          {actions && <div className="flex shrink-0 gap-2 w-full sm:w-auto">{actions}</div>}
        </div>
      </div>

      {/* ================= TABLA ================= */}
      <div className="w-full overflow-x-auto max-h-[500px] lg:max-h-[600px] custom-scrollbar relative z-10">
        <table className="w-full text-left border-collapse min-w-[800px]">
          
          <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-md border-b border-border/50 shadow-sm">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-border/50 bg-background/20">
            {isLoading && data.length === 0 ? (
              Array.from({ length: perPage || 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="animate-pulse hover:bg-transparent">
                  {columns.map((_, colIndex) => (
                    <td key={`skeleton-col-${colIndex}`} className="py-5 px-6">
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : 
            
            data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`transition-colors duration-200 hover:bg-muted/30 group relative ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`} 
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="py-4 px-6 text-sm text-foreground whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : 
            
            (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center animate-fade-in">
                    <div className="w-16 h-16 rounded-3xl bg-muted/20 border border-border/50 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-foreground mb-1">Sin resultados</h4>
                    <p className="text-sm font-medium text-muted-foreground">
                      {searchTerm ? `No hay coincidencias para "${searchTerm}".` : "No hay registros disponibles."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= FOOTER (PAGINACIÓN) ================= */}
      {/* 🌟 AJUSTE VISUAL: Se unifican alturas y se mejora la adaptabilidad en móviles */}
      <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between bg-card gap-4 z-20 relative rounded-b-xl">
        
        {/* Info de registros */}
        <div className="text-sm font-medium text-muted-foreground w-full sm:w-auto text-center sm:text-left">
          {totalRecords === 0 ? (
            <span>No hay registros para mostrar</span>
          ) : (
            <span>
              Mostrando <span className="font-bold text-foreground">{startRecord}</span> a <span className="font-bold text-foreground">{endRecord}</span> de <span className="font-bold text-foreground">{totalRecords}</span> registros
            </span>
          )}
        </div>
        
        {/* Controles de paginación */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          
          <Button 
            variant="outline" 
            className="h-9 px-3 sm:px-4 border-border/50 text-foreground hover:bg-muted"
            disabled={currentPage === 1 || isLoading} 
            onClick={() => onPageChange(currentPage - 1)}
          >
            <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            {/* Oculto en móviles para ahorrar espacio */}
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          
          {/* Indicador central con la MISMA ALTURA (h-9) que los botones */}
          <div className="h-9 px-4 flex items-center justify-center rounded-md bg-muted/30 border border-border/50 text-sm font-bold text-foreground min-w-[4rem]">
            {currentPage} <span className="text-muted-foreground font-normal mx-1.5">/</span> {totalPages === 0 ? 1 : totalPages}
          </div>

          <Button 
            variant="outline" 
            className="h-9 px-3 sm:px-4 border-border/50 text-foreground hover:bg-muted"
            disabled={currentPage === totalPages || isLoading || totalRecords === 0} 
            onClick={() => onPageChange(currentPage + 1)}
          >
            {/* Oculto en móviles para ahorrar espacio */}
            <span className="hidden sm:inline">Siguiente</span>
            <svg className="w-4 h-4 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </Button>
          
        </div>
      </div>
    </div>
  );
}