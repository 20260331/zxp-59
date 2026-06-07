import type { PropStatus, RecordType } from '../types';

const statusColors: Record<PropStatus, string> = {
  在库: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  借出: 'bg-blue-100 text-blue-700 border-blue-200',
  损耗: 'bg-amber-100 text-amber-700 border-amber-200',
  缺失: 'bg-red-100 text-red-700 border-red-200',
  替换中: 'bg-purple-100 text-purple-700 border-purple-200',
};

const recordColors: Record<RecordType, string> = {
  借出: 'bg-blue-500',
  归还: 'bg-emerald-500',
  损耗: 'bg-amber-500',
  替换: 'bg-purple-500',
  缺失: 'bg-red-500',
};

export function StatusBadge({ status }: { status: PropStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
    >
      {status}
    </span>
  );
}

export function RecordBadge({ type }: { type: RecordType }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white ${recordColors[type]}`}
    >
      {type}
    </span>
  );
}
