import React from 'react';
import { Chat, Agent, ChatStatus } from '../types';
import {
  calculateChatStatus,
  calculateWaitingTimeSeconds,
  calculateAgingSeconds,
  calculateDurationSeconds,
  formatDuration,
} from '../utils/chatEngine';
import {
  AlertTriangle,
  Eye,
  MessageSquare,
  XCircle,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';

interface ChatMonitoringTableProps {
  chats: Chat[];
  agents: Agent[];
  currentTime: number;
  slaSeconds: number;
  onViewChat: (chat: Chat) => void;
  onWhisperChat: (chat: Chat, agent: Agent) => void;
  onCloseChat: (chat: Chat, agent: Agent) => void;
}

export const ChatMonitoringTable: React.FC<ChatMonitoringTableProps> = ({
  chats,
  agents,
  currentTime,
  slaSeconds,
  onViewChat,
  onWhisperChat,
  onCloseChat,
}) => {
  const getAgent = (agentId: string): Agent | undefined => {
    return agents.find((a) => a.id === agentId);
  };

  const renderStatusBadge = (status: ChatStatus) => {
    switch (status) {
      case 'Over SLA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>OVER SLA</span>
          </span>
        );
      case 'Waiting':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Waiting</span>
          </span>
        );
      case 'Responding':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Responding</span>
          </span>
        );
      case 'Completed - Not Closed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-800">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>Completed - Not Closed</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Completed</span>
          </span>
        );
    }
  };

  const renderZoomBadge = (agent?: Agent, chatStatus?: ChatStatus) => {
    if (!agent) {
      return <span className="text-xs text-slate-400">-</span>;
    }

    const isOnCall = agent.zoomStatus === 'ON CALL';
    const isConflict = isOnCall && (chatStatus === 'Over SLA' || chatStatus === 'Waiting');

    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className={`inline-flex items-center gap-1 text-xs ${
          isOnCall ? 'text-slate-900 font-semibold' : 'text-slate-600'
        }`}>
          {isOnCall && <PhoneCall className="w-3 h-3 text-slate-700" />}
          <span>{agent.zoomStatus}</span>
        </span>
        {isConflict && (
          <span className="text-[10px] text-amber-800 bg-amber-50/80 px-1 rounded border border-amber-200">
            Handling Zoom Call
          </span>
        )}
      </div>
    );
  };

  return (
    <section aria-label="Chat Monitoring Table" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            Chat Monitoring
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            ({chats.length})
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
          <span>Priority sorted: Over SLA first</span>
        </div>
      </div>

      {/* Table / Empty State */}
      {chats.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-800">
            No chats match the selected criteria
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-28">Chat ID</th>
                <th className="py-2.5 px-4">Agent</th>
                <th className="py-2.5 px-3 w-20">Queue</th>
                <th className="py-2.5 px-4 w-44">Status</th>
                <th className="py-2.5 px-4 w-28 text-right">Waiting Time</th>
                <th className="py-2.5 px-4 w-32 text-right">Duration / Aging</th>
                <th className="py-2.5 px-4 w-48">Zoom Context</th>
                <th className="py-2.5 px-4 w-36 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {chats.map((chat) => {
                const agent = getAgent(chat.agentId);
                const status = calculateChatStatus(chat, currentTime, slaSeconds);
                const waitingSeconds = calculateWaitingTimeSeconds(chat, currentTime);
                const agingSeconds = calculateAgingSeconds(chat, currentTime);
                const durationSeconds = calculateDurationSeconds(chat, currentTime);

                const isOverSla = status === 'Over SLA';
                const isWaiting = status === 'Waiting';
                const isCompletedNotClosed = status === 'Completed - Not Closed';

                return (
                  <tr
                    key={chat.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isOverSla ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Chat ID & Customer */}
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 align-top">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{chat.id}</span>
                        <span className="text-[11px] font-sans font-normal text-slate-500 truncate max-w-[110px]" title={chat.customerName}>
                          {chat.customerName}
                        </span>
                      </div>
                    </td>

                    {/* Agent Details */}
                    <td className="py-2.5 px-4 align-top">
                      {agent ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {agent.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {agent.salesforceUserId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="py-2.5 px-3 align-top">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {chat.channel}
                      </span>
                    </td>

                    {/* Chat Status */}
                    <td className="py-2.5 px-4 align-top">
                      {renderStatusBadge(status)}
                    </td>

                    {/* Waiting Time */}
                    <td className="py-2.5 px-4 text-right align-top font-mono tabular-nums">
                      {isWaiting || isOverSla ? (
                        <div className="flex items-center justify-end gap-1">
                          {isOverSla && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          <span
                            className={`font-bold ${
                              isOverSla ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {formatDuration(waitingSeconds)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-normal">--:--</span>
                      )}
                    </td>

                    {/* Duration or Aging */}
                    <td className="py-2.5 px-4 text-right align-top font-mono tabular-nums">
                      {isCompletedNotClosed ? (
                        <div className="flex flex-col items-end">
                          <span className="text-orange-800 font-bold">
                            {formatDuration(agingSeconds)}
                          </span>
                          <span className="text-[10px] text-orange-700 font-sans uppercase">
                            Aging
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {formatDuration(durationSeconds)}
                        </span>
                      )}
                    </td>

                    {/* Zoom Status */}
                    <td className="py-2.5 px-4 align-top">
                      {renderZoomBadge(agent, status)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Chat */}
                        <button
                          onClick={() => onViewChat(chat)}
                          className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Conversation"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View</span>
                        </button>

                        {/* Whisper Button */}
                        {agent && status !== 'Completed' && (
                          <button
                            onClick={() => onWhisperChat(chat, agent)}
                            className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Whisper private message"
                          >
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            <span>Whisper</span>
                          </button>
                        )}

                        {/* Close Chat Button */}
                        {isCompletedNotClosed && agent && (
                          <button
                            onClick={() => onCloseChat(chat, agent)}
                            className="px-2 py-1 rounded text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Close Completed Chat"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Close</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
