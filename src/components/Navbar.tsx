import { Car, Cpu, Flame, Gauge, Github, ShieldCheck, Users, Wrench } from 'lucide-react';
import type { AppRoute } from '../core/types';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  garageCount: number;
}

const NAV_ITEMS: Array<{ id: AppRoute; label: string; icon: typeof Car }> = [
  { id: 'showroom', label: 'Showroom 3D', icon: Car },
  { id: 'garage', label: 'Il Mio Garage', icon: Wrench },
  { id: 'simulator', label: 'Simulator', icon: Cpu },
  { id: 'wiki', label: 'Wiki Motori', icon: Flame },
  { id: 'euro', label: 'Euro 0 → 7', icon: ShieldCheck },
  { id: 'community', label: 'Community', icon: Users },
];

export function Navbar({ activeRoute, onNavigate, garageCount }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 py-3 sm:px-6">
      <div className="glass-hud mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-5">
        <button
          type="button"
          onClick={() => onNavigate('showroom')}
          className="flex cursor-pointer items-center gap-2.5 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-lg shadow-cyan-500/20">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display block text-base font-bold tracking-tight text-white sm:text-lg">
              CarFix
            </span>
            <span className="font-mono-tech block text-[9px] uppercase tracking-[0.2em] text-cyan-300/90 sm:text-[10px]">
              By Simon Kola
            </span>
          </div>
        </button>

        <nav className="flex items-center gap-1 overflow-x-auto py-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium whitespace-nowrap transition sm:px-3 sm:text-sm ${
                  active
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
                <span className="lg:hidden">{item.label.split(' ')[0]}</span>
                {item.id === 'garage' && garageCount > 0 && (
                  <span
                    className={`font-mono-tech rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-black text-white' : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {garageCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <a
          href="https://github.com/simonkolaaa"
          target="_blank"
          rel="noreferrer"
          title="GitHub di Simon Kola"
          className="font-mono-tech hidden items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-200 transition hover:border-cyan-400/50 hover:text-cyan-200 xl:flex"
        >
          <Github className="h-3.5 w-3.5 text-cyan-400" />
          GitHub
        </a>
      </div>
    </header>
  );
}
