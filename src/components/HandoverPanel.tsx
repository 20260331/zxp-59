import { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { RecordBadge, ResolveBadge } from './Badges';
import type { UnresolvedIssue, ResolveStatus } from '../types';
import {
  AlertTriangle,
  AlertCircle,
  MapPinOff,
  MapPin,
  Clock,
  User,
  PlayCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRightLeft,
  Send,
  Filter,
  Sparkles,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

export function HandoverPanel() {
  const {
    unresolvedIssues,
    unresolvedCount,
    inProgressCount,
    resolvedTodayCount,
    updateIssueResolve,
    createHandover,
    handoverSessions,
  } = useStore();

  const [filterStatus, setFilterStatus] = useState<'全部' | ResolveStatus>('全部');
  const [filterType, setFilterType] = useState<'全部' | '缺失' | '混放'>('全部');
  const [operator, setOperator] = useState('');
  const [fromOperator, setFromOperator] = useState('');
  const [toOperator, setToOperator] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [locationInputs, setLocationInputs] = useState<Record<string, string>>({});
  const [handoverSuccess, setHandoverSuccess] = useState(false);

  const filteredIssues = useMemo(() => {
    return unresolvedIssues.filter((issue) => {
      if (filterStatus !== '全部' && issue.resolveStatus !== filterStatus) return false;
      if (filterType !== '全部' && issue.issueType !== filterType) return false;
      return true;
    });
  }, [unresolvedIssues, filterStatus, filterType]);

  const groupedBySession = useMemo(() => {
    const groups = new Map<string, UnresolvedIssue[]>();
    filteredIssues.forEach((issue) => {
      const key = issue.sourceSessionName || '无场次关联';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(issue);
    });
    return Array.from(groups.entries());
  }, [filteredIssues]);

  const handleStartProcess = (issue: UnresolvedIssue) => {
    if (!operator.trim()) return;
    updateIssueResolve({
      propId: issue.propId,
      resolveStatus: '处理中',
      operator: operator.trim(),
      resolveNote: noteInputs[issue.propId] || undefined,
    });
    setNoteInputs((prev) => ({ ...prev, [issue.propId]: '' }));
  };

  const handleResolve = (issue: UnresolvedIssue) => {
    if (!operator.trim()) return;
    updateIssueResolve({
      propId: issue.propId,
      resolveStatus: '已解决',
      operator: operator.trim(),
      resolveNote: noteInputs[issue.propId] || undefined,
      newLocation: locationInputs[issue.propId] || undefined,
    });
    setNoteInputs((prev) => ({ ...prev, [issue.propId]: '' }));
    setLocationInputs((prev) => ({ ...prev, [issue.propId]: '' }));
  };

  const handleReset = (issue: UnresolvedIssue) => {
    if (!operator.trim()) return;
    updateIssueResolve({
      propId: issue.propId,
      resolveStatus: '未处理',
      operator: operator.trim(),
    });
  };

  const handleCreateHandover = () => {
    if (!fromOperator.trim() || !toOperator.trim()) return;
    createHandover({
      fromOperator: fromOperator.trim(),
      toOperator: toOperator.trim(),
    });
    setFromOperator('');
    setToOperator('');
    setHandoverSuccess(true);
    setTimeout(() => setHandoverSuccess(false), 3000);
  };

  const totalIssues = unresolvedIssues.length;
  const totalResolved = unresolvedIssues.filter((i) => i.resolveStatus === '已解决').length;
  const progressPct = totalIssues > 0 ? Math.round((totalResolved / totalIssues) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">异常总数</div>
              <div className="mt-1 text-3xl font-bold text-slate-900">{totalIssues}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <ClipboardList size={22} />
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs text-slate-500">整体进度 {progressPct}%</div>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600">未处理</div>
              <div className="mt-1 text-3xl font-bold text-red-700">{unresolvedCount}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertCircle size={22} />
            </div>
          </div>
          <div className="mt-2 text-xs text-red-500">需要优先处理</div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-sky-600">处理中</div>
              <div className="mt-1 text-3xl font-bold text-sky-700">{inProgressCount}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
              <RefreshCw size={22} />
            </div>
          </div>
          <div className="mt-2 text-xs text-sky-500">正在跟进中</div>
        </div>

        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-teal-600">今日已解决</div>
              <div className="mt-1 text-3xl font-bold text-teal-700">{resolvedTodayCount}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="mt-2 text-xs text-teal-500">干得不错！</div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft size={18} className="text-primary-600" />
                  交班待处理清单
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  共 {filteredIssues.length} 项待跟进
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-primary-500"
                  >
                    <option value="全部">状态：全部</option>
                    <option value="未处理">未处理</option>
                    <option value="处理中">处理中</option>
                    <option value="已解决">已解决</option>
                  </select>
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-primary-500"
                >
                  <option value="全部">类型：全部</option>
                  <option value="缺失">缺失</option>
                  <option value="混放">混放</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                当前处理人（用于所有操作记录）
              </label>
              <input
                type="text"
                placeholder="请输入你的名字，如：阿杰"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              />
            </div>

            <div className="p-6 space-y-6 max-h-[520px] overflow-y-auto">
              {filteredIssues.length === 0 && (
                <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center gap-2">
                  <Sparkles size={32} className="text-emerald-400" />
                  <div>太棒了！当前没有待处理的异常</div>
                </div>
              )}

              {groupedBySession.map(([sessionName, issues]) => (
                <div key={sessionName} className="space-y-3">
                  <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary-500" />
                    {sessionName}
                    <span className="text-xs font-normal text-slate-400">
                      · {issues.length} 项
                    </span>
                  </div>
                  <div className="space-y-3">
                    {issues.map((issue) => {
                      const isExpanded = expandedId === issue.propId;
                      const noteVal = noteInputs[issue.propId] || '';
                      const locVal = locationInputs[issue.propId] || '';
                      return (
                        <div
                          key={issue.propId}
                          className={`rounded-xl border transition ${
                            issue.resolveStatus === '未处理'
                              ? 'border-red-200 bg-red-50/30'
                              : issue.resolveStatus === '处理中'
                              ? 'border-sky-200 bg-sky-50/30'
                              : 'border-teal-200 bg-teal-50/30'
                          }`}
                        >
                          <div
                            className="p-4 cursor-pointer hover:bg-white/60 transition"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : issue.propId)
                            }
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {issue.issueType === '缺失' ? (
                                    <AlertTriangle size={16} className="text-red-500" />
                                  ) : (
                                    <MapPinOff size={16} className="text-orange-500" />
                                  )}
                                  <span className="font-semibold text-slate-900">
                                    {issue.propName}
                                  </span>
                                  <RecordBadge type={issue.issueType} />
                                  <ResolveBadge status={issue.resolveStatus} />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={12} />
                                    应在：{issue.expectedLocation}
                                  </span>
                                  {issue.actualLocation && (
                                    <span className="inline-flex items-center gap-1 text-orange-600">
                                      <ArrowRight size={12} />
                                      实际：{issue.actualLocation}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <User size={12} />
                                    发现人：{issue.discoveredBy}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={12} />
                                    {issue.discoveredAt.split(' ')[1]}
                                  </span>
                                  <span>×{issue.quantity}</span>
                                </div>
                                {issue.note && (
                                  <div className="mt-1.5 text-xs text-slate-500 bg-white/60 rounded px-2 py-1 inline-block">
                                    备注：{issue.note}
                                  </div>
                                )}
                                {issue.resolveStatus !== '未处理' && issue.resolvedBy && (
                                  <div className="mt-1.5 text-xs text-slate-500">
                                    跟进人：{issue.resolvedBy}
                                    {issue.resolvedAt &&
                                      ` · ${issue.resolvedAt.split(' ')[1]}`}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                {isExpanded ? '收起' : '展开操作'}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-200/60 p-4 bg-white/50 space-y-3">
                              {issue.issueType === '混放' && (
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
                                    归位位置（解决时写入）
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={`标准位置：${issue.expectedLocation}`}
                                    value={locVal}
                                    onChange={(e) =>
                                      setLocationInputs((prev) => ({
                                        ...prev,
                                        [issue.propId]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  处理备注
                                </label>
                                <input
                                  type="text"
                                  placeholder="可选，如：找到备用件 / 已联系上周DM"
                                  value={noteVal}
                                  onChange={(e) =>
                                    setNoteInputs((prev) => ({
                                      ...prev,
                                      [issue.propId]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {issue.resolveStatus !== '处理中' &&
                                  issue.resolveStatus !== '已解决' && (
                                    <button
                                      onClick={() => handleStartProcess(issue)}
                                      disabled={!operator.trim()}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <PlayCircle size={14} />
                                      开始处理
                                    </button>
                                  )}
                                {issue.resolveStatus !== '已解决' && (
                                  <button
                                    onClick={() => handleResolve(issue)}
                                    disabled={!operator.trim()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <CheckCircle2 size={14} />
                                    标记已解决
                                  </button>
                                )}
                                {issue.resolveStatus !== '未处理' && (
                                  <button
                                    onClick={() => handleReset(issue)}
                                    disabled={!operator.trim()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <RefreshCw size={14} />
                                    重置为未处理
                                  </button>
                                )}
                              </div>
                              {!operator.trim() && (
                                <div className="text-xs text-amber-600">
                                  请先在上方填写当前处理人姓名
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-primary-600" />
                创建交班记录
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                将当前异常清单移交给下一班
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">交班人 *</label>
                <input
                  type="text"
                  placeholder="如：小琳"
                  value={fromOperator}
                  onChange={(e) => setFromOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">接班人 *</label>
                <input
                  type="text"
                  placeholder="如：阿杰"
                  value={toOperator}
                  onChange={(e) => setToOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>待移交异常总数</span>
                  <span className="font-semibold text-slate-900">{totalIssues}</span>
                </div>
                <div className="flex justify-between">
                  <span>其中已解决</span>
                  <span className="font-semibold text-teal-600">{totalResolved}</span>
                </div>
                <div className="flex justify-between">
                  <span>待下一班跟进</span>
                  <span className="font-semibold text-red-600">{totalIssues - totalResolved}</span>
                </div>
              </div>
              {handoverSuccess && (
                <div className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  交班记录已创建！
                </div>
              )}
              <button
                onClick={handleCreateHandover}
                disabled={!fromOperator.trim() || !toOperator.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft size={16} />
                确认交班
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">最近交班记录</h2>
              <p className="text-sm text-slate-500 mt-0.5">历史交接班情况</p>
            </div>
            <div className="p-6 space-y-3">
              {handoverSessions.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  暂无交班记录
                </div>
              )}
              {handoverSessions.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{h.fromOperator}</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{h.toOperator}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{h.createdAt.split(' ')[1]}</span>
                    <span>
                      已解决 <span className="font-semibold text-teal-600">{h.resolvedCount}</span>
                      {' / '}
                      共 <span className="font-semibold text-slate-700">{h.totalCount}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
