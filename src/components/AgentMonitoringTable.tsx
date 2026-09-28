import React from 'react';
import { Agent, Chat, SalesforceStatus } from '../types';
import { calculateChatStatus } from '../utils/chatEngine';
import { Users, PhoneCall, MessageSquare, UserCheck, Eye } from 'lucide-react';

interface AgentMonitoringTableProps {
  agents: Agent[];
  chats: Chat[];
  currentTime: number;
  slaSeconds: number;
  onOpenChangeStatus: (agent: Agent) => void;
  onWhisperAgent: (agent: Agent) => void;
  onViewAgentChat: (agent: Agent, chat: Chat) => void;
}

export const AgentMonitoringTable: React.FC<AgentMonitoringTableProps> = ({
  agents,
  chats,
  currentTime,
  slaSeconds,
  onOpenChangeStatus,
  onWhisperAgent,
  onViewAgentChat,
}) => {
  const getAgentChats = (agentId: string) => {
    return chats.filter((c) => c.agentId === agentId);
  };

  const renderOmniStatus = (status: SalesforceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Busy
          </span>
        );
      case 'AUX':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            AUX
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            Offline
          </span>
        );
    }
  };

  const renderZoomStatus = (agent: Agent) => {
    const isCall = agent.zoomStatus === 'ON CALL';

    return (
      <span className={`inline-flex items-center gap-1 text-xs ${
        isCall ? 'font-semibold text-slate-900' : 'text-slate-500'
      }`}>
        {isCall && <PhoneCall className="w-3 h-3 text-slate-700" />}
        <span>{agent.zoomStatus}</span>
      </span>
    );
  };

  return (
    <section aria-label="Agent Combined Monitoring" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 bg-white">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            Agent Monitoring
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            ({agents.length})
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Salesforce Omni & Zoom Telemetry
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4">Agent</th>
              <th className="py-2.5 px-3 w-20">Queue</th>
              <th className="py-2.5 px-4 w-32">Omni Status</th>
              <th className="py-2.5 px-4 w-24 text-right">Active</th>
              <th className="py-2.5 px-4 w-24 text-right">Waiting</th>
              <th className="py-2.5 px-4 w-24 text-right">Over SLA</th>
              <th className="py-2.5 px-4 w-44">Zoom Status</th>
              <th className="py-2.5 px-4 w-48 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {agents.map((agent) => {
              const agentChats = getAgentChats(agent.id);
              const activeChats = agentChats.filter((c) => c.completedAt === null);

              let waitingCount = 0;
              let overSlaCount = 0;

              agentChats.forEach((c) => {
                const s = calculateChatStatus(c, currentTime, slaSeconds);
                if (s === 'Waiting') waitingCount++;
                if (s === 'Over SLA') overSlaCount++;
              });

              const isConflict = agent.zoomStatus === 'ON CALL' && (overSlaCount > 0 || waitingCount > 0);
              const primaryChat = activeChats[0] || agentChats[0];

              return (
                <tr
                  key={agent.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    overSlaCount > 0 ? 'bg-rose-50/15' : ''
                  }`}
                >
                  {/* Agent Details */}
                  <td className="py-2 px-4 align-top">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{agent.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {agent.salesforceUserId} · {agent.zoomUserId}
                      </span>
                    </div>
                  </td>

                  {/* Channel */}
                  <td className="py-2 px-3 align-top font-mono font-semibold text-slate-700">
                    {agent.channel}
                  </td>

                  {/* Omni Status */}
                  <td className="py-2 px-4 align-top">
                    {renderOmniStatus(agent.salesforceStatus)}
                  </td>

                  {/* Active Chats */}
                  <td className="py-2 px-4 text-right align-top font-mono tabular-nums text-slate-800">
                    {activeChats.length}
                  </td>

                  {/* Waiting */}
                  <td className={`py-2 px-4 text-right align-top font-mono tabular-nums ${
                    waitingCount > 0 ? 'font-bold text-slate-900' : 'text-slate-300'
                  }`}>
                    {waitingCount}
                  </td>

                  {/* Over SLA */}
                  <td className={`py-2 px-4 text-right align-top font-mono tabular-nums ${
                    overSlaCount > 0 ? 'font-bold text-rose-600' : 'text-slate-300'
                  }`}>
                    {overSlaCount}
                  </td>

                  {/* Zoom Status */}
                  <td className="py-2 px-4 align-top">
                    <div className="flex flex-col items-start gap-0.5">
                      {renderZoomStatus(agent)}
                      {isConflict && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                          On Zoom Call
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-4 text-right align-top">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {primaryChat && (
                        <button
                          onClick={() => onViewAgentChat(agent, primaryChat)}
                          className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Conversation"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View</span>
                        </button>
                      )}

                      {agent.salesforceStatus !== 'OFFLINE' && (
                        <button
                          onClick={() => onWhisperAgent(agent)}
                          className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Whisper private message"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>Whisper</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenChangeStatus(agent)}
                        className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Change agent Omni status"
                      >
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>Status</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
