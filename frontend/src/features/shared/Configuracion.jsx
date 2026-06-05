import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import api from '@/api/axios';
import { useNavigate } from 'react-router-dom';

export default function Configuracion() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Estados locales cargados desde localStorage o por defecto
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('torneosprofc_timezone') || 'America/Santiago';
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('torneosprofc_notifications');
    return saved ? JSON.parse(saved) : {
      emailMatches: true,
      emailUpdates: false,
      discordAlerts: true
    };
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Persistir cambios de Zona Horaria
  const handleTimezoneChange = (e) => {
    const newTz = e.target.value;
    setTimezone(newTz);
    localStorage.setItem('torneosprofc_timezone', newTz);
    showTempFeedback('Zona horaria actualizada correctamente.');
  };

  // Persistir cambios de Notificaciones
  const handleToggle = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('torneosprofc_notifications', JSON.stringify(updated));
    showTempFeedback('Preferencias de notificación guardadas.');
  };

  const showTempFeedback = (text) => {
    setFeedback({ type: 'success', text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Función 1: Exportar datos en formato JSON
  const handleExportData = () => {
    if (!user) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `torneosprofc_profile_data_${user.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showTempFeedback('Tus datos han sido exportados correctamente.');
  };

  // Función 2: Eliminar Cuenta
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'ELIMINAR MI CUENTA') {
      setFeedback({ type: 'error', text: 'Debes escribir la frase exacta para confirmar la eliminación.' });
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      // Llamamos a la API real DELETE /usuarios/{id}
      await api.delete(`/usuarios/${user.id}`);
      setFeedback({ type: 'success', text: 'Tu cuenta ha sido eliminada con éxito.' });
      
      // Esperamos un momento para la animación y cerramos sesión
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Ocurrió un error al intentar eliminar la cuenta.';
      setFeedback({ type: 'error', text: errMsg });
      setIsDeleting(false);
    }
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

      {/* Banner de Feedback Temporal */}
      {feedback && (
        <div className={`p-4 rounded-xl border animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <p className="text-sm font-bold flex items-center gap-2">
            {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.text}
          </p>
        </div>
      )}

      {/* 1. TARJETA: Preferencias de Aplicación */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wide mb-6 flex items-center gap-2">
          <span className="text-primary text-xl">⚙️</span> Apariencia y Región
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selector de Tema Manual */}
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
            value={timezone}
            onChange={handleTimezoneChange}
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
              <p className="text-xs text-muted-foreground mt-0.5">Recibe un correo 30 minutos antes de tus encuentros programados.</p>
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
              <p className="font-bold text-foreground text-sm">Novedades y Actualizaciones</p>
              <p className="text-xs text-muted-foreground mt-0.5">Entérate de las nuevas ligas, temporadas y torneos disponibles.</p>
            </div>
            <button 
              onClick={() => handleToggle('emailUpdates')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${notifications.emailUpdates ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.emailUpdates ? 'left-7' : 'left-1'}`}></span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-xl">
            <div>
              <p className="font-bold text-foreground text-sm">Integración de Alertas Discord</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sincroniza tus resultados y alertas de traspaso automáticamente en Discord.</p>
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
          Las acciones aquí son permanentes y no se pueden deshacer. Procede con extrema precaución.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-border hover:bg-background/80"
            onClick={handleExportData}
          >
            Descargar mis datos personales (JSON)
          </Button>
          <Button 
            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_hsla(var(--destructive),0.5)] border-transparent transition-all"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Eliminar mi cuenta
          </Button>
        </div>

        {/* Modal de confirmación para eliminar cuenta */}
        {showDeleteConfirm && (
          <div className="mt-6 p-5 bg-background border border-destructive/30 rounded-xl animate-fade-in relative z-20">
            <p className="text-sm font-bold text-foreground">¿Estás absolutamente seguro de que deseas eliminar tu cuenta?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Esto borrará tu perfil, historial de partidos y desvinculará todos tus equipos inscritos.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Escribe <span className="text-destructive font-black">ELIMINAR MI CUENTA</span> para confirmar:
              </label>
              <input 
                type="text" 
                className="bg-card border border-border/80 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-destructive transition-all"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Escribe la frase..."
              />
              <div className="flex items-center gap-3 mt-2">
                <Button 
                  isLoading={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 text-xs"
                  onClick={handleDeleteAccount}
                >
                  Confirmar Eliminación Permanente
                </Button>
                <button 
                  className="text-xs text-muted-foreground hover:text-foreground font-bold"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput('');
                  }}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}