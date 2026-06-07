import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Modal } from './Modal';
import type { PropCategory } from '../types';

const categories: PropCategory[] = ['面具', '徽章', '密信', '钥匙', '信物', '其他'];

export function AddPropModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addProp } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PropCategory>('面具');
  const [scriptName, setScriptName] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setCategory('面具');
    setScriptName('');
    setLocation('');
    setQuantity(1);
    setNote('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('请填写道具名称');
    if (!scriptName.trim()) return setError('请填写所属剧本');
    if (!location.trim()) return setError('请填写存放位置');

    addProp({
      name: name.trim(),
      category,
      scriptName: scriptName.trim(),
      location: location.trim(),
      status: '在库',
      quantity,
      note: note.trim() || undefined,
    });

    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="添加新道具">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">道具名称 *</label>
            <input
              type="text"
              placeholder="如：狐妖面具"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PropCategory)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">所属剧本 *</label>
            <input
              type="text"
              placeholder="如：浮生若梦"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">存放位置 *</label>
            <input
              type="text"
              placeholder="如：A柜-1层"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
        </div>

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
          <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea
            rows={2}
            placeholder="外观描述、特殊注意事项等"
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
            添加道具
          </button>
        </div>
      </form>
    </Modal>
  );
}
