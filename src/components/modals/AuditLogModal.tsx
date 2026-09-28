import React from 'react';
import { ActionLog } from '../../types';
import { formatTime } from '../../utils/chatEngine';
import { X, History, CheckCircle2, Shield, Download } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActionLog[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  const exportCsv = () => {
    const headers = ['Timestamp', 'Supervisor', 'Agent', 'Chat ID', 'Action', 'Previous Value', 'New Value', 'Result', 'Details'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.supervisor,
      l.agentName,
      l.chatId || '',
      l.actionType,
      l.previousValue,
      l.newValue,
      l.result,
      `"${l.details?.replace(/"/g, '""') || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `occ_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                SUPERVISOR ACTION AUDIT LOG
              </h3>
              <p className="text-xs text-slate-500">
                Official compliance record of status changes, whispers & chat closes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No supervisor actions recorded yet today.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-28">Timestamp</th>
                  <th className="py-2.5 px-3">Supervisor</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3 w-20">Chat ID</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Previous</th>
                  <th className="py-2.5 px-3">New Value</th>
                  <th className="py-2.5 px-3 w-20">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {log.supervisor}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-medium">
                      {log.agentName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {log.chatId || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {log.previousValue}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {log.newValue}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>{logs.length} logged events recorded in current shift</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
