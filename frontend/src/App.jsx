import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import Spinner from '@/components/ui/Spinner'; // Ajusta la ruta si tu Spinner no está en esta carpeta

// Este es el loader de pantalla completa (estilo RaconPro)
const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col justify-center items-center font-sans">
    <Spinner size="xl" />
    <span className="mt-6 font-display font-black text-foreground tracking-widest text-sm uppercase animate-pulse">
      Racon<span className="text-primary">Pro</span> Loading...
    </span>
  </div>
);

function App() {
  return (
    // Suspense atrapa la carga de los componentes React.lazy()
    <Suspense fallback={<PageLoader />}>
      {/* fallbackElement atrapa la carga inicial de los Loaders de React Router */}
      <RouterProvider 
        router={router} 
        fallbackElement={<PageLoader />} 
      />
    </Suspense>
  );
}

export default App;