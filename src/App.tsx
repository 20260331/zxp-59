import { useState } from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { StatCard } from './components/StatCard';
import { PropsPanel } from './components/PropsPanel';
import { SessionsPanel } from './components/SessionsPanel';
import { ActivityTimeline } from './components/ActivityTimeline';
import { HandoverPanel } from './components/HandoverPanel';
import { RecordFormModal } from './components/RecordFormModal';
import { AddPropModal } from './components/AddPropModal';
import type { Prop } from './types';
import {
  Package,
  ArrowRightLeft,
  AlertTriangle,
  AlertCircle,
  CalendarCheck,
  Plus,
  Sparkles,
  ClipboardCheck,
  LayoutDashboard,
  ArrowRightLeft as HandoverIcon,
} from 'lucide-react';

type ViewType = 'dashboard' | 'handover';

function Dashboard() {
  const {
    props,
    todaySessions,
    missingProps,
    warningProps,
    misplacedProps,
    todayRecords,
    sessionsPendingChecklist,
    unresolvedCount,
    inProgressCount,
  } = useStore();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [addPropModalOpen, setAddPropModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Prop | null>(null);

  const handleQuickAction = (prop: Prop) => {
    setSelectedProp(prop);
    setRecordModalOpen(true);
  };

  const handleCloseRecordModal = () => {
    setRecordModalOpen(false);
    setSelectedProp(null);
  };

  const today = new Date();
  const dateDisplay = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekDayDisplay = weekDays[today.getDay()];

  const tabs: { key: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: '总览看板', icon: <LayoutDashboard size={16} /> },
    {
      key: 'handover',
      label: '交班处理',
      icon: <HandoverIcon size={16} />,
      badge: unresolvedCount + inProgressCount > 0 ? unresolvedCount + inProgressCount : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">剧本杀道具管理平台</h1>
                <p className="text-xs text-slate-500">{dateDisplay} · {weekDayDisplay}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecordModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm"
              >
                <Plus size={16} />
                登记操作
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`relative inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  activeView === tab.key
                    ? 'text-primary-600 border-primary-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-red-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeView === 'dashboard' && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="道具总数"
                value={props.length}
                icon={<Package size={22} />}
                tone="default"
                sub="已录入系统"
              />
              <StatCard
                label="今日场次"
                value={todaySessions.length}
                icon={<CalendarCheck size={22} />}
                tone={sessionsPendingChecklist.length > 0 ? 'warn' : 'info'}
                sub={`进行中 ${todaySessions.filter((s) => s.status === '进行中').length} 场${sessionsPendingChecklist.length > 0 ? ` · ${sessionsPendingChecklist.length} 场待核对` : ''}`}
              />
              <StatCard
                label="今日操作"
                value={todayRecords.length}
                icon={<ArrowRightLeft size={22} />}
                tone="success"
                sub="借出/归还/损耗等"
              />
              <StatCard
                label="异常道具"
                value={missingProps.length + warningProps.length}
                icon={missingProps.length > 0 ? <AlertTriangle size={22} /> : <AlertCircle size={22} />}
                tone={missingProps.length > 0 ? 'danger' : 'warn'}
                sub={`缺失 ${missingProps.length} · 混放 ${misplacedProps.length} · 损耗/替换 ${warningProps.length - misplacedProps.length}`}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SessionsPanel />
                <PropsPanel onQuickAction={handleQuickAction} onAddProp={() => setAddPropModalOpen(true)} />
              </div>
              <div className="lg:col-span-1">
                <ActivityTimeline />
              </div>
            </section>
          </>
        )}

        {activeView === 'handover' && <HandoverPanel />}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-slate-400">
        剧本杀道具管理平台 · 第一版 · 为道具师打造
      </footer>

      <RecordFormModal
        open={recordModalOpen}
        onClose={handleCloseRecordModal}
        defaultProp={selectedProp}
      />
      <AddPropModal open={addPropModalOpen} onClose={() => setAddPropModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Dashboard />
    </StoreProvider>
  );
}
