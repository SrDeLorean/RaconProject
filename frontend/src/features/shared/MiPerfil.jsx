import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';
import ImageUploader from '@/components/ui/ImageUploader';

export default function MiPerfil() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Inicializar estado con datos reales del usuario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'jugador',
    status: 'activo',
    telefono: '',
    biografia: '',
    foto: '', // Foto de perfil
    
    // Identidades Gamer (solo rol jugador)
    gamertag: '',
    id_ea: '',
    plataforma: 'ps5',
    posicion: 'MC',
    nacionalidad: '',
    fecha_nacimiento: '',
    altura: '',
    peso: '',

    // Redes Sociales
    instagram: '',
    facebook: '',
    twitch: '',
    youtube: '',
    tiktok: '',

    // Campos de contraseña (opcional)
    password: '',
    confirmPassword: ''
  });

  // Estado para la organización (solo rol organizador)
  const [orgData, setOrgData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    logo: '',
    banner: '',
    color_hex: '#e11d48',
    email_contacto: '',
    discord_url: '',
    twitter_url: '',
    twitch_url: '',
    website: '',
    pais: 'CL',
    estado: 'activo',
    is_verified: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'jugador',
        status: user.status || 'activo',
        telefono: user.telefono || '',
        biografia: user.biografia || '',
        foto: user.foto || '',
        gamertag: user.gamertag || '',
        id_ea: user.id_ea || '',
        plataforma: user.plataforma || 'ps5',
        posicion: user.posicion || 'MC',
        nacionalidad: user.nacionalidad || '',
        fecha_nacimiento: user.fecha_nacimiento ? user.fecha_nacimiento.substring(0, 10) : '',
        altura: user.altura || '',
        peso: user.peso || '',
        instagram: user.instagram || '',
        facebook: user.facebook || '',
        twitch: user.twitch || '',
        youtube: user.youtube || '',
        tiktok: user.tiktok || '',
        password: '',
        confirmPassword: ''
      });

      if (user.role === 'organizador' && user.organizacion) {
        setOrgData({
          nombre: user.organizacion.nombre || '',
          slug: user.organizacion.slug || '',
          descripcion: user.organizacion.descripcion || '',
          logo: user.organizacion.logo || '',
          banner: user.organizacion.banner || '',
          color_hex: user.organizacion.color_hex || '#e11d48',
          email_contacto: user.organizacion.email_contacto || '',
          discord_url: user.organizacion.discord_url || '',
          twitter_url: user.organizacion.twitter_url || '',
          twitch_url: user.organizacion.twitch_url || '',
          website: user.organizacion.website || '',
          pais: user.organizacion.pais || 'CL',
          estado: user.organizacion.estado || 'activo',
          is_verified: user.organizacion.is_verified ?? false
        });
      }
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Validar coincidencia de contraseña si se ingresó algo
    if (formData.password) {
      if (formData.password.length < 8) {
        setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
        setIsSaving(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
        setIsSaving(false);
        return;
      }
    }

    try {
      // Estructuramos el payload enviando únicamente los campos que han cambiado (dirty fields)
      const payload = {};
      
      const cleanPrefix = (url) => {
        if (!url) return '';
        const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
        let cleaned = url;
        if (cleaned.startsWith(backendBaseUrl)) {
          cleaned = cleaned.substring(backendBaseUrl.length);
        }
        if (cleaned.startsWith('http://localhost:8000')) {
          cleaned = cleaned.substring('http://localhost:8000'.length);
        }
        if (cleaned.startsWith('http://127.0.0.1:8000')) {
          cleaned = cleaned.substring('http://127.0.0.1:8000'.length);
        }
        return cleaned;
      };

      const checkAndAdd = (field, currentVal, originalVal) => {
        let normalizedCurrent = (currentVal === '' || currentVal === undefined) ? null : currentVal;
        let normalizedOriginal = (originalVal === '' || originalVal === undefined) ? null : originalVal;
        
        if (field === 'foto') {
          normalizedCurrent = cleanPrefix(normalizedCurrent);
          normalizedOriginal = cleanPrefix(normalizedOriginal);
        }
        
        if (normalizedCurrent !== normalizedOriginal) {
          payload[field] = normalizedCurrent;
        }
      };

      checkAndAdd('name', formData.name, user.name);
      checkAndAdd('telefono', formData.telefono, user.telefono);
      checkAndAdd('biografia', formData.biografia, user.biografia);
      checkAndAdd('foto', formData.foto, user.foto);
      checkAndAdd('instagram', formData.instagram, user.instagram);
      checkAndAdd('facebook', formData.facebook, user.facebook);
      checkAndAdd('twitch', formData.twitch, user.twitch);
      checkAndAdd('youtube', formData.youtube, user.youtube);
      checkAndAdd('tiktok', formData.tiktok, user.tiktok);

      if (formData.role === 'jugador') {
        checkAndAdd('gamertag', formData.gamertag, user.gamertag);
        checkAndAdd('id_ea', formData.id_ea, user.id_ea);
        checkAndAdd('plataforma', formData.plataforma, user.plataforma);
        checkAndAdd('posicion', formData.posicion, user.posicion);
        checkAndAdd('nacionalidad', formData.nacionalidad, user.nacionalidad);
        
        const origBirth = user.fecha_nacimiento ? user.fecha_nacimiento.substring(0, 10) : null;
        checkAndAdd('fecha_nacimiento', formData.fecha_nacimiento, origBirth);
        
        const currentHeight = formData.altura ? parseInt(formData.altura) : null;
        const originalHeight = user.altura ? parseInt(user.altura) : null;
        if (currentHeight !== originalHeight) {
          payload.altura = currentHeight;
        }
        
        const currentWeight = formData.peso ? parseInt(formData.peso) : null;
        const originalWeight = user.peso ? parseInt(user.peso) : null;
        if (currentWeight !== originalWeight) {
          payload.peso = currentWeight;
        }
      }

      if (formData.password) {
        payload.password = formData.password;
      }

      let userUpdated = false;
      if (Object.keys(payload).length > 0) {
        await api.put(`/usuarios/${user.id}`, payload);
        userUpdated = true;
      }

      let orgUpdated = false;
      if (user.role === 'organizador') {
        const orgPayload = {
          owner_id: user.id,
          nombre: orgData.nombre,
          slug: orgData.slug,
          descripcion: orgData.descripcion || null,
          logo: cleanPrefix(orgData.logo) || null,
          banner: cleanPrefix(orgData.banner) || null,
          color_hex: orgData.color_hex || '#e11d48',
          email_contacto: orgData.email_contacto || null,
          discord_url: orgData.discord_url || null,
          twitter_url: orgData.twitter_url || null,
          twitch_url: orgData.twitch_url || null,
          website: orgData.website || null,
          pais: orgData.pais || 'CL',
          estado: orgData.estado || 'activo',
          is_verified: orgData.is_verified ?? false
        };

        if (user.organizacion?.id) {
          const orgOriginal = user.organizacion;
          const hasOrgChanges = 
            orgData.nombre !== orgOriginal.nombre ||
            orgData.slug !== orgOriginal.slug ||
            orgData.descripcion !== orgOriginal.descripcion ||
            cleanPrefix(orgData.logo) !== cleanPrefix(orgOriginal.logo) ||
            cleanPrefix(orgData.banner) !== cleanPrefix(orgOriginal.banner) ||
            orgData.color_hex !== orgOriginal.color_hex ||
            orgData.email_contacto !== orgOriginal.email_contacto ||
            orgData.discord_url !== orgOriginal.discord_url ||
            orgData.twitter_url !== orgOriginal.twitter_url ||
            orgData.twitch_url !== orgOriginal.twitch_url ||
            orgData.website !== orgOriginal.website ||
            orgData.pais !== orgOriginal.pais ||
            orgData.estado !== orgOriginal.estado ||
            orgData.is_verified !== orgOriginal.is_verified;

          if (hasOrgChanges) {
            await api.put(`/organizaciones/${user.organizacion.id}`, orgPayload);
            orgUpdated = true;
          }
        } else {
          await api.post(`/organizaciones`, orgPayload);
          orgUpdated = true;
        }
      }

      if (!userUpdated && !orgUpdated) {
        setMessage({ type: 'success', text: 'No se detectaron cambios para guardar.' });
        setIsSaving(false);
        return;
      }

      // Recuperamos los datos más frescos directamente del backend con una petición GET
      const freshResponse = await api.get(`/usuarios/${user.id}`);
      
      if (freshResponse.data && freshResponse.data.user) {
        setUser(freshResponse.data.user);
        setMessage({ type: 'success', text: '¡Perfil y datos actualizados correctamente!' });
        // Limpiar campos de contraseña
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setShowPasswordSection(false);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Error al actualizar el perfil. Revisa los datos.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
      // Auto-ocultar banner de éxito
      setTimeout(() => {
        setMessage(prev => prev?.type === 'success' ? null : prev);
      }, 5000);
    }
  };

  // Renderizado dinámico de estadísticas
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

    return (
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-xl font-display font-black text-primary">{user?.altura || '-'} cm</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estatura</p>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-xl font-display font-black text-emerald-500">{user?.peso || '-'} kg</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Peso</p>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-xl font-display font-black text-primary">{formData.posicion}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Posición</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* 1. HEADER / BANNER DE PERFIL */}
      <div className="relative rounded-2xl overflow-visible bg-card border border-border/50 shadow-sm mt-12">
        <div 
          className="h-48 md:h-64 w-full rounded-t-2xl bg-cover bg-center relative"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-90 rounded-t-2xl"></div>
        </div>

        {/* Avatar Superpuesto */}
        <div className="absolute -bottom-12 left-6 md:left-10 flex items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-tr from-primary to-destructive p-1 shadow-[0_0_20px_hsla(var(--primary),0.4)] overflow-hidden">
            <div className="w-full h-full bg-card rounded-xl flex items-center justify-center text-4xl md:text-5xl font-display font-black text-foreground overflow-hidden">
              {formData.foto ? (
                <img 
                  src={formData.foto.startsWith('http') ? formData.foto : `${api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'}${formData.foto}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                formData.name ? formData.name.charAt(0).toUpperCase() : '?'
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 hidden sm:block">
          <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-4 py-1.5 font-bold uppercase tracking-widest text-xs">
            {formData.role === 'administrador' ? '⚡ Cuenta Administrador' : formData.role === 'organizador' ? '🏢 Cuenta Organizador' : '🎮 Competidor Activo'}
          </Badge>
        </div>
        
        <div className="h-16 md:h-20 bg-card rounded-b-2xl"></div>
      </div>

      {/* 2. CONTENIDO: GRID DE COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Info y Estadísticas */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-display font-black text-foreground uppercase tracking-wide truncate pr-2">
                {formData.name}
              </h2>
              <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">
                {formData.status}
              </Badge>
            </div>
            
            <p className="text-xs font-semibold text-muted-foreground mb-4">
              {formData.email}
            </p>
            
            <p className="text-sm text-foreground/80 leading-relaxed italic bg-background/30 p-3 rounded-lg border border-border/20 mb-4 min-h-[60px]">
              {formData.biografia || "Sin biografía o lema establecido."}
            </p>

            {renderRoleStats()}
          </div>
        </div>

        {/* COLUMNA DERECHA: Formulario de Edición */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Banner de Feedback Visual */}
          {message && (
            <div className={`p-4 rounded-xl border animate-pulse ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}>
              <p className="text-sm font-bold flex items-center gap-2">
                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
              </p>
            </div>
          )}

          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              
              {/* Sección 1: Información General */}
              <div>
                <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border/30 pb-2">
                  Información Personal
                </h3>
                
                <div className="mb-6">
                  <ImageUploader 
                    label="Foto de Perfil / Avatar" 
                    value={formData.foto} 
                    onChange={(url) => setFormData({ ...formData, foto: url })}
                    folder="usuarios"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input 
                    label="Nombre de Pantalla" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required
                  />
                  <Input 
                    label="Correo Electrónico (No modificable)" 
                    type="email"
                    value={formData.email} 
                    disabled
                    className="opacity-70"
                  />
                  <Input 
                    label="Teléfono de Contacto" 
                    value={formData.telefono} 
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                    placeholder="+56 9 1234 5678"
                  />
                  <Input 
                    label="Rol de Usuario" 
                    value={formData.role.toUpperCase()} 
                    disabled
                    className="opacity-70 font-bold"
                  />
                </div>
              </div>

              {/* Sección Organización (Solo para Organizadores) */}
              {formData.role === 'organizador' && (
                <div className="animate-fade-in flex flex-col gap-5 border-t border-border/30 pt-6">
                  <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wider border-b border-border/30 pb-2">
                    Información de la Organización
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ImageUploader 
                      label="Logo de la Organización" 
                      value={orgData.logo} 
                      onChange={(url) => setOrgData({ ...orgData, logo: url })}
                      folder="organizaciones"
                    />
                    <ImageUploader 
                      label="Banner de la Organización" 
                      value={orgData.banner} 
                      onChange={(url) => setOrgData({ ...orgData, banner: url })}
                      folder="organizaciones"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input 
                      label="Nombre de la Organización" 
                      value={orgData.nombre} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const slugified = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        setOrgData({ ...orgData, nombre: val, slug: slugified });
                      }}
                      required
                    />
                    <Input 
                      label="Slug (URL Amigable)" 
                      value={orgData.slug} 
                      onChange={(e) => setOrgData({ ...orgData, slug: e.target.value })}
                      required
                    />
                    <Input 
                      label="Color Identificativo (HEX)" 
                      type="color"
                      value={orgData.color_hex} 
                      onChange={(e) => setOrgData({ ...orgData, color_hex: e.target.value })}
                      className="h-11 p-1 bg-background/50 border border-border/80 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input 
                      label="Correo de Contacto" 
                      type="email"
                      value={orgData.email_contacto} 
                      onChange={(e) => setOrgData({ ...orgData, email_contacto: e.target.value })}
                      placeholder="contacto@organizacion.com"
                    />
                    <Input 
                      label="Sitio Web Oficial" 
                      value={orgData.website} 
                      onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                      placeholder="https://miorganizacion.com"
                    />
                    <Select 
                      label="País de la Organización" 
                      value={orgData.pais} 
                      onChange={(e) => setOrgData({ ...orgData, pais: e.target.value })}
                      options={[
                        { value: 'CL', label: 'Chile' },
                        { value: 'AR', label: 'Argentina' },
                        { value: 'MX', label: 'México' },
                        { value: 'CO', label: 'Colombia' },
                        { value: 'PE', label: 'Perú' },
                        { value: 'ES', label: 'España' },
                        { value: 'US', label: 'Estados Unidos' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input 
                      label="Discord" 
                      value={orgData.discord_url} 
                      onChange={(e) => setOrgData({ ...orgData, discord_url: e.target.value })} 
                      placeholder="https://discord.gg/invitacion"
                      icon={<span className="opacity-70">💬</span>}
                    />
                    <Input 
                      label="Twitter" 
                      value={orgData.twitter_url} 
                      onChange={(e) => setOrgData({ ...orgData, twitter_url: e.target.value })} 
                      placeholder="https://twitter.com/cuenta"
                      icon={<span className="opacity-70">🐦</span>}
                    />
                    <Input 
                      label="Twitch" 
                      value={orgData.twitch_url} 
                      onChange={(e) => setOrgData({ ...orgData, twitch_url: e.target.value })} 
                      placeholder="https://twitch.tv/canal"
                      icon={<span className="opacity-70">🎮</span>}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      Descripción de la Organización
                    </label>
                    <textarea 
                      className="w-full bg-background/50 border border-border/80 rounded-md px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all custom-scrollbar min-h-[100px]"
                      value={orgData.descripcion || ''}
                      onChange={(e) => setOrgData({ ...orgData, descripcion: e.target.value })}
                      placeholder="Cuéntanos la historia de la confederación, reglas generales..."
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Sección 2: Identidades Gamer (Solo para rol Jugador) */}
              {formData.role === 'jugador' && (
                <div className="animate-fade-in flex flex-col gap-5">
                  <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wider border-b border-border/30 pb-2">
                    Estadísticas & Ficha de Jugador
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-technical text-muted-foreground">EA ID</span>
                        <div className="group relative cursor-pointer text-primary hover:text-destructive transition-colors text-xs font-bold bg-primary/10 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                          ℹ️
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 text-[10px] leading-relaxed bg-card border border-border text-foreground rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                            Número que se encuentra en la configuración de cuenta de EA.
                          </span>
                        </div>
                      </div>
                      <Input 
                        type="number"
                        value={formData.id_ea} 
                        onChange={(e) => setFormData({...formData, id_ea: e.target.value})} 
                        icon={<span>🎮</span>}
                        className="!gap-0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1 italic pl-1">
                        * Número que se encuentra en la configuración de cuenta de EA.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-technical text-muted-foreground">GamerTAG (EA Nickname)</span>
                        <div className="group relative cursor-pointer text-primary hover:text-destructive transition-colors text-xs font-bold bg-primary/10 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                          ℹ️
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-[10px] leading-relaxed bg-card border border-border text-foreground rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                            NOMBRE EXACTO AL DE EA, es el nombre que aparece al ver el listado de jugadores conectados en el partido.
                          </span>
                        </div>
                      </div>
                      <Input 
                        value={formData.gamertag} 
                        onChange={(e) => setFormData({...formData, gamertag: e.target.value})} 
                        icon={<span>👾</span>}
                        className="!gap-0"
                      />
                      <p className="text-[10px] text-primary mt-1 italic pl-1 font-semibold">
                        * NOMBRE EXACTO AL DE EA, es el nombre que aparece al ver el listado de jugadores conectados en el partido.
                      </p>
                    </div>
                    <Select 
                      label="Plataforma principal" 
                      value={formData.plataforma} 
                      onChange={(e) => setFormData({...formData, plataforma: e.target.value})} 
                      options={[
                        { value: 'ps5', label: 'PlayStation 5' },
                        { value: 'xbox', label: 'Xbox Series X/S' },
                        { value: 'pc', label: 'PC' },
                        { value: 'crossplay', label: 'Crossplay total' }
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Select 
                      label="Posición de Preferencia" 
                      value={formData.posicion} 
                      onChange={(e) => setFormData({...formData, posicion: e.target.value})} 
                      options={[
                        { value: 'PO', label: 'Portero (PO)' },
                        { value: 'DF', label: 'Defensa (DF)' },
                        { value: 'MC', label: 'Centrocampista (MC)' },
                        { value: 'DL', label: 'Delantero (DL)' }
                      ]}
                    />
                    <Input 
                      label="Nacionalidad" 
                      value={formData.nacionalidad} 
                      onChange={(e) => setFormData({...formData, nacionalidad: e.target.value})} 
                      placeholder="Chile, Argentina..."
                    />
                    <Input 
                      label="Fecha de Nacimiento" 
                      type="date"
                      value={formData.fecha_nacimiento} 
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Estatura (cm)" 
                      type="number" 
                      min="100" 
                      max="250"
                      value={formData.altura} 
                      onChange={(e) => setFormData({...formData, altura: e.target.value})} 
                      placeholder="Ej: 178"
                    />
                    <Input 
                      label="Peso (kg)" 
                      type="number" 
                      min="30" 
                      max="200"
                      value={formData.peso} 
                      onChange={(e) => setFormData({...formData, peso: e.target.value})} 
                      placeholder="Ej: 75"
                    />
                  </div>
                </div>
              )}

              {/* Sección 3: Biografía */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  Biografía / Lema Personal
                </label>
                <textarea 
                  className="w-full bg-background/50 border border-border/80 rounded-md px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all custom-scrollbar min-h-[100px]"
                  value={formData.biografia}
                  onChange={(e) => setFormData({...formData, biografia: e.target.value})}
                  placeholder="Escribe algo sobre ti, tu trayectoria en Clubes Pro o tus objetivos..."
                ></textarea>
              </div>

              {/* Sección 4: Redes Sociales */}
              <div>
                <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border/30 pb-2">
                  Redes Sociales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Instagram" 
                    value={formData.instagram} 
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})} 
                    placeholder="https://instagram.com/tu_usuario"
                    icon={<span className="opacity-70">📸</span>}
                  />
                  <Input 
                    label="Facebook" 
                    value={formData.facebook} 
                    onChange={(e) => setFormData({...formData, facebook: e.target.value})} 
                    placeholder="https://facebook.com/tu_usuario"
                    icon={<span className="opacity-70">👥</span>}
                  />
                  <Input 
                    label="Twitch" 
                    value={formData.twitch} 
                    onChange={(e) => setFormData({...formData, twitch: e.target.value})} 
                    placeholder="https://twitch.tv/tu_canal"
                    icon={<span className="opacity-70">🎮</span>}
                  />
                  <Input 
                    label="YouTube" 
                    value={formData.youtube} 
                    onChange={(e) => setFormData({...formData, youtube: e.target.value})} 
                    placeholder="https://youtube.com/@tu_canal"
                    icon={<span className="opacity-70">📺</span>}
                  />
                  <Input 
                    label="TikTok" 
                    value={formData.tiktok} 
                    onChange={(e) => setFormData({...formData, tiktok: e.target.value})} 
                    placeholder="https://tiktok.com/@tu_usuario"
                    icon={<span className="opacity-70">🎵</span>}
                    className="md:col-span-2"
                  />
                </div>
              </div>

              {/* Sección 5: Seguridad (Cambiar Contraseña) */}
              <div className="border-t border-border/30 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-2 focus:outline-none"
                >
                  {showPasswordSection ? '➖ Cancelar cambio de contraseña' : '🔑 ¿Deseas cambiar tu contraseña?'}
                </button>

                {showPasswordSection && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 animate-fade-in">
                    <Input 
                      label="Nueva Contraseña (mínimo 8 caracteres)" 
                      type="password"
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      placeholder="••••••••"
                    />
                    <Input 
                      label="Confirmar Nueva Contraseña" 
                      type="password"
                      value={formData.confirmPassword} 
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              {/* Botón de Enviar */}
              <div className="flex justify-end mt-4">
                <Button 
                  type="submit" 
                  isLoading={isSaving}
                  className="w-full md:w-auto px-8 h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black tracking-wider uppercase shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:shadow-[0_0_25px_hsla(var(--primary),0.5)] transition-all duration-300"
                >
                  Guardar Perfil Real
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}