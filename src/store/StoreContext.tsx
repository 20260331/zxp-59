import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Prop, ScriptSession, PropRecord, PropStatus, RecordType } from '../types';
import { mockProps, mockSessions, mockRecords } from '../data/mockData';

interface StoreContextType {
  props: Prop[];
  sessions: ScriptSession[];
  records: PropRecord[];
  addRecord: (record: Omit<PropRecord, 'id' | 'timestamp'>) => void;
  updatePropStatus: (propId: string, status: PropStatus) => void;
  addProp: (prop: Omit<Prop, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (sessionId: string, updates: Partial<ScriptSession>) => void;
  todaySessions: ScriptSession[];
  todayRecords: PropRecord[];
  missingProps: Prop[];
  warningProps: Prop[];
  misplacedProps: Prop[];
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'drama-prop-manager-store-v4-fresh';
const SCHEMA_VERSION = 2;

interface StoredState {
  schemaVersion?: number;
  props: Prop[];
  sessions: ScriptSession[];
  records: PropRecord[];
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
  return { schemaVersion: SCHEMA_VERSION, props: mockProps, sessions: mockSessions, records: mockRecords };
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
  const missingProps = state.props.filter((p) => p.status === '缺失');
  const misplacedProps = state.props.filter((p) => p.status === '混放');
  const warningProps = state.props.filter(
    (p) => p.status === '损耗' || p.status === '替换中' || p.status === '混放'
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

  return (
    <StoreContext.Provider
      value={{
        props: state.props,
        sessions: state.sessions,
        records: state.records,
        addRecord,
        updatePropStatus,
        addProp,
        updateSession,
        todaySessions,
        todayRecords,
        missingProps,
        warningProps,
        misplacedProps,
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
