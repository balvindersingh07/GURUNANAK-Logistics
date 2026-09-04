import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: number;
  trend?: string;
}

const accents = [
  'from-violet-500/10 to-violet-500/5',
  'from-blue-500/10 to-blue-500/5',
  'from-cyan-500/10 to-cyan-500/5',
  'from-emerald-500/10 to-emerald-500/5',
  'from-amber-500/10 to-amber-500/5',
  'from-orange-500/10 to-orange-500/5',
];

const iconColors = [
  'text-violet-600',
  'text-blue-600',
  'text-cyan-600',
  'text-emerald-600',
  'text-amber-600',
  'text-orange-600',
];

export default function KPICard({ title, value, icon: Icon, accent = 0, trend }: KPICardProps) {
  return (
    <div className={`glass-card glass-card-hover p-5 bg-gradient-to-br ${accents[accent % accents.length]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
          {trend && <p className="mt-1 text-xs text-emerald-600">{trend}</p>}
        </div>
        <div className={`rounded-xl bg-white/80 p-2.5 shadow-sm ${iconColors[accent % iconColors.length]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
