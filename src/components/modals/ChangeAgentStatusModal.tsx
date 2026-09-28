import React, { useState } from 'react';
import { Agent, SalesforceStatus } from '../../types';
import { X, UserCheck, AlertCircle } from 'lucide-react';

interface ChangeAgentStatusModalProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
  onConfirmChange: (agentId: string, newStatus: SalesforceStatus, reason: string) => void;
}

export const ChangeAgentStatusModal: React.FC<ChangeAgentStatusModalProps> = ({
  isOpen,
  agent,
  onClose,
  onConfirmChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SalesforceStatus>('AVAILABLE');
  const [reason, setReason] = useState('Supervisor Capacity Management');

  if (!isOpen || !agent) return null;

  const statusOptions: { value: SalesforceStatus; label: string; desc: string }[] = [
    { value: 'AVAILABLE', label: 'Available', desc: 'Accepting incoming chat routing in queue' },
    { value: 'BUSY', label: 'Busy', desc: 'Active in session; no new chats routed' },
    { value: 'AUX', label: 'AUX (Away)', desc: 'Break, training, lunch or coaching' },
    { value: 'OFFLINE', label: 'Offline', desc: 'Logged out of Salesforce Omni-Channel' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmChange(agent.id, selectedStatus, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                CHANGE AGENT STATUS
              </h3>
              <p className="text-xs text-slate-500">
                Salesforce Omni-Channel Presence Override
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Target Agent:</span>
              <strong className="text-slate-900">{agent.name}</strong>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Channel / Queue:</span>
              <span className="font-semibold text-slate-700">{agent.channel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Omni Status:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                {agent.salesforceStatus}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select New Omni Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedStatus === opt.value
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="newStatus"
                    value={opt.value}
                    checked={selectedStatus === opt.value}
                    onChange={() => setSelectedStatus(opt.value)}
                    className="mt-0.5 text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 leading-tight">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Audit Notes
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Surge queue coverage, Lunch break, Training"
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            />
          </div>

          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Change <strong>{agent.name}</strong> from <strong>{agent.salesforceStatus}</strong> to <strong>{selectedStatus}</strong>? This action will immediately update routing in Salesforce.
            </span>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              CONFIRM STATUS CHANGE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
