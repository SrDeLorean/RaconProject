import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function Contacto() {
  const [formData, setFormData] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
    }, 3000);
  };

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10"></div>
      </div>

      {/* Resplandor ambiental e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge 
            variant="primary"
            className="px-4 py-1.5 text-xs font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
          >
            🔥 Soporte & Alianzas
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            PONTE EN <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">CONTACTO</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
            ¿Tienes consultas, sugerencias o estás interesado en patrocinar nuestros circuitos competitivos?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Info lateral */}
          <div className="lg:col-span-1 space-y-6">
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
          <div className="lg:col-span-2">
            <form 
              onSubmit={handleSubmit}
              className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-8 space-y-6 shadow-lg relative overflow-hidden"
            >
              {submitted && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3 animate-fade-in">
                  <span className="text-4xl">📧</span>
                  <h4 className="font-display font-black text-lg text-primary uppercase">¡Mensaje Enviado!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs text-center font-medium">
                    Hemos registrado tus datos. Te responderemos en un plazo máximo de 24 horas.
                  </p>
                </div>
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
                    className="w-full bg-muted/30 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">Tu Correo Electrónico</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ej: seba@racon.com" 
                    className="w-full bg-muted/30 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-primary transition-all font-semibold font-mono"
                  />
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
                  className="w-full bg-muted/30 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-primary transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">Mensaje / Requerimiento</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Redacta tu mensaje aquí de forma clara y concisa..."
                  className="w-full bg-muted/30 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-primary transition-all font-semibold"
                />
              </div>

              <Button 
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider text-xs shadow-md border-none"
              >
                🚀 Enviar Mensaje Oficial
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
