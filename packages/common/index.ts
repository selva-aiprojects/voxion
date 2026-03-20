export enum CallStatus {
  INCOMING = 'INCOMING',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  AGENT = 'AGENT',
  PERSONAL_USER = 'PERSONAL_USER'
}

export enum ActionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface User {
  id: string; // UUID
  name: string;
  phone: string;
  role: UserRole;
  org_id?: string;
  created_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  tenant_id: string;
  created_at: Date;
}

export interface Call {
  id: string;
  user_id?: string; // FK for personal mode
  org_id?: string;  // FK for org mode
  caller_number: string;
  language: string;
  sentiment?: string;
  summary?: string;
  status: CallStatus;
  created_at: Date;
}

export interface ConversationTurn {
  id: string;
  call_id: string;
  speaker: 'ASSISTANT' | 'USER';
  text: string;
  timestamp: Date;
}

export interface Action {
  id: string;
  call_id: string;
  type: string;
  description: string;
  priority: ActionPriority;
  status: 'PENDING' | 'DONE';
  follow_up_date?: Date;
  assigned_to?: string;
}
