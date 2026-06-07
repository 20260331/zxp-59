import { useStore } from '../store/StoreContext';
import { RecordBadge } from './Badges';
import { Clock, Users, MapPin, User, Play, CheckCircle2, Timer } from 'lucide-react';
import type { ScriptSession } from '../types';

const statusIcon = {
  进行中: <Timer size={16} className="text-blue-500" />,
  待开始: <Play size={16} className="text-slate-400" />,
  已结束: <CheckCircle2 size={16} className="text-emerald-500" />,
};

const statusBg = {
  进行中: 'border-blue-200 bg-blue-50/40',
  待开始: 'border-slate-200 bg-slate-50',
  已结束: 'border-emerald-200 bg-emerald-50/40',
};

export function SessionsPanel() {
  const { todaySessions, records } = useStore();

  const getSessionRecords = (sessionId: string) => {
    return records.filter((r) => r.sessionId === sessionId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">今日场次流转</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          共 {todaySessions.length} 场 · {todaySessions.filter((s) => s.status === '进行中').length} 场进行中
        </p>
      </div>

      <div className="p-6 space-y-4">
        {todaySessions.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">今天还没有场次安排</div>
        )}

        {todaySessions.map((session: ScriptSession) => {
          const sessionRecords = getSessionRecords(session.id);
          return (
            <div
              key={session.id}
              className={`rounded-xl border p-5 transition ${statusBg[session.status]}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    {statusIcon[session.status]}
                    <h3 className="font-semibold text-slate-900">{session.scriptName}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        session.status === '进行中'
                          ? 'bg-blue-100 text-blue-700'
                          : session.status === '已结束'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {session.room}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User size={14} />
                      DM: {session.host}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      {session.playerCount} 人
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {session.startTime.split(' ')[1]}
                      {session.endTime && ` - ${session.endTime.split(' ')[1]}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{sessionRecords.length}</div>
                  <div className="text-xs text-slate-500">道具操作次数</div>
                </div>
              </div>

              {sessionRecords.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-4">
                  {sessionRecords.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 text-sm bg-white/70 rounded-lg px-3 py-2"
                    >
                      <RecordBadge type={r.type} />
                      <span className="font-medium text-slate-800">{r.propName}</span>
                      <span className="text-slate-400">×{r.quantity}</span>
                      <span className="ml-auto text-xs text-slate-500">
                        {r.operator} · {r.timestamp.split(' ')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-400 italic">暂无道具流转记录</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
