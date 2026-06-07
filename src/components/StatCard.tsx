import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  sub,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: 'default' | 'success' | 'warn' | 'danger' | 'info';
  sub?: string;
}) {
  const toneClass = {
    default: 'bg-slate-50 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    warn: 'bg-amber-50 text-amber-600 border-amber-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  }[tone];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
