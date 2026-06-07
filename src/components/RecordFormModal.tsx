import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Modal } from './Modal';
import type { Prop, RecordType } from '../types';

const recordTypes: RecordType[] = ['借出', '归还', '损耗', '替换', '缺失'];

export function RecordFormModal({
  open,
  onClose,
  defaultProp,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  defaultProp?: Prop | null;
  defaultType?: RecordType;
}) {
  const { props, sessions, addRecord } = useStore();
  const [propId, setPropId] = useState(defaultProp?.id || '');
  const [type, setType] = useState<RecordType>(defaultType || '借出');
  const [quantity, setQuantity] = useState(1);
  const [operator, setOperator] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setPropId(defaultProp?.id || '');
    setType(defaultType || '借出');
    setQuantity(1);
    setOperator('');
    setSessionId('');
    setNote('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propId) return setError('请选择道具');
    if (!operator.trim()) return setError('请填写操作人');

    const selectedProp = props.find((p) => p.id === propId);
    const selectedSession = sessions.find((s) => s.id === sessionId);

    addRecord({
      propId,
      propName: selectedProp?.name || '',
      sessionId: sessionId || undefined,
      sessionName: selectedSession?.scriptName || undefined,
      type,
      quantity,
      operator: operator.trim(),
      note: note.trim() || undefined,
    });

    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="登记道具操作">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">选择道具 *</label>
          <select
            value={propId}
            onChange={(e) => setPropId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="">请选择道具...</option>
            {props.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.scriptName}）- 当前状态: {p.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">操作类型 *</label>
          <div className="grid grid-cols-5 gap-2">
            {recordTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  type === t
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">操作人 *</label>
            <input
              type="text"
              placeholder="如：小琳"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
        </div>

        {(type === '借出' || type === '归还') && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">关联场次（可选）</label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            >
              <option value="">不关联</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.scriptName} - {s.room}（{s.startTime.split(' ')[1]}）
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea
            rows={2}
            placeholder="如：齿部磨损严重 / 交班盘点发现"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm"
          >
            确认登记
          </button>
        </div>
      </form>
    </Modal>
  );
}
