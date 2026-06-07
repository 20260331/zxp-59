import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { RecordBadge, ResolveBadge } from './Badges';
import { SessionChecklistModal } from './SessionChecklistModal';
import type { ScriptSession } from '../types';
import {
  Clock,
  Users,
  MapPin,
  User,
  Play,
  CheckCircle2,
  Timer,
  ClipboardCheck,
  AlertCircle,
  AlertTriangle,
  Eye,
  FileCheck,
} from 'lucide-react';

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
  const { todaySessions, records, getSessionChecklist, sessionsPendingChecklist } = useStore();
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ScriptSession | null>(null);

  const getSessionRecords = (sessionId: string) => {
    return records.filter((r) => r.sessionId === sessionId);
  };

  const handleChecklist = (session: ScriptSession) => {
    setSelectedSession(session);
    setChecklistModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">今日场次流转</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              共 {todaySessions.length} 场 · {todaySessions.filter((s) => s.status === '进行中').length} 场进行中
              {sessionsPendingChecklist.length > 0 && (
                <span className="ml-2 text-amber-600 font-medium">
                  · {sessionsPendingChecklist.length} 场待核对
                </span>
              )}
            </p>
          </div>
          {sessionsPendingChecklist.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              <AlertTriangle size={14} />
              {sessionsPendingChecklist.length} 场待归还核对
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {todaySessions.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">今天还没有场次安排</div>
        )}

        {todaySessions.map((session: ScriptSession) => {
          const sessionRecords = getSessionRecords(session.id);
          const checklist = getSessionChecklist(session.id);
          const hasIssues = checklist && (checklist.missingCount > 0 || checklist.misplacedCount > 0);
          const missingItems = checklist?.items.filter((i) => i.actualStatus === '缺失') || [];
          const misplacedItems = checklist?.items.filter((i) => i.actualStatus === '混放') || [];

          return (
            <div
              key={session.id}
              className={`rounded-xl border p-5 transition ${statusBg[session.status]} ${
                hasIssues ? 'ring-2 ring-red-100' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {checklist && !hasIssues && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <FileCheck size={12} />
                        已核对 · 全部正常
                      </span>
                    )}
                    {checklist && hasIssues && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle size={12} />
                        已核对 · 缺失 {checklist.missingCount} · 混放 {checklist.misplacedCount}
                      </span>
                    )}
                    {!checklist && session.status === '已结束' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        待归还核对
                      </span>
                    )}
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
                <div className="flex items-center gap-2">
                  {session.status === '已结束' && (
                    <button
                      onClick={() => handleChecklist(session)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
                        checklist
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {checklist ? <Eye size={14} /> : <ClipboardCheck size={14} />}
                      {checklist ? '查看核对' : '归还核对'}
                    </button>
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{sessionRecords.length}</div>
                    <div className="text-xs text-slate-500">道具操作次数</div>
                  </div>
                </div>
              </div>

              {(missingItems.length > 0 || misplacedItems.length > 0) && (
                <div className="mt-4 space-y-2 border-t border-red-200/60 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-red-700 flex items-center gap-1">
                      <AlertCircle size={14} />
                      本场次异常道具追踪
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">处理进度:</span>
                      <span className="text-red-600 font-medium">
                        未处理 {[...missingItems, ...misplacedItems].filter((i) => !i.resolveStatus || i.resolveStatus === '未处理').length}
                      </span>
                      <span className="text-sky-600 font-medium">
                        处理中 {[...missingItems, ...misplacedItems].filter((i) => i.resolveStatus === '处理中').length}
                      </span>
                      <span className="text-teal-600 font-medium">
                        已解决 {[...missingItems, ...misplacedItems].filter((i) => i.resolveStatus === '已解决').length}
                      </span>
                    </div>
                  </div>
                  {missingItems.map((item) => (
                    <div
                      key={`missing-${item.propId}`}
                      className="flex items-center gap-3 text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-100 flex-wrap"
                    >
                      <RecordBadge type="缺失" />
                      <span className="font-medium text-slate-800">{item.propName}</span>
                      <span className="text-slate-400">×{item.quantity}</span>
                      <span className="text-xs text-slate-500">
                        应在：{item.expectedLocation}
                      </span>
                      {item.resolveStatus && <ResolveBadge status={item.resolveStatus} />}
                      {item.resolvedBy && (
                        <span className="text-xs text-slate-500">跟进：{item.resolvedBy}</span>
                      )}
                      {item.note && <span className="ml-auto text-xs text-red-600">{item.note}</span>}
                    </div>
                  ))}
                  {misplacedItems.map((item) => (
                    <div
                      key={`misplaced-${item.propId}`}
                      className="flex items-center gap-3 text-sm bg-orange-50 rounded-lg px-3 py-2 border border-orange-100 flex-wrap"
                    >
                      <RecordBadge type="混放" />
                      <span className="font-medium text-slate-800">{item.propName}</span>
                      <span className="text-slate-400">×{item.quantity}</span>
                      <span className="text-xs text-slate-500">
                        应在：{item.expectedLocation}
                      </span>
                      {item.actualLocation && (
                        <span className="text-xs text-orange-600">
                          → 实际：{item.actualLocation}
                        </span>
                      )}
                      {item.resolveStatus && <ResolveBadge status={item.resolveStatus} />}
                      {item.resolvedBy && (
                        <span className="text-xs text-slate-500">跟进：{item.resolvedBy}</span>
                      )}
                      {item.note && !item.actualLocation && (
                        <span className="ml-auto text-xs text-orange-600">{item.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

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

      <SessionChecklistModal
        open={checklistModalOpen}
        onClose={() => {
          setChecklistModalOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
      />
    </div>
  );
}
