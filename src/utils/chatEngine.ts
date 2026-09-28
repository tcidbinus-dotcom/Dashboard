import { Agent, Chat, ChatStatus, ChannelType, ChannelSummary, DashboardMetrics } from '../types';

export function calculateChatStatus(
  chat: Chat,
  currentTime: number,
  slaSeconds: number
): ChatStatus {
  if (chat.completedAt !== null) {
    if (chat.closedAt === null) {
      return 'Completed - Not Closed';
    }
    return 'Completed';
  }

  // Active chat
  if (chat.lastCustomerMessageAt > chat.lastAgentResponseAt) {
    const waitingSeconds = (currentTime - chat.lastCustomerMessageAt) / 1000;
    if (waitingSeconds > slaSeconds) {
      return 'Over SLA';
    }
    return 'Waiting';
  }

  return 'Responding';
}

export function calculateWaitingTimeSeconds(chat: Chat, currentTime: number): number {
  if (chat.completedAt !== null) {
    return 0;
  }
  if (chat.lastCustomerMessageAt > chat.lastAgentResponseAt) {
    return Math.max(0, Math.floor((currentTime - chat.lastCustomerMessageAt) / 1000));
  }
  return 0;
}

export function calculateAgingSeconds(chat: Chat, currentTime: number): number {
  if (chat.completedAt !== null && chat.closedAt === null) {
    return Math.max(0, Math.floor((currentTime - chat.completedAt) / 1000));
  }
  return 0;
}

export function calculateDurationSeconds(chat: Chat, currentTime: number): number {
  const endTime = chat.completedAt || currentTime;
  return Math.max(0, Math.floor((endTime - chat.createdAt) / 1000));
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function sortChats(chats: Chat[], currentTime: number, slaSeconds: number): Chat[] {
  const getRank = (status: ChatStatus): number => {
    switch (status) {
      case 'Over SLA':
        return 1;
      case 'Waiting':
        return 2;
      case 'Completed - Not Closed':
        return 3;
      case 'Responding':
        return 4;
      case 'Completed':
        return 5;
    }
  };

  return [...chats].sort((a, b) => {
    const statusA = calculateChatStatus(a, currentTime, slaSeconds);
    const statusB = calculateChatStatus(b, currentTime, slaSeconds);
    const rankA = getRank(statusA);
    const rankB = getRank(statusB);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Within Over SLA: longest waiting time first
    if (statusA === 'Over SLA') {
      const waitA = calculateWaitingTimeSeconds(a, currentTime);
      const waitB = calculateWaitingTimeSeconds(b, currentTime);
      return waitB - waitA;
    }

    // Within Waiting: longest waiting time first
    if (statusA === 'Waiting') {
      const waitA = calculateWaitingTimeSeconds(a, currentTime);
      const waitB = calculateWaitingTimeSeconds(b, currentTime);
      return waitB - waitA;
    }

    // Within Completed - Not Closed: longest aging first
    if (statusA === 'Completed - Not Closed') {
      const ageA = calculateAgingSeconds(a, currentTime);
      const ageB = calculateAgingSeconds(b, currentTime);
      return ageB - ageA;
    }

    // Within Responding: oldest active first
    return a.createdAt - b.createdAt;
  });
}

export function calculateChannelSummaries(
  channels: ChannelType[],
  agents: Agent[],
  chats: Chat[],
  currentTime: number,
  slaSeconds: number
): ChannelSummary[] {
  return channels.map((channel) => {
    const channelAgents = agents.filter((a) => a.channel === channel);
    const online = channelAgents.filter((a) => a.salesforceStatus !== 'OFFLINE').length;
    const available = channelAgents.filter((a) => a.salesforceStatus === 'AVAILABLE').length;

    const channelChats = chats.filter((c) => c.channel === channel);
    const activeChat = channelChats.filter((c) => c.completedAt === null).length;

    let waiting = 0;
    let overSla = 0;

    channelChats.forEach((c) => {
      const status = calculateChatStatus(c, currentTime, slaSeconds);
      if (status === 'Waiting') waiting++;
      if (status === 'Over SLA') overSla++;
    });

    return {
      channel,
      online,
      available,
      activeChat,
      waiting,
      overSla,
    };
  });
}

export function calculateDashboardMetrics(
  agents: Agent[],
  chats: Chat[],
  currentTime: number,
  slaSeconds: number
): DashboardMetrics {
  const totalAgents = agents.length;
  const availableAgents = agents.filter((a) => a.salesforceStatus === 'AVAILABLE').length;
  const activeChats = chats.filter((c) => c.completedAt === null).length;
  const zoomOnCall = agents.filter((a) => a.zoomStatus === 'ON CALL').length;

  let waitingChats = 0;
  let overSlaChats = 0;
  let completedNotClosed = 0;

  chats.forEach((chat) => {
    const status = calculateChatStatus(chat, currentTime, slaSeconds);
    if (status === 'Waiting') waitingChats++;
    if (status === 'Over SLA') overSlaChats++;
    if (status === 'Completed - Not Closed') completedNotClosed++;
  });

  return {
    totalAgents,
    availableAgents,
    activeChats,
    waitingChats,
    overSlaChats,
    zoomOnCall,
    completedNotClosed,
  };
}
