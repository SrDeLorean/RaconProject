import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100%)] flex flex-col justify-center overflow-hidden bg-background pt-28 pb-16">
      
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10"></div>
      </div>

      {/* Resplandor ambiental e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-destructive/10 blur-[100px] rounded-full pointer-events-none z-10 animate-pulse"></div>

      {/* Contenido Central */}
      <div className="relative z-20 text-center px-6 md:px-8 max-w-5xl mx-auto flex flex-col items-center gap-10">
        
        {/* Titular Principal & Introducción */}
        <div className="space-y-6 flex flex-col items-center">
          <Badge 
            variant="primary"
            className="px-4 py-1.5 text-xs font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
          >
            🔥 Elite Esports Championship Portal
          </Badge>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold text-foreground uppercase tracking-tight leading-[0.85]">
            DOMINA EL CIRCUITO <br />
            <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary via-primary to-destructive text-transparent">
              COMPETITIVO FC26
            </span>
          </h1>

          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            La infraestructura premium de e-Sports para la gestión de confederaciones, plantillas integradas, agentes libres y fixtures automatizados con analíticas a tiempo real.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center gap-4">
          <Link to="/organizaciones" className="w-full sm:w-auto">
            <Button 
              variant="primary"
              className="w-full py-4 px-8 text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_25px_hsla(var(--primary),0.5)] transition-all duration-300 h-12"
            >
              🏆 Entrar a Torneos
            </Button>
          </Link>
          
          <Link to="/login" className="w-full sm:w-auto">
            <Button 
              variant="outline"
              className="w-full py-4 px-8 text-xs font-bold uppercase tracking-widest border-border text-foreground hover:border-primary hover:bg-primary/10 transition-all duration-300 h-12"
            >
              🎮 Acceder al Panel
            </Button>
          </Link>
        </div>

        {/* Tarjetas de Estadísticas del Ecosistema */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mt-6">
          <Card className="flex flex-col items-center text-center p-5 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group" withGlow>
            <span className="text-3xl mb-2">👥</span>
            <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors">Jugadores Inscritos</h4>
            <div className="text-4xl font-display font-black text-foreground mt-1">1,200+</div>
          </Card>
          <Card className="flex flex-col items-center text-center p-5 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group" withGlow>
            <span className="text-3xl mb-2">🛡️</span>
            <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors">Clubes Oficiales</h4>
            <div className="text-4xl font-display font-black text-foreground mt-1">48 Escuadras</div>
          </Card>
          <Card className="flex flex-col items-center text-center p-5 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group" withGlow>
            <span className="text-3xl mb-2">🏆</span>
            <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors">Ligas Activas</h4>
            <div className="text-4xl font-display font-black text-foreground mt-1">12 Circuitos</div>
          </Card>
        </div>

      </div>
    </div>
  );
}