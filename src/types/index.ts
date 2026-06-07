export type ChecklistIssueType = '正常' | '缺失' | '混放';

export interface ChecklistItem {
  propId: string;
  propName: string;
  scriptName: string;
  expectedLocation: string;
  actualStatus: ChecklistIssueType;
  actualLocation?: string;
  quantity: number;
  note?: string;
}

export interface SessionChecklist {
  id: string;
  sessionId: string;
  sessionName: string;
  room: string;
  host: string;
  items: ChecklistItem[];
  missingCount: number;
  misplacedCount: number;
  verifiedBy: string;
  verifiedAt: string;
}

export type PropCategory = '面具' | '徽章' | '密信' | '钥匙' | '信物' | '其他';

export type PropStatus = '在库' | '借出' | '损耗' | '缺失' | '替换中' | '混放';

export interface Prop {
  id: string;
  name: string;
  category: PropCategory;
  scriptName: string;
  location: string;
  status: PropStatus;
  quantity: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptSession {
  id: string;
  scriptName: string;
  room: string;
  host: string;
  startTime: string;
  endTime?: string;
  status: '进行中' | '待开始' | '已结束';
  playerCount: number;
}

export type RecordType = '借出' | '归还' | '损耗' | '替换' | '缺失' | '混放' | '场次核对';

export interface PropRecord {
  id: string;
  propId: string;
  propName: string;
  sessionId?: string;
  sessionName?: string;
  type: RecordType;
  quantity: number;
  operator: string;
  note?: string;
  checklistId?: string;
  timestamp: string;
}
