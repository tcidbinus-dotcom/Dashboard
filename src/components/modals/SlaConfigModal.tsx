import React, { useState } from 'react';
import { X, Sliders, Check, Info } from 'lucide-react';

interface SlaConfigModalProps {
  isOpen: boolean;
  currentSlaSeconds: number;
  onClose: () => void;
  onSaveSla: (newSla: number) => void;
}

export const SlaConfigModal: React.FC<SlaConfigModalProps> = ({
  isOpen,
  currentSlaSeconds,
  onClose,
  onSaveSla,
}) => {
  const [val, setVal] = useState(currentSlaSeconds);

  if (!isOpen) return null;

  const presets = [30, 45, 60, 90, 120, 180];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val > 5) {
      onSaveSla(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                SLA THRESHOLD CONFIGURATION
              </h3>
              <p className="text-xs text-slate-500">
                Configure CHAT_SLA_SECONDS parameter
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active SLA Target (Seconds)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={600}
                value={val}
                onChange={(e) => setVal(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-xs font-semibold text-slate-500 shrink-0">seconds</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Quick Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVal(p)}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-mono font-semibold transition-colors border cursor-pointer ${
                    val === p
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}s {p === 60 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Live Operational Impact:</p>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Any chat where customer waiting time exceeds <strong>{val} seconds</strong> will immediately transition to <strong>OVER SLA</strong> status with high-priority sorting.
              </p>
            </div>
          </div>

          {/* Actions */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>APPLY SLA ({val}s)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
