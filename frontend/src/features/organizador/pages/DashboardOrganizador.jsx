import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/shared/Card';

export default function DashboardOrganizador() {
  const { user } = useAuthStore();

  return (
    <div className="animate-fade-in-down">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter mb-2">
          Resumen <span className="text-brand-primary">de Ligas</span>
        </h1>
        <p className="text-text-main/70">
          Hola, {user?.name}. Aquí tienes el control de tus competiciones activas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:border-brand-primary/50 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-text-main/50 text-xs font-bold uppercase tracking-widest mb-1">Temporadas Activas</p>
              <h3 className="text-4xl font-extrabold">2</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-2xl">🏆</div>
          </div>
        </Card>

        <Card className="hover:border-brand-primary/50 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-text-main/50 text-xs font-bold uppercase tracking-widest mb-1">Equipos Inscritos</p>
              <h3 className="text-4xl font-extrabold">34</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-2xl">🛡️</div>
          </div>
        </Card>

        <Card className="hover:border-brand-primary/50 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-text-main/50 text-xs font-bold uppercase tracking-widest mb-1">Partidos Pendientes</p>
              <h3 className="text-4xl font-extrabold text-brand-light">8</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-2xl">⚠️</div>
          </div>
        </Card>
      </div>
    </div>
  );
}