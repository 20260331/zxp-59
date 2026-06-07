import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type {
  Prop,
  ScriptSession,
  PropRecord,
  PropStatus,
  RecordType,
  SessionChecklist,
  ChecklistItem,
  UnresolvedIssue,
  ResolveStatus,
  HandoverSession,
} from '../types';
import { mockProps, mockSessions, mockRecords, mockChecklists, mockHandoverSessions } from '../data/mockData';

interface StoreContextType {
  props: Prop[];
  sessions: ScriptSession[];
  records: PropRecord[];
  checklists: SessionChecklist[];
  handoverSessions: HandoverSession[];
  addRecord: (record: Omit<PropRecord, 'id' | 'timestamp'>) => void;
  updatePropStatus: (propId: string, status: PropStatus) => void;
  addProp: (prop: Omit<Prop, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (sessionId: string, updates: Partial<ScriptSession>) => void;
  addSessionChecklist: (checklist: {
    sessionId: string;
    items: ChecklistItem[];
    verifiedBy: string;
  }) => void;
  getSessionChecklist: (sessionId: string) => SessionChecklist | undefined;
  todaySessions: ScriptSession[];
  todayRecords: PropRecord[];
  todayChecklists: SessionChecklist[];
  missingProps: Prop[];
  warningProps: Prop[];
  misplacedProps: Prop[];
  sessionsPendingChecklist: ScriptSession[];
  unresolvedIssues: UnresolvedIssue[];
  unresolvedCount: number;
  inProgressCount: number;
  resolvedTodayCount: number;
  updateIssueResolve: (params: {
    propId: string;
    resolveStatus: ResolveStatus;
    operator: string;
    resolveNote?: string;
    newLocation?: string;
  }) => void;
  createHandover: (params: {
    fromOperator: string;
    toOperator: string;
  }) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'drama-prop-manager-store-v5-checklist';
const SCHEMA_VERSION = 4;

interface StoredState {
  schemaVersion?: number;
  props: Prop[];
  sessions: ScriptSession[];
  records: PropRecord[];
  checklists: SessionChecklist[];
  handoverSessions: HandoverSession[];
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed.schemaVersion === SCHEMA_VERSION) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load store', e);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    props: mockProps,
    sessions: mockSessions,
    records: mockRecords,
    checklists: mockChecklists,
    handoverSessions: mockHandoverSessions,
  };
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }));
  } catch (e) {
    console.error('Failed to save store', e);
  }
}

function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const todaySessions = state.sessions.filter((s) => s.startTime.startsWith(todayStr()));
  const todayRecords = state.records.filter((r) => r.timestamp.startsWith(todayStr()));
  const todayChecklists = state.checklists.filter((c) => c.verifiedAt.startsWith(todayStr()));
  const missingProps = state.props.filter((p) => p.status === '缺失');
  const misplacedProps = state.props.filter((p) => p.status === '混放');
  const warningProps = state.props.filter(
    (p) => p.status === '损耗' || p.status === '替换中' || p.status === '混放'
  );
  const sessionsPendingChecklist = todaySessions.filter(
    (s) => s.status === '已结束' && !state.checklists.some((c) => c.sessionId === s.id)
  );

  const unresolvedIssues: UnresolvedIssue[] = (() => {
    const issues: UnresolvedIssue[] = [];
    const issueMap = new Map<string, UnresolvedIssue>();

    state.checklists.forEach((checklist) => {
      checklist.items.forEach((item) => {
        if (item.actualStatus === '缺失' || item.actualStatus === '混放') {
          if (issueMap.has(item.propId)) return;
          const resolveStatus: ResolveStatus = item.resolveStatus || '未处理';
          const issue: UnresolvedIssue = {
            propId: item.propId,
            propName: item.propName,
            scriptName: item.scriptName,
            issueType: item.actualStatus,
            expectedLocation: item.expectedLocation,
            actualLocation: item.actualLocation,
            quantity: item.quantity,
            sourceChecklistId: checklist.id,
            sourceSessionId: checklist.sessionId,
            sourceSessionName: checklist.sessionName,
            note: item.note,
            resolveStatus,
            resolvedBy: item.resolvedBy,
            resolvedAt: item.resolvedAt,
            resolveNote: item.resolveNote,
            discoveredAt: checklist.verifiedAt,
            discoveredBy: checklist.verifiedBy,
          };
          issueMap.set(item.propId, issue);
          issues.push(issue);
        }
      });
    });

    state.props.forEach((p) => {
      if ((p.status === '缺失' || p.status === '混放') && !issueMap.has(p.id)) {
        const resolveStatus: ResolveStatus = p.resolveStatus || '未处理';
        const discoverRecord = state.records.find(
          (r) => r.propId === p.id && (r.type === '缺失' || r.type === '混放')
        );
        issues.push({
          propId: p.id,
          propName: p.name,
          scriptName: p.scriptName,
          issueType: p.status,
          expectedLocation: p.location,
          quantity: p.quantity,
          note: p.note,
          resolveStatus,
          resolvedBy: p.resolvedBy,
          resolvedAt: p.resolvedAt,
          resolveNote: p.resolveNote,
          discoveredAt: discoverRecord?.timestamp || p.updatedAt,
          discoveredBy: discoverRecord?.operator || '系统',
        });
      }
    });

    return issues;
  })();

  const unresolvedCount = unresolvedIssues.filter((i) => i.resolveStatus === '未处理').length;
  const inProgressCount = unresolvedIssues.filter((i) => i.resolveStatus === '处理中').length;
  const resolvedTodayCount = todayRecords.filter(
    (r) => r.type === '已解决'
  ).length;

  const addRecord = (record: Omit<PropRecord, 'id' | 'timestamp'>) => {
    const newRecord: PropRecord = {
      ...record,
      id: `r-${Date.now()}`,
      timestamp: nowTimestamp(),
    };
    setState((s) => {
      let updatedProps = s.props;
      const prop = s.props.find((p) => p.id === record.propId);
      if (prop) {
        let newStatus: PropStatus = prop.status;
        if (record.type === '借出') newStatus = '借出';
        else if (record.type === '归还') newStatus = '在库';
        else if (record.type === '损耗') newStatus = '损耗';
        else if (record.type === '缺失') newStatus = '缺失';
        else if (record.type === '替换') newStatus = '替换中';
        else if (record.type === '混放') newStatus = '混放';
        else if (record.type === '已解决') newStatus = '在库';

        updatedProps = s.props.map((p) =>
          p.id === record.propId ? { ...p, status: newStatus, updatedAt: todayStr() } : p
        );
      }
      return { ...s, records: [newRecord, ...s.records], props: updatedProps };
    });
  };

  const updatePropStatus = (propId: string, status: PropStatus) => {
    setState((s) => ({
      ...s,
      props: s.props.map((p) =>
        p.id === propId ? { ...p, status, updatedAt: todayStr() } : p
      ),
    }));
  };

  const addProp = (prop: Omit<Prop, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProp: Prop = {
      ...prop,
      id: `p-${Date.now()}`,
      createdAt: todayStr(),
      updatedAt: todayStr(),
    };
    setState((s) => ({ ...s, props: [...s.props, newProp] }));
  };

  const updateSession = (sessionId: string, updates: Partial<ScriptSession>) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, ...updates } : sess
      ),
    }));
  };

  const addSessionChecklist = (checklist: {
    sessionId: string;
    items: ChecklistItem[];
    verifiedBy: string;
  }) => {
    const session = state.sessions.find((s) => s.id === checklist.sessionId);
    if (!session) return;

    const missingCount = checklist.items.filter((i) => i.actualStatus === '缺失').length;
    const misplacedCount = checklist.items.filter((i) => i.actualStatus === '混放').length;
    const checklistId = `cl-${Date.now()}`;
    const verifiedAt = nowTimestamp();

    const itemsWithResolveStatus = checklist.items.map((item) => ({
      ...item,
      resolveStatus: item.actualStatus !== '正常' ? (item.resolveStatus || '未处理' as ResolveStatus) : undefined,
    }));

    const newChecklist: SessionChecklist = {
      id: checklistId,
      sessionId: checklist.sessionId,
      sessionName: session.scriptName,
      room: session.room,
      host: session.host,
      items: itemsWithResolveStatus,
      missingCount,
      misplacedCount,
      verifiedBy: checklist.verifiedBy,
      verifiedAt,
    };

    const checklistRecords: PropRecord[] = checklist.items
      .filter((i) => i.actualStatus !== '正常')
      .map((item, idx) => ({
        id: `r-${Date.now()}-${idx}`,
        propId: item.propId,
        propName: item.propName,
        sessionId: checklist.sessionId,
        sessionName: session.scriptName,
        type: item.actualStatus as RecordType,
        quantity: item.quantity,
        operator: checklist.verifiedBy,
        note: item.note || (item.actualStatus === '混放' && item.actualLocation ? `实际位置: ${item.actualLocation}` : undefined),
        checklistId,
        timestamp: verifiedAt,
        resolveStatus: '未处理' as ResolveStatus,
      }));

    setState((s) => {
      const updatedProps = s.props.map((p) => {
        const checklistItem = checklist.items.find((i) => i.propId === p.id);
        if (!checklistItem) return p;
        if (checklistItem.actualStatus === '缺失') {
          return { ...p, status: '缺失' as PropStatus, resolveStatus: '未处理' as ResolveStatus, updatedAt: todayStr() };
        }
        if (checklistItem.actualStatus === '混放') {
          return { ...p, status: '混放' as PropStatus, resolveStatus: '未处理' as ResolveStatus, updatedAt: todayStr() };
        }
        return p;
      });

      return {
        ...s,
        checklists: [newChecklist, ...s.checklists],
        records: [...checklistRecords, ...s.records],
        props: updatedProps,
      };
    });
  };

  const getSessionChecklist = (sessionId: string) => {
    return state.checklists.find((c) => c.sessionId === sessionId);
  };

  const updateIssueResolve = (params: {
    propId: string;
    resolveStatus: ResolveStatus;
    operator: string;
    resolveNote?: string;
    newLocation?: string;
  }) => {
    const { propId, resolveStatus, operator, resolveNote, newLocation } = params;
    const now = nowTimestamp();

    const recordType: RecordType = resolveStatus === '处理中' ? '开始处理' : '已解决';
    const newRecord: PropRecord = {
      id: `r-${Date.now()}`,
      propId,
      propName: state.props.find((p) => p.id === propId)?.name || '',
      type: recordType,
      quantity: 1,
      operator,
      note: resolveNote,
      timestamp: now,
      resolveStatus,
    };

    setState((s) => {
      const updatedProps = s.props.map((p) => {
        if (p.id !== propId) return p;
        const updates: Partial<Prop> = {
          resolveStatus,
          resolveNote,
          updatedAt: todayStr(),
        };
        if (resolveStatus === '处理中') {
          updates.resolvedBy = operator;
        }
        if (resolveStatus === '已解决') {
          updates.resolvedBy = operator;
          updates.resolvedAt = now;
          updates.status = '在库';
          if (newLocation) updates.location = newLocation;
        }
        return { ...p, ...updates };
      });

      const updatedChecklists = s.checklists.map((c) => ({
        ...c,
        items: c.items.map((item) => {
          if (item.propId !== propId) return item;
          const updates: Partial<ChecklistItem> = {
            resolveStatus,
            resolveNote,
          };
          if (resolveStatus === '处理中') {
            updates.resolvedBy = operator;
          }
          if (resolveStatus === '已解决') {
            updates.resolvedBy = operator;
            updates.resolvedAt = now;
          }
          return { ...item, ...updates };
        }),
      }));

      return {
        ...s,
        props: updatedProps,
        checklists: updatedChecklists,
        records: [newRecord, ...s.records],
      };
    });
  };

  const createHandover = (params: {
    fromOperator: string;
    toOperator: string;
  }) => {
    const { fromOperator, toOperator } = params;
    const totalIssues = unresolvedIssues.length;
    const alreadyResolved = unresolvedIssues.filter((i) => i.resolveStatus === '已解决').length;

    const newHandover: HandoverSession = {
      id: `h-${Date.now()}`,
      fromOperator,
      toOperator,
      createdAt: nowTimestamp(),
      resolvedCount: alreadyResolved,
      totalCount: totalIssues,
    };

    setState((s) => ({
      ...s,
      handoverSessions: [newHandover, ...s.handoverSessions],
    }));
  };

  return (
    <StoreContext.Provider
      value={{
        props: state.props,
        sessions: state.sessions,
        records: state.records,
        checklists: state.checklists,
        handoverSessions: state.handoverSessions,
        addRecord,
        updatePropStatus,
        addProp,
        updateSession,
        addSessionChecklist,
        getSessionChecklist,
        todaySessions,
        todayRecords,
        todayChecklists,
        missingProps,
        warningProps,
        misplacedProps,
        sessionsPendingChecklist,
        unresolvedIssues,
        unresolvedCount,
        inProgressCount,
        resolvedTodayCount,
        updateIssueResolve,
        createHandover,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
