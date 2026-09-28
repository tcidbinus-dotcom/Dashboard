import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Agent,
  Chat,
  ActionLog,
  ChannelType,
  SalesforceStatus,
  FiltersState,
  QuickFilterType,
} from './types';
import {
  SUPPORTED_CHANNELS,
  INITIAL_SLA_SECONDS,
  INITIAL_AGENTS,
  INITIAL_CHATS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import {
  calculateChatStatus,
  calculateChannelSummaries,
  calculateDashboardMetrics,
  sortChats,
} from './utils/chatEngine';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { ChannelOverview } from './components/ChannelOverview';
import { FilterBar } from './components/FilterBar';
import { ChatMonitoringTable } from './components/ChatMonitoringTable';
import { AgentMonitoringTable } from './components/AgentMonitoringTable';
import { ViewChatModal } from './components/modals/ViewChatModal';
import { WhisperModal } from './components/modals/WhisperModal';
import { ChangeAgentStatusModal } from './components/modals/ChangeAgentStatusModal';
import { CloseChatModal } from './components/modals/CloseChatModal';
import { AuditLogModal } from './components/modals/AuditLogModal';
import { SlaConfigModal } from './components/modals/SlaConfigModal';

export default function App() {
  // Real-time clock & settings state
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [slaSeconds, setSlaSeconds] = useState<number>(INITIAL_SLA_SECONDS);
  const [dataMode, setDataMode] = useState<'MOCK' | 'LIVE'>('MOCK');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Core domain state
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [auditLogs, setAuditLogs] = useState<ActionLog[]>(INITIAL_AUDIT_LOGS);

  // Filters state
  const [filters, setFilters] = useState<FiltersState>({
    channel: 'ALL',
    agentId: 'ALL',
    chatStatus: 'ALL',
    zoomStatus: 'ALL',
    quickFilter: 'ALL',
    searchQuery: '',
  });

  // Active view tabs (Chat Monitoring vs Combined Agent view, or both on desktop)
  const [activeSection, setActiveSection] = useState<'all' | 'chats' | 'agents'>('all');

  // Modal states
  const [viewingChat, setViewingChat] = useState<Chat | null>(null);
  const [whisperingTarget, setWhisperingTarget] = useState<{ agent: Agent; chat?: Chat } | null>(null);
  const [statusTargetAgent, setStatusTargetAgent] = useState<Agent | null>(null);
  const [closingChatTarget, setClosingChatTarget] = useState<{ chat: Chat; agent?: Agent } | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isSlaModalOpen, setIsSlaModalOpen] = useState<boolean>(false);

  // Subtle alert sound synthesizer
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext policy
    }
  }, [soundEnabled]);

  // 1-second live ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live simulation background loop (every 10 seconds if active)
  useEffect(() => {
    if (!isSimulating) return;

    const simInterval = setInterval(() => {
      // Randomly simulate customer activity or status shifts
      const rand = Math.random();

      // 30% chance: Random customer message arrives in an active chat
      if (rand < 0.3) {
        setChats((prev) => {
          const activeChats = prev.filter((c) => c.completedAt === null);
          if (activeChats.length === 0) return prev;
          const target = activeChats[Math.floor(Math.random() * activeChats.length)];
          const nowTs = Date.now();
          return prev.map((c) => {
            if (c.id === target.id) {
              return {
                ...c,
                lastCustomerMessageAt: nowTs,
                messages: [
                  ...c.messages,
                  {
                    id: `sim-msg-${nowTs}`,
                    sender: 'customer',
                    text: 'Mohon update statusnya ya, saya masih menunggu.',
                    timestamp: nowTs,
                  },
                ],
              };
            }
            return c;
          });
        });
      }
      // 20% chance: Random agent finishes a Zoom call or starts a Zoom call
      else if (rand < 0.5) {
        setAgents((prev) => {
          const candidates = prev.filter((a) => a.salesforceStatus !== 'OFFLINE');
          if (candidates.length === 0) return prev;
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          const newZoom = target.zoomStatus === 'ON CALL' ? 'READY' : 'ON CALL';
          return prev.map((a) => {
            if (a.id === target.id) {
              return {
                ...a,
                zoomStatus: newZoom,
                zoomCallStartTime: newZoom === 'ON CALL' ? Date.now() : null,
              };
            }
            return a;
          });
        });
      }
    }, 12000);

    return () => clearInterval(simInterval);
  }, [isSimulating]);

  // Track over SLA count to trigger alert sound
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(agents, chats, currentTime, slaSeconds);
  }, [agents, chats, currentTime, slaSeconds]);

  const channelSummaries = useMemo(() => {
    return calculateChannelSummaries(
      SUPPORTED_CHANNELS,
      agents,
      chats,
      currentTime,
      slaSeconds
    );
  }, [agents, chats, currentTime, slaSeconds]);

  // Filter & Sort Chats
  const filteredChats = useMemo(() => {
    let result = [...chats];

    // Channel filter
    if (filters.channel !== 'ALL') {
      result = result.filter((c) => c.channel === filters.channel);
    }

    // Agent filter
    if (filters.agentId !== 'ALL') {
      result = result.filter((c) => c.agentId === filters.agentId);
    }

    // Chat Status filter
    if (filters.chatStatus !== 'ALL') {
      result = result.filter(
        (c) => calculateChatStatus(c, currentTime, slaSeconds) === filters.chatStatus
      );
    }

    // Zoom Status filter
    if (filters.zoomStatus !== 'ALL') {
      result = result.filter((c) => {
        const ag = agents.find((a) => a.id === c.agentId);
        return ag && ag.zoomStatus === filters.zoomStatus;
      });
    }

    // Search query
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter((c) => {
        const ag = agents.find((a) => a.id === c.agentId);
        return (
          c.id.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.channel.toLowerCase().includes(q) ||
          (ag && ag.name.toLowerCase().includes(q))
        );
      });
    }

    // Quick filter
    if (filters.quickFilter === 'WAITING') {
      result = result.filter(
        (c) => calculateChatStatus(c, currentTime, slaSeconds) === 'Waiting'
      );
    } else if (filters.quickFilter === 'OVER_SLA') {
      result = result.filter(
        (c) => calculateChatStatus(c, currentTime, slaSeconds) === 'Over SLA'
      );
    } else if (filters.quickFilter === 'COMPLETED_NOT_CLOSED') {
      result = result.filter(
        (c) => calculateChatStatus(c, currentTime, slaSeconds) === 'Completed - Not Closed'
      );
    } else if (filters.quickFilter === 'ON_CALL') {
      result = result.filter((c) => {
        const ag = agents.find((a) => a.id === c.agentId);
        return ag && ag.zoomStatus === 'ON CALL';
      });
    } else if (filters.quickFilter === 'AVAILABLE') {
      result = result.filter((c) => {
        const ag = agents.find((a) => a.id === c.agentId);
        return ag && ag.salesforceStatus === 'AVAILABLE';
      });
    }

    // Strict priority sorting as per Section 14
    return sortChats(result, currentTime, slaSeconds);
  }, [chats, agents, currentTime, slaSeconds, filters]);

  // Filter Agents
  const filteredAgents = useMemo(() => {
    let result = [...agents];

    if (filters.channel !== 'ALL') {
      result = result.filter((a) => a.channel === filters.channel);
    }

    if (filters.agentId !== 'ALL') {
      result = result.filter((a) => a.id === filters.agentId);
    }

    if (filters.zoomStatus !== 'ALL') {
      result = result.filter((a) => a.zoomStatus === filters.zoomStatus);
    }

    if (filters.quickFilter === 'ON_CALL') {
      result = result.filter((a) => a.zoomStatus === 'ON CALL');
    } else if (filters.quickFilter === 'AVAILABLE') {
      result = result.filter((a) => a.salesforceStatus === 'AVAILABLE');
    } else if (filters.quickFilter === 'OVER_SLA') {
      result = result.filter((a) => {
        const agentChats = chats.filter((c) => c.agentId === a.id);
        return agentChats.some(
          (c) => calculateChatStatus(c, currentTime, slaSeconds) === 'Over SLA'
        );
      });
    } else if (filters.quickFilter === 'WAITING') {
      result = result.filter((a) => {
        const agentChats = chats.filter((c) => c.agentId === a.id);
        return agentChats.some(
          (c) => calculateChatStatus(c, currentTime, slaSeconds) === 'Waiting'
        );
      });
    }

    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.salesforceUserId.toLowerCase().includes(q) ||
          a.zoomUserId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [agents, chats, currentTime, slaSeconds, filters]);

  // Counts for Quick Filter bar
  const quickFilterCounts = useMemo(() => {
    return {
      all: chats.length,
      waiting: metrics.waitingChats,
      overSla: metrics.overSlaChats,
      completedNotClosed: metrics.completedNotClosed,
      onCall: metrics.zoomOnCall,
      available: metrics.availableAgents,
    };
  }, [chats.length, metrics]);

  // Handle Supervisor Action: Whisper
  const handleSendWhisper = (agentId: string, messageText: string, chatId?: string) => {
    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetAgent) return;

    const nowTs = Date.now();

    // If attached to a chat, record whisper in chat messages
    if (chatId) {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `whisper-${nowTs}`,
                  sender: 'supervisor_whisper',
                  text: messageText,
                  timestamp: nowTs,
                  isWhisper: true,
                },
              ],
            };
          }
          return c;
        })
      );
    }

    // Add to Audit Log
    const newLog: ActionLog = {
      id: `log-${nowTs}`,
      timestamp: nowTs,
      supervisor: 'Supervisor John',
      agentId: targetAgent.id,
      agentName: targetAgent.name,
      chatId: chatId,
      actionType: 'WHISPER',
      previousValue: 'None',
      newValue: 'Whisper Sent',
      result: 'Success',
      details: messageText,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handle Supervisor Action: Change Agent Status
  const handleConfirmChangeStatus = (
    agentId: string,
    newStatus: SalesforceStatus,
    reason: string
  ) => {
    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetAgent) return;

    const prevStatus = targetAgent.salesforceStatus;
    const nowTs = Date.now();

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            salesforceStatus: newStatus,
            lastStatusChange: nowTs,
          };
        }
        return a;
      })
    );

    // Record in Audit Log
    const newLog: ActionLog = {
      id: `log-${nowTs}`,
      timestamp: nowTs,
      supervisor: 'Supervisor John',
      agentId: targetAgent.id,
      agentName: targetAgent.name,
      actionType: 'CHANGE_STATUS',
      previousValue: prevStatus,
      newValue: newStatus,
      result: 'Success',
      details: reason,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handle Supervisor Action: Close Chat
  const handleConfirmCloseChat = (chatId: string, reason: string) => {
    const targetChat = chats.find((c) => c.id === chatId);
    if (!targetChat) return;

    const targetAgent = agents.find((a) => a.id === targetChat.agentId);
    const nowTs = Date.now();

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            closedAt: nowTs,
          };
        }
        return c;
      })
    );

    // Record in Audit Log
    const newLog: ActionLog = {
      id: `log-${nowTs}`,
      timestamp: nowTs,
      supervisor: 'Supervisor John',
      agentId: targetChat.agentId,
      agentName: targetAgent?.name || 'Unknown',
      chatId: targetChat.id,
      actionType: 'CLOSE_CHAT',
      previousValue: 'Completed - Not Closed',
      newValue: 'Closed',
      result: 'Success',
      details: reason,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Simulate Agent Response in View Modal
  const handleSimulateAgentResponse = (chatId: string, text: string) => {
    const nowTs = Date.now();
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastAgentResponseAt: nowTs,
            messages: [
              ...c.messages,
              {
                id: `agent-reply-${nowTs}`,
                sender: 'agent',
                text: text,
                timestamp: nowTs,
              },
            ],
          };
        }
        return c;
      })
    );
  };

  // Trigger Pre-set Test Scenarios
  const handleTriggerScenario = (
    type: 'inbound_chat' | 'agent_respond' | 'zoom_toggle' | 'over_sla_test'
  ) => {
    const nowTs = Date.now();

    if (type === 'inbound_chat') {
      const availableAgent = agents.find((a) => a.salesforceStatus === 'AVAILABLE') || agents[0];
      const newChatId = `#${Math.floor(100 + Math.random() * 900)}`;
      const newChat: Chat = {
        id: newChatId,
        customerName: 'Nasabah Baru',
        customerId: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
        agentId: availableAgent.id,
        channel: availableAgent.channel,
        createdAt: nowTs,
        lastCustomerMessageAt: nowTs,
        lastAgentResponseAt: nowTs - 10000,
        completedAt: null,
        closedAt: null,
        messages: [
          {
            id: `msg-${nowTs}`,
            sender: 'customer',
            text: 'Halo, saya membutuhkan bantuan terkait transaksi verifikasi.',
            timestamp: nowTs,
          },
        ],
      };
      setChats((prev) => [newChat, ...prev]);
    } else if (type === 'agent_respond') {
      setChats((prev) => {
        const waitingChats = prev.filter(
          (c) => calculateChatStatus(c, nowTs, slaSeconds) === 'Waiting' || calculateChatStatus(c, nowTs, slaSeconds) === 'Over SLA'
        );
        if (waitingChats.length === 0) return prev;
        const target = waitingChats[0];
        return prev.map((c) => {
          if (c.id === target.id) {
            return {
              ...c,
              lastAgentResponseAt: nowTs,
              messages: [
                ...c.messages,
                {
                  id: `reply-${nowTs}`,
                  sender: 'agent',
                  text: 'Terima kasih telah menunggu, sedang kami proses datanya.',
                  timestamp: nowTs,
                },
              ],
            };
          }
          return c;
        });
      });
    } else if (type === 'over_sla_test') {
      // Force an active chat to exceed SLA immediately
      setChats((prev) => {
        const activeChats = prev.filter((c) => c.completedAt === null);
        if (activeChats.length === 0) return prev;
        const target = activeChats[0];
        // Set customer message to (slaSeconds + 45s) in the past
        const pastTime = nowTs - (slaSeconds + 45) * 1000;
        return prev.map((c) => {
          if (c.id === target.id) {
            return {
              ...c,
              lastCustomerMessageAt: pastTime,
              lastAgentResponseAt: pastTime - 30000,
            };
          }
          return c;
        });
      });
      playAlertSound();
    } else if (type === 'zoom_toggle') {
      setAgents((prev) => {
        const target = prev.find((a) => a.salesforceStatus !== 'OFFLINE') || prev[0];
        const newZoom = target.zoomStatus === 'ON CALL' ? 'READY' : 'ON CALL';
        return prev.map((a) => {
          if (a.id === target.id) {
            return {
              ...a,
              zoomStatus: newZoom,
              zoomCallStartTime: newZoom === 'ON CALL' ? nowTs : null,
            };
          }
          return a;
        });
      });
    }
  };

  // Keep viewingChat in sync with updated chat data
  const currentViewingChat = useMemo(() => {
    if (!viewingChat) return null;
    return chats.find((c) => c.id === viewingChat.id) || viewingChat;
  }, [viewingChat, chats]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar Navigation */}
      <Header
        currentTime={currentTime}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        slaSeconds={slaSeconds}
        onOpenSlaConfig={() => setIsSlaModalOpen(true)}
        onOpenAuditLog={() => setIsAuditModalOpen(true)}
        auditCount={auditLogs.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onTriggerScenario={handleTriggerScenario}
        dataMode={dataMode}
        onToggleDataMode={() => setDataMode(dataMode === 'MOCK' ? 'LIVE' : 'MOCK')}
      />

      {/* Main Single-Screen Command Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI Cards (Section 7) */}
        <KpiCards
          metrics={metrics}
          activeQuickFilter={filters.quickFilter}
          onSelectQuickFilter={(qf) => {
            setFilters((prev) => ({
              ...prev,
              quickFilter: prev.quickFilter === qf ? 'ALL' : qf,
            }));
          }}
        />

        {/* Channel Overview (Section 9) */}
        <ChannelOverview
          summaries={channelSummaries}
          selectedChannel={filters.channel}
          onSelectChannel={(ch) => {
            setFilters((prev) => ({ ...prev, channel: ch }));
          }}
        />

        {/* Filter Bar (Section 26 & 27) */}
        <FilterBar
          filters={filters}
          onUpdateFilters={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
          onResetFilters={() =>
            setFilters({
              channel: 'ALL',
              agentId: 'ALL',
              chatStatus: 'ALL',
              zoomStatus: 'ALL',
              quickFilter: 'ALL',
              searchQuery: '',
            })
          }
          agents={agents}
          channels={SUPPORTED_CHANNELS}
          counts={quickFilterCounts}
        />

        {/* View Section Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer border ${
                activeSection === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Unified View
            </button>
            <button
              onClick={() => setActiveSection('chats')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer border ${
                activeSection === 'chats'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Chats ({filteredChats.length})
            </button>
            <button
              onClick={() => setActiveSection('agents')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer border ${
                activeSection === 'agents'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Agents ({filteredAgents.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Omni Supervisor Control</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono tabular-nums">SLA: {slaSeconds}s</span>
          </div>
        </div>

        {/* Tables Section */}
        <div className="space-y-6">
          {/* Chat Monitoring Table (Section 10) */}
          {(activeSection === 'all' || activeSection === 'chats') && (
            <ChatMonitoringTable
              chats={filteredChats}
              agents={agents}
              currentTime={currentTime}
              slaSeconds={slaSeconds}
              onViewChat={(chat) => setViewingChat(chat)}
              onWhisperChat={(chat, agent) => setWhisperingTarget({ agent, chat })}
              onCloseChat={(chat, agent) => setClosingChatTarget({ chat, agent })}
            />
          )}

          {/* Agent Monitoring Table (Section 24) */}
          {(activeSection === 'all' || activeSection === 'agents') && (
            <AgentMonitoringTable
              agents={filteredAgents}
              chats={chats}
              currentTime={currentTime}
              slaSeconds={slaSeconds}
              onOpenChangeStatus={(agent) => setStatusTargetAgent(agent)}
              onWhisperAgent={(agent) => setWhisperingTarget({ agent })}
              onViewAgentChat={(agent, chat) => setViewingChat(chat)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Operations Command Center</span>
            <span>·</span>
            <span>Salesforce Omni-Channel & Zoom Bridge</span>
          </div>
          <div className="flex items-center gap-3">
            <span>SLA Target: {slaSeconds}s</span>
            <span>·</span>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-slate-700 hover:text-slate-900 font-medium cursor-pointer underline decoration-slate-300"
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Supervisor Interactive Modals */}
      {currentViewingChat && (
        <ViewChatModal
          chat={currentViewingChat}
          agent={agents.find((a) => a.id === currentViewingChat.agentId)}
          currentTime={currentTime}
          slaSeconds={slaSeconds}
          onClose={() => setViewingChat(null)}
          onSendWhisper={handleSendWhisper}
          onSimulateAgentResponse={handleSimulateAgentResponse}
          onCloseChat={(chat, agent) => setClosingChatTarget({ chat, agent })}
        />
      )}

      {whisperingTarget && (
        <WhisperModal
          isOpen={Boolean(whisperingTarget)}
          agent={whisperingTarget.agent}
          chat={whisperingTarget.chat}
          onClose={() => setWhisperingTarget(null)}
          onSendWhisper={handleSendWhisper}
        />
      )}

      {statusTargetAgent && (
        <ChangeAgentStatusModal
          isOpen={Boolean(statusTargetAgent)}
          agent={statusTargetAgent}
          onClose={() => setStatusTargetAgent(null)}
          onConfirmChange={handleConfirmChangeStatus}
        />
      )}

      {closingChatTarget && (
        <CloseChatModal
          isOpen={Boolean(closingChatTarget)}
          chat={closingChatTarget.chat}
          agent={closingChatTarget.agent}
          currentTime={currentTime}
          onClose={() => setClosingChatTarget(null)}
          onConfirmClose={handleConfirmCloseChat}
        />
      )}

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
      />

      <SlaConfigModal
        isOpen={isSlaModalOpen}
        currentSlaSeconds={slaSeconds}
        onClose={() => setIsSlaModalOpen(false)}
        onSaveSla={(newSla) => {
          setSlaSeconds(newSla);
          // Log SLA change
          const newLog: ActionLog = {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            supervisor: 'Supervisor John',
            agentId: 'SYSTEM',
            agentName: 'System SLA Config',
            actionType: 'CONFIG_SLA',
            previousValue: `${slaSeconds}s`,
            newValue: `${newSla}s`,
            result: 'Success',
            details: `Threshold updated to ${newSla} seconds`,
          };
          setAuditLogs((prev) => [newLog, ...prev]);
        }}
      />
    </div>
  );
}
