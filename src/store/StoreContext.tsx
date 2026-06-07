import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Prop, ScriptSession, PropRecord, PropStatus, RecordType, SessionChecklist, ChecklistItem } from '../types';
import { mockProps, mockSessions, mockRecords, mockChecklists } from '../data/mockData';

interface StoreContextType {
  props: Prop[];
  sessions: ScriptSession[];
  records: PropRecord[];
  checklists: SessionChecklist[];
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
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'drama-prop-manager-store-v5-checklist';
const SCHEMA_VERSION = 3;

interface StoredState {
  schemaVersion?: number;
  props: Prop[];
  sessions: ScriptSession[];
  records: PropRecord[];
  checklists: SessionChecklist[];
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
  return { schemaVersion: SCHEMA_VERSION, props: mockProps, sessions: mockSessions, records: mockRecords, checklists: mockChecklists };
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

    const newChecklist: SessionChecklist = {
      id: checklistId,
      sessionId: checklist.sessionId,
      sessionName: session.scriptName,
      room: session.room,
      host: session.host,
      items: checklist.items,
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
      }));

    setState((s) => {
      const updatedProps = s.props.map((p) => {
        const checklistItem = checklist.items.find((i) => i.propId === p.id);
        if (!checklistItem) return p;
        if (checklistItem.actualStatus === '缺失') {
          return { ...p, status: '缺失' as PropStatus, updatedAt: todayStr() };
        }
        if (checklistItem.actualStatus === '混放') {
          return { ...p, status: '混放' as PropStatus, updatedAt: todayStr() };
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

  return (
    <StoreContext.Provider
      value={{
        props: state.props,
        sessions: state.sessions,
        records: state.records,
        checklists: state.checklists,
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
