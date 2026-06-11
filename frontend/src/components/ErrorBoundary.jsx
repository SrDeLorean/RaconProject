import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import Button from './ui/Button'; // Ajusta la ruta a tu Button

export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  // ⚡ Auto-reload on chunk loading/dynamic import failures
  React.useEffect(() => {
    if (error) {
      const errorMessage = error.message || String(error);
      const isChunkError = 
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Expected a JavaScript-or-Wasm module script') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Failed to load module script');

      if (isChunkError) {
        const lastReload = sessionStorage.getItem('last-chunk-reload');
        const now = Date.now();

        // Avoid infinite reload loops (limit to once every 10 seconds)
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem('last-chunk-reload', now.toString());
          console.warn("Chunk load error detected in ErrorBoundary. Reloading page...");
          window.location.reload();
        }
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 animate-pulse">
        <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-display font-black tracking-wide text-foreground uppercase mb-2">
        ¡Ups! Algo salió mal
      </h1>
      
      <p className="text-muted-foreground max-w-md mb-8">
        {error.status === 404 
          ? "No pudimos encontrar la página que buscas."
          : "Ha ocurrido un error inesperado cargando este módulo."}
      </p>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver Atrás
        </Button>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Recargar Página
        </Button>
      </div>

      {/* Solo mostramos el error técnico en desarrollo */}
      <pre className="mt-10 max-w-2xl text-left bg-card p-4 rounded-xl border border-border/50 text-xs text-muted-foreground overflow-auto">
        {error.message || error.statusText}
      </pre>
    </div>
  );
}