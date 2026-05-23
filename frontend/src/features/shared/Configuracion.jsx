import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/shared/Button';
import Select from '@/components/shared/Select';

export default function Configuracion() {
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  
  // Estados para simular toggles de notificaciones
  const [notifications, setNotifications] = useState({
    emailMatches: true,
    emailUpdates: false,
    discordAlerts: true
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-black text-foreground uppercase tracking-wide">
          Configuración del Sistema
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Ajusta tus preferencias, notificaciones y opciones de seguridad.
        </p>
      </div>

      {/* 1. TARJETA: Preferencias de Aplicación */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wide mb-6 flex items-center gap-2">
          <span className="text-primary text-xl">⚙️</span> Apariencia y Región
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selector de Tema Manual usando tu Hook */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modo Visual</label>
            <div className="flex p-1 bg-background border border-border/50 rounded-lg">
              <button 
                onClick={() => isDark && toggleTheme()}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isDark ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                ☀️ Claro
              </button>
              <button 
                onClick={() => !isDark && toggleTheme()}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isDark ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                🌙 Oscuro
              </button>
            </div>
          </div>

          <Select 
            label="Zona Horaria (Para Partidos)" 
            options={[
              { value: 'America/Santiago', label: '(GMT-4) Santiago, Chile' },
              { value: 'America/Argentina/Buenos_Aires', label: '(GMT-3) Buenos Aires' },
              { value: 'America/Bogota', label: '(GMT-5) Bogotá / Lima' },
              { value: 'Europe/Madrid', label: '(GMT+1) Madrid, España' }
            ]} 
          />
        </div>
      </div>

      {/* 2. TARJETA: Notificaciones */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wide mb-6 flex items-center gap-2">
          <span className="text-primary text-xl">🔔</span> Centro de Notificaciones
        </h3>
        
        <div className="flex flex-col gap-4">
          
          <div className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-xl">
            <div>
              <p className="font-bold text-foreground text-sm">Alertas de Partidos (Email)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recibe un correo 30 minutos antes de tus encuentros.</p>
            </div>
            <button 
              onClick={() => handleToggle('emailMatches')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${notifications.emailMatches ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.emailMatches ? 'left-7' : 'left-1'}`}></span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-xl">
            <div>
              <p className="font-bold text-foreground text-sm">Integración con Discord</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sincroniza tus resultados automáticamente en el servidor.</p>
            </div>
            <button 
              onClick={() => handleToggle('discordAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${notifications.discordAlerts ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.discordAlerts ? 'left-7' : 'left-1'}`}></span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. TARJETA: Danger Zone (Zona de Peligro) */}
      <div className="bg-card border border-destructive/30 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Resplandor rojo de advertencia */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <h3 className="text-lg font-display font-black text-destructive uppercase tracking-wide mb-2 flex items-center gap-2 relative z-10">
          ⚠️ Zona de Peligro
        </h3>
        <p className="text-sm text-muted-foreground mb-6 relative z-10">
          Las acciones aquí son permanentes y no se pueden deshacer. Procede con precaución.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <Button variant="outline" className="w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/10">
            Descargar mis datos
          </Button>
          <Button className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_hsla(var(--destructive),0.5)] border-transparent transition-all">
            Eliminar mi cuenta
          </Button>
        </div>
      </div>

    </div>
  );
}