import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import Badge from '@/components/shared/Badge';

export default function MiPerfil() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  
  // Simulamos datos del formulario basados en el usuario actual
  const [formData, setFormData] = useState({
    name: user?.name || 'Usuario Demo',
    email: user?.email || 'demo@raconpro.com',
    eaId: 'Racon_Player1',
    discord: 'usuario#1234',
    bio: 'Apasionado por los E-sports y la competición al más alto nivel en FC26.'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500); // Simula guardado
  };

  // Función auxiliar para renderizar estadísticas según el rol
  const renderRoleStats = () => {
    const role = user?.role || 'jugador';
    
    if (role === 'administrador') {
      return (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
            <p className="text-2xl font-display font-black text-primary">124</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuarios</p>
          </div>
          <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
            <p className="text-2xl font-display font-black text-primary">9</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Torneos Sist.</p>
          </div>
        </div>
      );
    }
    
    if (role === 'organizador') {
      return (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
            <p className="text-2xl font-display font-black text-primary">3</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ligas Activas</p>
          </div>
          <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-center">
            <p className="text-2xl font-display font-black text-primary">48</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Equipos</p>
          </div>
        </div>
      );
    }

    // Por defecto: Jugador
    return (
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-xl font-display font-black text-primary">142</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Partidos</p>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-xl font-display font-black text-emerald-500">68%</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Win Rate</p>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-xl font-display font-black text-primary">Oro 1</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rango</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* 1. HEADER / BANNER DE PERFIL */}
      <div className="relative rounded-2xl overflow-visible bg-card border border-border/50 shadow-sm mt-12">
        {/* Banner Image */}
        <div 
          className="h-48 md:h-64 w-full rounded-t-2xl bg-cover bg-center relative"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-90 rounded-t-2xl"></div>
        </div>

        {/* Avatar Superpuesto */}
        <div className="absolute -bottom-12 left-6 md:left-10 flex items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-tr from-primary to-destructive p-1 shadow-[0_0_20px_hsla(var(--primary),0.4)]">
            <div className="w-full h-full bg-card rounded-xl flex items-center justify-center text-4xl md:text-5xl font-display font-black text-foreground">
              {formData.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Botón de Acción Rápida en el Banner */}
        <div className="absolute bottom-4 right-6 hidden sm:block">
          <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-4 py-1.5 font-bold uppercase tracking-widest text-xs">
            {user?.role === 'administrador' ? '⚡ Cuenta Nivel Dios' : user?.role === 'organizador' ? '🏢 Cuenta Verificada' : '🎮 Competidor Activo'}
          </Badge>
        </div>
        
        {/* Espaciador para compensar el avatar absoluto */}
        <div className="h-16 md:h-20 bg-card rounded-b-2xl"></div>
      </div>

      {/* 2. CONTENIDO: GRID DE 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Info y Estadísticas */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-display font-black text-foreground uppercase tracking-wide">
              {formData.name}
            </h2>
            <p className="text-sm font-medium text-muted-foreground mb-4">
              @{formData.discord.split('#')[0]} • Miembro desde 2026
            </p>
            
            <p className="text-sm text-foreground/80 leading-relaxed">
              {formData.bio}
            </p>

            {renderRoleStats()}
          </div>
        </div>

        {/* COLUMNA DERECHA: Formulario de Edición */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-display font-bold text-foreground uppercase tracking-wide">
                Información Personal
              </h3>
              <p className="text-sm text-muted-foreground">Actualiza tus datos de contacto e IDs de juego.</p>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Nombre de Pantalla" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
                <Input 
                  label="Correo Electrónico" 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="EA ID / PSN / Xbox" 
                  value={formData.eaId} 
                  onChange={(e) => setFormData({...formData, eaId: e.target.value})} 
                  icon={<span className="opacity-70">🎮</span>}
                />
                <Input 
                  label="Usuario de Discord" 
                  value={formData.discord} 
                  onChange={(e) => setFormData({...formData, discord: e.target.value})} 
                  icon={<span className="opacity-70">💬</span>}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  Biografía / Lema
                </label>
                <textarea 
                  className="w-full bg-background border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar min-h-[100px]"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end mt-4">
                <Button 
                  type="submit" 
                  isLoading={isSaving}
                  className="w-full md:w-auto px-8 h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black tracking-wider uppercase shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:shadow-[0_0_25px_hsla(var(--primary),0.5)] transition-all duration-300"
                >
                  Guardar Perfil
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}