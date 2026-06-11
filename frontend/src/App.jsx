import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import PageLoader from '@/components/ui/PageLoader';

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