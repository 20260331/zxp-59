import { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { StatusBadge, ResolveBadge } from './Badges';
import type { Prop, PropCategory, PropStatus } from '../types';
import { Filter, Plus, ArrowRightLeft, Search, AlertTriangle, AlertCircle, MapPinOff, User } from 'lucide-react';

const categories: ('全部' | PropCategory)[] = ['全部', '面具', '徽章', '密信', '钥匙', '信物', '其他'];
const statuses: ('全部' | PropStatus)[] = ['全部', '在库', '借出', '损耗', '缺失', '替换中', '混放'];

export function PropsPanel({
  onQuickAction,
  onAddProp,
}: {
  onQuickAction: (prop: Prop) => void;
  onAddProp: () => void;
}) {
  const { props, missingProps, warningProps, misplacedProps } = useStore();
  const [category, setCategory] = useState<'全部' | PropCategory>('全部');
  const [status, setStatus] = useState<'全部' | PropStatus>('全部');
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    return props.filter((p) => {
      if (category !== '全部' && p.category !== category) return false;
      if (status !== '全部' && p.status !== status) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (
          !p.name.toLowerCase().includes(kw) &&
          !p.scriptName.toLowerCase().includes(kw) &&
          !p.location.toLowerCase().includes(kw)
        )
          return false;
      }
      return true;
    });
  }, [props, category, status, keyword]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">道具总览</h2>
          <p className="text-sm text-slate-500 mt-0.5">共 {props.length} 件道具</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {missingProps.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              <AlertTriangle size={16} />
              缺失 {missingProps.length} 件
            </span>
          )}
          {misplacedProps.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium border border-orange-200">
              <MapPinOff size={16} />
              混放 {misplacedProps.length} 件
            </span>
          )}
          {warningProps.filter((p) => p.status !== '混放').length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
              <AlertCircle size={16} />
              损耗/替换 {warningProps.filter((p) => p.status !== '混放').length} 件
            </span>
          )}
          <button
            onClick={onAddProp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm"
          >
            <Plus size={16} />
            新增道具
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索道具名、剧本、位置..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PropCategory | '全部')}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                分类: {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PropStatus | '全部')}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                状态: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-50/50">
              <th className="px-6 py-3 font-medium">道具名称</th>
              <th className="px-6 py-3 font-medium">分类</th>
              <th className="px-6 py-3 font-medium">所属剧本</th>
              <th className="px-6 py-3 font-medium">位置</th>
              <th className="px-6 py-3 font-medium">数量</th>
              <th className="px-6 py-3 font-medium">状态</th>
              <th className="px-6 py-3 font-medium">处理进度</th>
              <th className="px-6 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-slate-50 transition ${
                  p.status === '缺失'
                    ? 'bg-red-50/40'
                    : p.status === '混放'
                    ? 'bg-orange-50/40'
                    : p.status === '损耗' || p.status === '替换中'
                    ? 'bg-amber-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-3">
                  <div className="font-medium text-slate-900">{p.name}</div>
                  {p.note && <div className="text-xs text-slate-400 mt-0.5">{p.note}</div>}
                </td>
                <td className="px-6 py-3 text-slate-600">{p.category}</td>
                <td className="px-6 py-3 text-slate-600">{p.scriptName}</td>
                <td className="px-6 py-3 text-slate-600 font-mono text-xs">{p.location}</td>
                <td className="px-6 py-3 text-slate-600">× {p.quantity}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-6 py-3">
                  {(p.status === '缺失' || p.status === '混放') && p.resolveStatus ? (
                    <div className="space-y-1">
                      <ResolveBadge status={p.resolveStatus} />
                      {p.resolvedBy && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={10} />
                          {p.resolvedBy}
                        </div>
                      )}
                      {p.resolveNote && (
                        <div className="text-xs text-slate-400 max-w-[180px] truncate">
                          {p.resolveNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => onQuickAction(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 transition"
                  >
                    <ArrowRightLeft size={12} />
                    登记操作
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  没有匹配的道具
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
