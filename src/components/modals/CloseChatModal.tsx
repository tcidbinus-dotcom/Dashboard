import React, { useState } from 'react';
import { Agent, Chat } from '../../types';
import { calculateAgingSeconds, formatDuration } from '../../utils/chatEngine';
import { X, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CloseChatModalProps {
  isOpen: boolean;
  chat: Chat | null;
  agent?: Agent;
  currentTime: number;
  onClose: () => void;
  onConfirmClose: (chatId: string, reason: string) => void;
}

export const CloseChatModal: React.FC<CloseChatModalProps> = ({
  isOpen,
  chat,
  agent,
  currentTime,
  onClose,
  onConfirmClose,
}) => {
  const [closeReason, setCloseReason] = useState('Customer session concluded & verified');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !chat) return null;

  const agingSeconds = calculateAgingSeconds(chat, currentTime);

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Simulate Salesforce API sync latency
    setTimeout(() => {
      onConfirmClose(chat.id, closeReason);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                CLOSE CHAT {chat.id}?
              </h3>
              <p className="text-xs text-slate-500">
                Salesforce Interaction Final Closure
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {isSuccess ? (
            <div className="py-6 text-center text-emerald-700 space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-600 animate-bounce" />
              <p className="text-sm font-bold">Chat closed successfully.</p>
              <p className="text-xs text-slate-500">
                Salesforce interaction record updated. Capacity restored to agent.
              </p>
            </div>
          ) : (
            <>
              {/* Detailed Summary Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chat ID:</span>
                  <span className="font-mono font-bold text-slate-900">{chat.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800">{chat.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Agent:</span>
                  <span className="font-semibold text-slate-800">{agent?.name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">
                    Completed - Not Closed
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">Unclosed Aging Duration:</span>
                  <span className="font-mono font-bold text-orange-700 tabular-nums text-sm">
                    {formatDuration(agingSeconds)}
                  </span>
                </div>
              </div>

              {/* Close Reason dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resolution / Close Code
                </label>
                <select
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Customer session concluded & verified">
                    Customer session concluded & verified
                  </option>
                  <option value="Unclosed aging threshold exceeded (Auto-wrapup)">
                    Unclosed aging threshold exceeded (Auto-wrapup)
                  </option>
                  <option value="Customer disconnected without further inquiry">
                    Customer disconnected without further inquiry
                  </option>
                  <option value="Supervisor administrative wrap-up">
                    Supervisor administrative wrap-up
                  </option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Closing this chat will log a supervisor close event in the audit trail and finalize the transcript in Salesforce Omni-Channel.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'CLOSING IN SALESFORCE...' : 'CONFIRM CLOSE'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
