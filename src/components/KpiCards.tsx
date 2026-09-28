import React from 'react';
import { DashboardMetrics, QuickFilterType } from '../types';
import { CheckCircle2, MessageSquare, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface KpiCardsProps {
  metrics: DashboardMetrics;
  activeQuickFilter: QuickFilterType;
  onSelectQuickFilter: (filter: QuickFilterType) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  metrics,
  activeQuickFilter,
  onSelectQuickFilter,
}) => {
  // 4 primary essential cards as requested by supervisor
  const cards = [
    {
      id: 'AVAILABLE',
      filterType: 'AVAILABLE' as QuickFilterType,
      title: 'Available Agents',
      value: metrics.availableAgents,
      sublabel: `${metrics.availableAgents} ready · ${metrics.totalAgents} rostered`,
      icon: CheckCircle2,
      isCritical: false,
    },
    {
      id: 'ACTIVE_CHATS',
      filterType: 'ALL' as QuickFilterType,
      title: 'Active Chats',
      value: metrics.activeChats,
      sublabel: 'In-progress sessions across queues',
      icon: MessageSquare,
      isCritical: false,
    },
    {
      id: 'WAITING',
      filterType: 'WAITING' as QuickFilterType,
      title: 'Waiting Chats',
      value: metrics.waitingChats,
      sublabel: 'Awaiting agent response',
      icon: Clock,
      isCritical: false,
    },
    {
      id: 'OVER_SLA',
      filterType: 'OVER_SLA' as QuickFilterType,
      title: 'Over SLA',
      value: metrics.overSlaChats,
      sublabel: metrics.overSlaChats > 0 ? 'Requires immediate action' : 'Within target SLA',
      icon: AlertTriangle,
      isCritical: metrics.overSlaChats > 0,
    },
  ];

  return (
    <section aria-label="Key Performance Indicators" className="w-full space-y-2.5">
      {/* 4 Essential Operational Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected =
            card.filterType !== 'ALL' && activeQuickFilter === card.filterType;

          return (
            <button
              key={card.id}
              onClick={() => onSelectQuickFilter(card.filterType)}
              type="button"
              className={`text-left bg-white rounded-lg p-4 border transition-all duration-150 cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
              } ${card.isCritical ? 'border-rose-300 bg-rose-50/20' : ''}`}
            >
              {/* Card Header: Title & Icon */}
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold text-slate-700 tracking-tight">
                  {card.title}
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    card.isCritical
                      ? 'text-rose-500'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </div>

              {/* Metric Value */}
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-3xl font-bold font-mono tabular-nums leading-none tracking-tight ${
                    card.isCritical ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {card.value}
                </span>

                {card.isCritical && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                    ACTION NEEDED
                  </span>
                )}
              </div>

              {/* Quiet Footer Description */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{card.sublabel}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-800 font-medium shrink-0 ml-1 flex items-center gap-0.5">
                  Filter <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quiet Secondary Operational Bar: Clean single line without loud colors */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => onSelectQuickFilter('COMPLETED_NOT_CLOSED')}
            className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer ${
              activeQuickFilter === 'COMPLETED_NOT_CLOSED' ? 'font-bold text-slate-900 underline' : ''
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Completed - Not Closed:</span>
            <strong className="font-mono tabular-nums text-slate-900">{metrics.completedNotClosed}</strong>
          </button>

          <span className="text-slate-200" aria-hidden="true">|</span>

          <button
            onClick={() => onSelectQuickFilter('ON_CALL')}
            className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer ${
              activeQuickFilter === 'ON_CALL' ? 'font-bold text-slate-900 underline' : ''
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>On Zoom Call:</span>
            <strong className="font-mono tabular-nums text-slate-900">{metrics.zoomOnCall}</strong>
          </button>

          <span className="text-slate-200" aria-hidden="true">|</span>

          <span className="text-slate-500">
            Total Capacity: <strong className="font-mono text-slate-800">{metrics.totalAgents} Agents</strong>
          </span>
        </div>

        {activeQuickFilter !== 'ALL' && (
          <button
            onClick={() => onSelectQuickFilter('ALL')}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>
    </section>
  );
};
