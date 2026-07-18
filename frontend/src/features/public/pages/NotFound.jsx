import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <h1 className="text-display font-black text-8xl text-primary mb-4">404</h1>
        <h2 className="text-display font-bold text-3xl text-foreground mb-4 uppercase tracking-wider">Página no encontrada</h2>
        <p className="text-muted-foreground text-lg mb-8">La página que buscas no existe o ha sido movida.</p>
        <Link to="/">
          <Button variant="primary" size="lg">Volver al Inicio</Button>
        </Link>
      </div>
    </div>
  );
}
