export type ChannelType = 'BI' | 'AS' | 'REG' | 'KEM';

export type SalesforceStatus = 'AVAILABLE' | 'BUSY' | 'AUX' | 'OFFLINE';

export type ZoomStatus = 'READY' | 'IDLE' | 'ON CALL' | 'NOT READY' | 'OFFLINE';

export type ChatStatus =
  | 'Responding'
  | 'Waiting'
  | 'Over SLA'
  | 'Completed'
  | 'Completed - Not Closed';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent' | 'supervisor_whisper';
  text: string;
  timestamp: number;
  isWhisper?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  channel: ChannelType;
  salesforceStatus: SalesforceStatus;
  zoomStatus: ZoomStatus;
  salesforceUserId: string;
  zoomUserId: string;
  lastStatusChange: number;
  zoomCallStartTime?: number | null;
}

export interface Chat {
  id: string; // e.g. "#123"
  customerName: string;
  customerId: string;
  agentId: string;
  channel: ChannelType;
  createdAt: number;
  lastCustomerMessageAt: number;
  lastAgentResponseAt: number;
  completedAt: number | null;
  closedAt: number | null;
  messages: ChatMessage[];
}

export interface ActionLog {
  id: string;
  timestamp: number;
  supervisor: string;
  agentId: string;
  agentName: string;
  chatId?: string;
  actionType: 'CLOSE_CHAT' | 'CHANGE_STATUS' | 'WHISPER' | 'CONFIG_SLA';
  previousValue: string;
  newValue: string;
  result: 'Success' | 'Failed';
  details?: string;
}

export interface ChannelSummary {
  channel: ChannelType;
  online: number;
  available: number;
  activeChat: number;
  waiting: number;
  overSla: number;
}

export interface DashboardMetrics {
  totalAgents: number;
  availableAgents: number;
  activeChats: number;
  waitingChats: number;
  overSlaChats: number;
  zoomOnCall: number;
  completedNotClosed: number;
}

export type QuickFilterType =
  | 'ALL'
  | 'WAITING'
  | 'OVER_SLA'
  | 'COMPLETED_NOT_CLOSED'
  | 'ON_CALL'
  | 'AVAILABLE';

export interface FiltersState {
  channel: 'ALL' | ChannelType;
  agentId: 'ALL' | string;
  chatStatus: 'ALL' | ChatStatus;
  zoomStatus: 'ALL' | ZoomStatus;
  quickFilter: QuickFilterType;
  searchQuery: string;
}
