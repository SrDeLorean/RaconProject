import React, { useState } from 'react';
import Input from './Input';
import Pagination from './Pagination'; // Paginador avanzado

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

  // Ajuste lógico: Si no hay registros, forzamos inicio y fin a 0
  const startRecord = totalRecords === 0 ? 0 : ((currentPage - 1) * perPage) + 1;
  const endRecord = totalRecords === 0 ? 0 : Math.min(currentPage * perPage, totalRecords);

  return (
    <div className="relative group">
      {/* Resplandor Ambiental detrás de la tabla */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-background to-primary/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

      <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col w-full overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-sans">
        
        {/* Scanline decorativo si está cargando */}
        {isLoading && <div className="absolute inset-0 z-0 animate-scanline pointer-events-none opacity-20"></div>}
        
        {/* ================= HEADER ================= */}
        <div className="p-4 sm:p-5 sm:px-6 border-b border-white/5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between relative z-20 bg-gradient-to-b from-white/5 to-transparent">
          {title && (
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-display font-black tracking-widest text-foreground uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                {title}
              </h3>
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
          
          <thead className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="py-4 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-white/5 bg-transparent">
            {isLoading && data.length === 0 ? (
              Array.from({ length: perPage || 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="animate-pulse hover:bg-transparent">
                  {columns.map((_, colIndex) => (
                    <td key={`skeleton-col-${colIndex}`} className="py-5 px-6">
                      <div className="h-4 bg-white/5 rounded-md w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : 
            
            data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`transition-all duration-300 hover:bg-white/5 group relative ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`} 
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="py-4 px-6 text-sm text-foreground/90 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : 
            
            (
              <tr>
                <td colSpan={columns.length} className="py-16 sm:py-24 text-center px-4">
                  <div className="flex flex-col items-center justify-center animate-fade-in opacity-60">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider">Sin resultados</h4>
                    <p className="text-xs font-medium text-muted-foreground max-w-sm mx-auto text-center">
                      {searchTerm ? `No hay coincidencias para "${searchTerm}".` : "No hay registros disponibles para visualizar."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= FOOTER (PAGINACIÓN) ================= */}
      <div className="p-4 sm:px-6 border-t border-white/5 flex flex-col xl:flex-row items-center justify-between bg-black/20 backdrop-blur-md gap-4 z-20 relative">
        
        {/* Info de registros */}
        <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground w-full xl:w-auto text-center xl:text-left shrink-0">
          {totalRecords === 0 ? (
            <span>0 REGISTROS</span>
          ) : (
            <span>
              MOSTRANDO <span className="text-foreground">{startRecord}</span> - <span className="text-foreground">{endRecord}</span> DE <span className="text-primary">{totalRecords}</span>
            </span>
          )}
        </div>
        
        {/* COMPONENTE DE PAGINACIÓN AVANZADA */}
        <div className="w-full overflow-x-auto pb-2 xl:pb-0">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages === 0 ? 1 : totalPages}
            onPageChange={onPageChange}
            className="!mt-0 min-w-max justify-center xl:justify-end" 
          />
        </div>
        
      </div>
      </div>
    </div>
  );
}