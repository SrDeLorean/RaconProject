import React from 'react';

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange, className = '' }) {
  // Lógica para mostrar números y puntos suspensivos
  const getPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between mt-6 ${className}`}>
      {/* Información de la página actual */}
      <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
        Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
      </span>

      {/* Controles */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-white/50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-zinc-700/50 backdrop-blur-sm"
        >
          Anterior
        </button>

        <div className="hidden sm:flex gap-1">
          {getPages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                currentPage === page
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20 border-red-600'
                  : page === '...'
                  ? 'text-gray-400 bg-transparent cursor-default'
                  : 'bg-white/50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700/50 backdrop-blur-sm'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-white/50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-zinc-700/50 backdrop-blur-sm"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}