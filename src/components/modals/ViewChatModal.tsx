import React, { useState } from 'react';
import { Chat, Agent, ChatStatus } from '../../types';
import {
  calculateChatStatus,
  calculateWaitingTimeSeconds,
  calculateDurationSeconds,
  formatDuration,
  formatTime,
} from '../../utils/chatEngine';
import { X, Send, Lock, MessageSquare, AlertTriangle, Clock, User, PhoneCall } from 'lucide-react';

interface ViewChatModalProps {
  chat: Chat | null;
  agent?: Agent;
  currentTime: number;
  slaSeconds: number;
  onClose: () => void;
  onSendWhisper: (agentId: string, message: string, chatId?: string) => void;
  onSimulateAgentResponse: (chatId: string, text: string) => void;
  onCloseChat: (chat: Chat, agent: Agent) => void;
}

export const ViewChatModal: React.FC<ViewChatModalProps> = ({
  chat,
  agent,
  currentTime,
  slaSeconds,
  onClose,
  onSendWhisper,
  onSimulateAgentResponse,
  onCloseChat,
}) => {
  const [whisperText, setWhisperText] = useState('');
  const [agentReplyText, setAgentReplyText] = useState('');

  if (!chat) return null;

  const status = calculateChatStatus(chat, currentTime, slaSeconds);
  const waitingSeconds = calculateWaitingTimeSeconds(chat, currentTime);
  const durationSeconds = calculateDurationSeconds(chat, currentTime);
  const isOverSla = status === 'Over SLA';
  const isCompletedNotClosed = status === 'Completed - Not Closed';

  const handleWhisperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperText.trim() || !agent) return;
    onSendWhisper(agent.id, whisperText.trim(), chat.id);
    setWhisperText('');
  };

  const handleAgentReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentReplyText.trim()) return;
    onSimulateAgentResponse(chat.id, agentReplyText.trim());
    setAgentReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-slate-900">
              {chat.id}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
              Channel: {chat.channel}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
              isOverSla
                ? 'bg-rose-50 text-rose-700 border border-rose-300'
                : status === 'Waiting'
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : status === 'Completed - Not Closed'
                ? 'bg-orange-50 text-orange-800 border border-orange-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            }`}>
              {status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Customer:</span>
            <span className="font-semibold text-slate-900">{chat.customerName}</span>
            <span className="text-slate-400 text-[10px] block font-mono">ID: {chat.customerId}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Agent:</span>
            <span className="font-semibold text-slate-900">{agent?.name || 'Unassigned'}</span>
            <span className="text-slate-400 text-[10px] block font-mono">{agent?.salesforceUserId}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Waiting Time:</span>
            <span className={`font-mono font-bold tabular-nums text-sm ${
              isOverSla ? 'text-rose-600' : waitingSeconds > 0 ? 'text-amber-700' : 'text-slate-500'
            }`}>
              {waitingSeconds > 0 ? formatDuration(waitingSeconds) : '--:--'}
            </span>
            {isOverSla && (
              <span className="text-[10px] text-rose-600 font-semibold block flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> Exceeded {slaSeconds}s
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Zoom Context:</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1">
              {agent?.zoomStatus === 'ON CALL' && <PhoneCall className="w-3 h-3 text-indigo-600" />}
              {agent?.zoomStatus || 'UNKNOWN'}
            </span>
            <span className="text-slate-400 text-[10px] block font-mono">
              Duration: {formatDuration(durationSeconds)}
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/30">
          <div className="text-center">
            <span className="text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs font-mono">
              Chat started at {formatTime(chat.createdAt)}
            </span>
          </div>

          {chat.messages.map((msg) => {
            const isCustomer = msg.sender === 'customer';
            const isWhisper = msg.sender === 'supervisor_whisper';

            if (isWhisper) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg p-2.5 max-w-md text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-700 text-[10px] uppercase mb-0.5">
                      <Lock className="w-3 h-3" />
                      Supervisor Whisper (Private to Agent)
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className="text-[10px] text-indigo-500 text-right mt-1 font-mono">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {isCustomer ? chat.customerName : agent?.name || 'Agent'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`rounded-xl px-3.5 py-2 max-w-md text-xs leading-relaxed shadow-2xs ${
                    isCustomer
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Footers: Whisper and Response Bar */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          {/* Quick Whisper input */}
          {agent && (
            <form onSubmit={handleWhisperSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Whisper private guidance to ${agent.name}...`}
                  value={whisperText}
                  onChange={(e) => setWhisperText(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50/40 text-slate-900 placeholder-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!whisperText.trim()}
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Whisper</span>
              </button>
            </form>
          )}

          {/* Supervisor direct actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              {/* Simulate Agent Response */}
              <form onSubmit={handleAgentReplySubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Simulate agent reply..."
                  value={agentReplyText}
                  onChange={(e) => setAgentReplyText(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 w-44 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={!agentReplyText.trim()}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs disabled:opacity-50 transition-colors"
                >
                  Reply
                </button>
              </form>
            </div>

            <div className="flex items-center gap-2">
              {isCompletedNotClosed && agent && (
                <button
                  onClick={() => {
                    onCloseChat(chat, agent);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-md bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Close Completed Chat
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
