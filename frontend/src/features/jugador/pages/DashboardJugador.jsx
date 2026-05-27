import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';

export default function DashboardJugador() {
  const { user } = useAuthStore();

  return (
    <div className="animate-fade-in-down">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter mb-2">
          Tu <span className="text-brand-primary">Carrera</span>
        </h1>
        <p className="text-text-main/70">
          ¿Listo para dominar la cancha, {user?.name}?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Estado Actual">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center text-3xl">🛡️</div>
             <div>
                <p className="text-sm font-bold uppercase text-text-main/70">Equipo Actual</p>
                <h3 className="text-2xl font-extrabold text-text-main">Agente Libre</h3>
             </div>
          </div>
          <Button fullWidth variant="primary">Crear Mi Equipo</Button>
        </Card>

        <Card title="Próximos Partidos">
          <div className="text-center py-8 text-text-main/50">
            <span className="text-4xl block mb-2">⚽</span>
            <p className="text-sm uppercase tracking-widest font-bold">Sin partidos programados</p>
            <p className="text-xs mt-1">Inscríbete en un torneo para empezar a competir.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}