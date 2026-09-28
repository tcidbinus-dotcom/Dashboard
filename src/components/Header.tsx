import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  Sliders,
  History,
  Play,
  Pause,
  ChevronDown,
} from 'lucide-react';
import { formatTime } from '../utils/chatEngine';

interface HeaderProps {
  currentTime: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  slaSeconds: number;
  onOpenSlaConfig: () => void;
  onOpenAuditLog: () => void;
  auditCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerScenario: (type: 'inbound_chat' | 'agent_respond' | 'zoom_toggle' | 'over_sla_test') => void;
  dataMode: 'MOCK' | 'LIVE';
  onToggleDataMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  isSimulating,
  onToggleSimulation,
  slaSeconds,
  onOpenSlaConfig,
  onOpenAuditLog,
  auditCount,
  soundEnabled,
  onToggleSound,
  onTriggerScenario,
  dataMode,
  onToggleDataMode,
}) => {
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
            OCC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                OPERATIONS COMMAND CENTER
              </h1>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium">
                Salesforce Omni + Zoom
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Real-time Supervisor Control Tower
            </p>
          </div>
        </div>

        {/* Center: Clean Live Indicator & Clock */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-white">
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-800 text-[11px]">
              {isSimulating ? 'LIVE' : 'PAUSED'}
            </span>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1 font-mono tabular-nums text-slate-600">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* SLA Threshold Button */}
          <button
            onClick={onOpenSlaConfig}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
            title="Configure Response SLA"
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>SLA: <strong className="font-mono text-slate-900">{slaSeconds}s</strong></span>
          </button>
        </div>

        {/* Right Actions: Minimalist & Clean */}
        <div className="flex items-center gap-2">
          {/* Simulation Toggle */}
          <button
            onClick={onToggleSimulation}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title={isSimulating ? 'Pause Live Ticker' : 'Resume Live Ticker'}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Test Simulation Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Test Scenarios</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showScenarioMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowScenarioMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-md py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulate Events
                  </div>
                  <button
                    onClick={() => {
                      onTriggerScenario('inbound_chat');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Inbound Chat (Waiting)
                  </button>
                  <button
                    onClick={() => {
                      onTriggerScenario('agent_respond');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Agent Responds (Responding)
                  </button>
                  <button
                    onClick={() => {
                      onTriggerScenario('over_sla_test');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Trigger Over SLA (&gt;{slaSeconds}s)
                  </button>
                  <button
                    onClick={() => {
                      onTriggerScenario('zoom_toggle');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                  >
                    Toggle Agent Zoom Call
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
          >
            {soundEnabled ? (
              <Bell className="w-3.5 h-3.5 text-slate-800" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Audit Log Modal Trigger */}
          <button
            onClick={onOpenAuditLog}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            title="View Supervisor Audit Log"
          >
            <History className="w-3 h-3" />
            <span>Audit Log</span>
            {auditCount > 0 && (
              <span className="font-mono text-[10px] bg-slate-700 px-1.5 py-0.2 rounded">
                {auditCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
