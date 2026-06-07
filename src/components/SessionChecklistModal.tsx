import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { Modal } from './Modal';
import type { ScriptSession, ChecklistItem, ChecklistIssueType } from '../types';
import { MapPin, AlertCircle, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

export function SessionChecklistModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: ScriptSession | null;
}) {
  const { props, records, addSessionChecklist, getSessionChecklist } = useStore();
  const [verifiedBy, setVerifiedBy] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState('');

  const existingChecklist = useMemo(() => {
    if (!session) return undefined;
    return getSessionChecklist(session.id);
  }, [session, getSessionChecklist]);

  useEffect(() => {
    if (!open || !session) return;
    setVerifiedBy('');
    setError('');

    if (existingChecklist) {
      setItems(existingChecklist.items);
      setVerifiedBy(existingChecklist.verifiedBy);
      return;
    }

    const borrowedPropIds = new Set(
      records
        .filter((r) => r.sessionId === session.id && r.type === '借出')
        .map((r) => r.propId)
    );

    const scriptProps = props.filter((p) => p.scriptName === session.scriptName);
    const borrowedProps = props.filter((p) => borrowedPropIds.has(p.id));

    const uniqueProps = new Map<string, typeof props[0]>();
    [...scriptProps, ...borrowedProps].forEach((p) => uniqueProps.set(p.id, p));

    const checklistItems: ChecklistItem[] = Array.from(uniqueProps.values()).map((p) => ({
      propId: p.id,
      propName: p.name,
      scriptName: p.scriptName,
      expectedLocation: p.location,
      actualStatus: '正常' as ChecklistIssueType,
      quantity: p.quantity,
    }));

    setItems(checklistItems);
  }, [open, session, existingChecklist, props, records]);

  const updateItemStatus = (propId: string, status: ChecklistIssueType) => {
    setItems((prev) =>
      prev.map((it) =>
        it.propId === propId
          ? { ...it, actualStatus: status, actualLocation: status !== '混放' ? undefined : it.actualLocation }
          : it
      )
    );
  };

  const updateItemLocation = (propId: string, location: string) => {
    setItems((prev) =>
      prev.map((it) => (it.propId === propId ? { ...it, actualLocation: location } : it))
    );
  };

  const updateItemNote = (propId: string, note: string) => {
    setItems((prev) =>
      prev.map((it) => (it.propId === propId ? { ...it, note: note || undefined } : it))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!verifiedBy.trim()) return setError('请填写核对人');

    addSessionChecklist({
      sessionId: session.id,
      items,
      verifiedBy: verifiedBy.trim(),
    });

    onClose();
  };

  if (!session) return null;

  const isReadonly = !!existingChecklist;
  const issueCount = items.filter((i) => i.actualStatus !== '正常').length;

  return (
    <Modal open={open} onClose={onClose} title={isReadonly ? '查看归还核对清单' : '场次归还核对'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-1">
          <div className="font-semibold text-slate-900">{session.scriptName}</div>
          <div className="text-sm text-slate-500">
            {session.room} · DM: {session.host} · {session.startTime.split(' ')[1]}
            {session.endTime ? ` - ${session.endTime.split(' ')[1]}` : ''}
          </div>
          {isReadonly && (
            <div className="text-xs text-slate-500 mt-2">
              核对人：{existingChecklist!.verifiedBy} · 核对时间：{existingChecklist!.verifiedAt.split(' ')[1]}
            </div>
          )}
        </div>

        {!isReadonly && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">核对人 *</label>
            <input
              type="text"
              placeholder="如：小琳"
              value={verifiedBy}
              onChange={(e) => setVerifiedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">道具清单</span>
            </div>
            <span className="text-xs text-slate-500">
              共 {items.length} 件 · {issueCount > 0 ? <span className="text-red-600 font-medium">{issueCount} 项异常</span> : '全部正常'}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">本场次暂无关联道具</div>
            ) : (
              items.map((item) => (
                <div key={item.propId} className="p-4 hover:bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{item.propName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        标准位置：{item.expectedLocation}
                        <span className="mx-1">·</span>
                        {item.scriptName}
                        <span className="mx-1">·</span>
                        ×{item.quantity}
                      </div>
                    </div>
                  </div>

                  {!isReadonly ? (
                    <div className="flex gap-2">
                      {(['正常', '缺失', '混放'] as ChecklistIssueType[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateItemStatus(item.propId, s)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                            item.actualStatus === s
                              ? s === '正常'
                                ? 'bg-emerald-600 text-white'
                                : s === '缺失'
                                ? 'bg-red-600 text-white'
                                : 'bg-orange-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {s === '正常' && <CheckCircle2 size={12} />}
                          {s === '缺失' && <AlertCircle size={12} />}
                          {s === '混放' && <AlertTriangle size={12} />}
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.actualStatus === '正常'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.actualStatus === '缺失'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {item.actualStatus}
                    </span>
                  )}

                  {item.actualStatus === '混放' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">实际发现位置</label>
                      <input
                        type="text"
                        placeholder="如：C柜-2层"
                        value={item.actualLocation || ''}
                        onChange={(e) => updateItemLocation(item.propId, e.target.value)}
                        disabled={isReadonly}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">备注</label>
                    <input
                      type="text"
                      placeholder="可选"
                      value={item.note || ''}
                      onChange={(e) => updateItemNote(item.propId, e.target.value)}
                      disabled={isReadonly}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            {isReadonly ? '关闭' : '取消'}
          </button>
          {!isReadonly && (
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm"
            >
              确认提交
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
