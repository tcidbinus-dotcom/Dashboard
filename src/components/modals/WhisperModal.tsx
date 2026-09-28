import React, { useState } from 'react';
import { Agent, Chat } from '../../types';
import { X, Send, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface WhisperModalProps {
  isOpen: boolean;
  agent: Agent | null;
  chat?: Chat | null;
  onClose: () => void;
  onSendWhisper: (agentId: string, message: string, chatId?: string) => void;
}

export const WhisperModal: React.FC<WhisperModalProps> = ({
  isOpen,
  agent,
  chat,
  onClose,
  onSendWhisper,
}) => {
  const [message, setMessage] = useState('');

  if (!isOpen || !agent) return null;

  const quickTemplates = [
    'Customer has been waiting for over SLA. Please respond now.',
    'Are you currently on a Zoom call? Please transfer customer or send quick update.',
    'Please wrap up and close this completed interaction.',
    'Do you need escalation or supervisor assistance on this case?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendWhisper(agent.id, message.trim(), chat?.id);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                WHISPER TO {agent.name.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500">
                {chat ? `Attached to Chat ${chat.id}` : 'Direct Agent Channel'} · {agent.channel} Queue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Whisper sends a confidential notification visible <strong>only to the agent</strong> inside Salesforce Omni-Channel. The customer cannot see this message.
          </p>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick Supervisor Templates
            </label>
            <div className="space-y-1.5">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(template)}
                  className="w-full text-left p-2 rounded border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-xs text-slate-700 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{template}</span>
                  <Sparkles className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supervisor Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type confidential whisper message to agent..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND WHISPER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
