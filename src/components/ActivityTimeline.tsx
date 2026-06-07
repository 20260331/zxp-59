import { useStore } from '../store/StoreContext';
import { RecordBadge, ResolveBadge } from './Badges';
import { Activity, ClipboardCheck, PlayCircle, CheckCircle2 } from 'lucide-react';

export function ActivityTimeline() {
  const { todayRecords } = useStore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-slate-900">今日操作流水</h2>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">按时间倒序，共 {todayRecords.length} 条记录</p>
      </div>

      <div className="p-6">
        {todayRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">今天还没有操作记录</div>
        ) : (
          <ol className="relative border-l-2 border-slate-100 space-y-5">
            {todayRecords.map((r) => (
              <li key={r.id} className="pl-5 relative">
                <span
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${
                    r.type === '借出'
                      ? 'bg-blue-500'
                      : r.type === '归还'
                      ? 'bg-emerald-500'
                      : r.type === '损耗'
                      ? 'bg-amber-500'
                      : r.type === '替换'
                      ? 'bg-purple-500'
                      : r.type === '混放'
                      ? 'bg-orange-500'
                      : r.type === '场次核对'
                      ? 'bg-primary-500'
                      : r.type === '开始处理'
                      ? 'bg-sky-500'
                      : r.type === '已解决'
                      ? 'bg-teal-500'
                      : 'bg-red-500'
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <RecordBadge type={r.type} />
                  <span className="font-medium text-slate-900">{r.propName}</span>
                  <span className="text-slate-400 text-sm">×{r.quantity}</span>
                  {r.checklistId && (
                    <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <ClipboardCheck size={10} />
                      场次核对发现
                    </span>
                  )}
                  {r.type === '开始处理' && (
                    <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <PlayCircle size={10} />
                      跟进中
                    </span>
                  )}
                  {r.type === '已解决' && (
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      处理完成
                    </span>
                  )}
                  {r.resolveStatus && r.type !== '开始处理' && r.type !== '已解决' && (
                    <ResolveBadge status={r.resolveStatus} />
                  )}
                  {r.sessionName && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {r.sessionName}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500">
                  <span>操作人：{r.operator}</span>
                  <span>{r.timestamp.split(' ')[1]}</span>
                </div>
                {r.note && (
                  <div className="mt-1 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 inline-block">
                    备注：{r.note}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
