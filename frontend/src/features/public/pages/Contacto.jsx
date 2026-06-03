import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';

export default function Contacto() {
  const [formData, setFormData] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFormErrors({});
    try {
      const response = await api.post('/contacto', formData);
      if (response.data?.success) {
        setSubmitted(true);
        setSuccessMsg(response.data.message);
        setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Error al enviar mensaje de contacto:", error);
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
        setErrorMsg("Por favor, corrige las validaciones marcadas en el formulario.");
      } else {
        setErrorMsg(error.response?.data?.message || "Ocurrió un error inesperado al enviar el mensaje.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden text-foreground">
      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/8 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* ========================================================================= */}
      {/* 1. HERO CENTRAL (Cinemático y Táctico)                                    */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 overflow-hidden">
        
        {/* Palabras de fondo brush estilo editorial */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="absolute top-10 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
            CONTACTO
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            SOPORTE
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            MENSAJE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              77
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Soporte & Alianzas
            </Badge>

            <h1 className="animate-fade-in-up text-6xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              PONTE EN <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                CONTACTO.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              ¿Tienes consultas, sugerencias o estás interesado en patrocinar nuestros circuitos competitivos de eSports? Escríbenos directamente.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[9px] sm:text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">CANALES RÁPIDOS</span>
                <span className="text-[9px] sm:text-[10px] font-mono text-primary font-bold">INFO BOX</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">CORREO</h4>
                  <span className="text-xs font-mono font-bold text-foreground">CONTACTO@</span>
                </div>
                <div>
                  <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">ATENCIÓN</h4>
                  <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-primary">24/7</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Equipo de administración federativa disponible para revisión de licencias y solicitudes corporativas.
              </p>

              <a 
                href="https://discord.gg/raconpro" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full text-center py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy block"
              >
                UNIRSE AL DISCORD
              </a>
            </div>
          </div>

        </div>

      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Info lateral */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide">
                Canales Oficiales
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nuestro equipo administrativo atiende solicitudes corporativas, inscripciones de nuevas ligas y reportes deportivos.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 border border-border/30 rounded-xl bg-muted/10">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Correo de Alianzas</span>
                  <span className="text-foreground font-mono font-bold">contacto@raconpro.com</span>
                </div>
                <div className="p-3 border border-border/30 rounded-xl bg-muted/10">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Discord Oficial</span>
                  <span className="text-primary font-bold">discord.gg/raconpro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <form 
              onSubmit={handleSubmit}
              className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-8 space-y-6 shadow-lg relative overflow-hidden"
            >
              {submitted && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-fade-in-up">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-display font-black text-lg text-emerald-500 uppercase animate-fade-in-up" style={{ animationDelay: '0.1s' }}>¡Mensaje Enviado!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs text-center font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Hemos registrado tus datos. Te responderemos en un plazo máximo de 24 horas.
                  </p>
                </div>
              )}

              {errorMsg && (
                <Alert variant="error" className="mb-4" onClose={() => setErrorMsg(null)}>
                  {errorMsg}
                </Alert>
              )}

              {successMsg && (
                <Alert variant="success" className="mb-4" onClose={() => setSuccessMsg(null)}>
                  {successMsg}
                </Alert>
              )}

              <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide border-b border-border/40 pb-3">
                Formulario de Mensajería Táctica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">Tu Nombre</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Sebastián Pérez" 
                    className={`input-premium py-3 text-sm font-semibold ${formErrors.nombre ? '!border-destructive' : ''}`}
                  />
                  {formErrors.nombre && (
                    <span className="text-[10px] text-destructive font-semibold">{formErrors.nombre[0]}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">Tu Correo Electrónico</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ej: seba@racon.com" 
                    className={`input-premium py-3 text-sm font-semibold font-mono ${formErrors.email ? '!border-destructive' : ''}`}
                  />
                  {formErrors.email && (
                    <span className="text-[10px] text-destructive font-semibold">{formErrors.email[0]}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">Asunto</label>
                <input 
                  type="text" 
                  required
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Ej: Consulta sobre Alianza Corporativa" 
                  className={`input-premium py-3 text-sm font-semibold ${formErrors.asunto ? '!border-destructive' : ''}`}
                />
                {formErrors.asunto && (
                  <span className="text-[10px] text-destructive font-semibold">{formErrors.asunto[0]}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">Mensaje / Requerimiento</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Redacta tu mensaje aquí de forma clara y concisa..."
                  className={`input-premium py-3 text-sm font-semibold ${formErrors.mensaje ? '!border-destructive' : ''}`}
                />
                {formErrors.mensaje && (
                  <span className="text-[10px] text-destructive font-semibold">{formErrors.mensaje[0]}</span>
                )}
              </div>

              <Button 
                type="submit"
                disabled={sending}
                className="w-full h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider text-xs shadow-md border-none"
              >
                {sending ? '🚀 Enviando Mensaje...' : '🚀 Enviar Mensaje Oficial'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
