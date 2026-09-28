import React from 'react';
import { FiltersState, QuickFilterType, ChannelType, ChatStatus, ZoomStatus, Agent } from '../types';
import { Search, X, Filter } from 'lucide-react';

interface FilterBarProps {
  filters: FiltersState;
  onUpdateFilters: (updates: Partial<FiltersState>) => void;
  onResetFilters: () => void;
  agents: Agent[];
  channels: ChannelType[];
  counts: {
    all: number;
    waiting: number;
    overSla: number;
    completedNotClosed: number;
    onCall: number;
    available: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  agents,
  channels,
  counts,
}) => {
  const quickFilters: { key: QuickFilterType; label: string; count: number; isCritical?: boolean }[] = [
    { key: 'ALL', label: 'All', count: counts.all },
    { key: 'WAITING', label: 'Waiting', count: counts.waiting },
    { key: 'OVER_SLA', label: 'Over SLA', count: counts.overSla, isCritical: counts.overSla > 0 },
    { key: 'COMPLETED_NOT_CLOSED', label: 'Unclosed', count: counts.completedNotClosed },
    { key: 'ON_CALL', label: 'On Zoom', count: counts.onCall },
    { key: 'AVAILABLE', label: 'Available', count: counts.available },
  ];

  const hasActiveFilters =
    filters.quickFilter !== 'ALL' ||
    filters.channel !== 'ALL' ||
    filters.agentId !== 'ALL' ||
    filters.chatStatus !== 'ALL' ||
    filters.zoomStatus !== 'ALL' ||
    filters.searchQuery.trim() !== '';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-3">
      {/* Quick Filter Segmented Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter:
          </span>
          {quickFilters.map((q) => {
            const isActive = filters.quickFilter === q.key;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => onUpdateFilters({ quickFilter: q.key })}
                className={`px-2.5 py-1 rounded text-xs font-medium tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{q.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : q.isCritical
                      ? 'bg-rose-100 text-rose-700 font-bold'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {q.count}
                </span>
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer ml-auto underline"
          >
            <X className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Chat #, Agent, Customer..."
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Channel Dropdown */}
        <div>
          <select
            value={filters.channel}
            onChange={(e) => onUpdateFilters({ channel: e.target.value as 'ALL' | ChannelType })}
            aria-label="Filter by Channel"
            className="w-full py-1.5 px-2 text-xs rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Channel: All</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                Queue: {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Dropdown */}
        <div>
          <select
            value={filters.agentId}
            onChange={(e) => onUpdateFilters({ agentId: e.target.value })}
            aria-label="Filter by Agent"
            className="w-full py-1.5 px-2 text-xs rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 truncate"
          >
            <option value="ALL">Agent: All ({agents.length})</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.channel})
              </option>
            ))}
          </select>
        </div>

        {/* Chat Status Dropdown */}
        <div>
          <select
            value={filters.chatStatus}
            onChange={(e) => onUpdateFilters({ chatStatus: e.target.value as 'ALL' | ChatStatus })}
            aria-label="Filter by Chat Status"
            className="w-full py-1.5 px-2 text-xs rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Chat Status: All</option>
            <option value="Responding">Responding</option>
            <option value="Waiting">Waiting</option>
            <option value="Over SLA">Over SLA (Critical)</option>
            <option value="Completed - Not Closed">Completed - Not Closed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Zoom Status Dropdown */}
        <div>
          <select
            value={filters.zoomStatus}
            onChange={(e) => onUpdateFilters({ zoomStatus: e.target.value as 'ALL' | ZoomStatus })}
            aria-label="Filter by Zoom Status"
            className="w-full py-1.5 px-2 text-xs rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Zoom: All</option>
            <option value="READY">Ready</option>
            <option value="IDLE">Idle</option>
            <option value="ON CALL">On Call</option>
            <option value="NOT READY">Not Ready</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>
    </div>
  );
};
