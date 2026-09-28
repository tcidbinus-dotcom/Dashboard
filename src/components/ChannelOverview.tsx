import React from 'react';
import { ChannelSummary, ChannelType } from '../types';
import { Layers, ChevronRight } from 'lucide-react';

interface ChannelOverviewProps {
  summaries: ChannelSummary[];
  selectedChannel: 'ALL' | ChannelType;
  onSelectChannel: (channel: 'ALL' | ChannelType) => void;
}

export const ChannelOverview: React.FC<ChannelOverviewProps> = ({
  summaries,
  selectedChannel,
  onSelectChannel,
}) => {
  return (
    <section aria-label="Channel Overview" className="bg-white rounded-lg border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            Omni-Channel Queues
          </h2>
        </div>

        {selectedChannel !== 'ALL' && (
          <button
            onClick={() => onSelectChannel('ALL')}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 underline cursor-pointer"
          >
            Clear Channel Filter ({selectedChannel})
          </button>
        )}
      </div>

      {/* Clean Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaries.map((summary) => {
          const isSelected = selectedChannel === summary.channel;
          const hasOverSla = summary.overSla > 0;

          return (
            <div
              key={summary.channel}
              onClick={() => onSelectChannel(isSelected ? 'ALL' : summary.channel)}
              className={`rounded-lg border p-3.5 transition-all duration-150 cursor-pointer bg-white ${
                isSelected
                  ? 'border-slate-900 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300'
              } ${hasOverSla ? 'border-l-4 border-l-rose-500' : ''}`}
            >
              {/* Channel Header */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  Queue {summary.channel}
                </span>

                {hasOverSla ? (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    {summary.overSla} Over SLA
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Nominal
                  </span>
                )}
              </div>

              {/* Data Rows - Clean & Neutral */}
              <div className="grid grid-cols-4 gap-1 text-center py-1">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Online</div>
                  <div className="text-xs font-semibold font-mono tabular-nums text-slate-800">
                    {summary.online}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Avail</div>
                  <div className="text-xs font-semibold font-mono tabular-nums text-slate-800">
                    {summary.available}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Active</div>
                  <div className="text-xs font-semibold font-mono tabular-nums text-slate-800">
                    {summary.activeChat}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Waiting</div>
                  <div className={`text-xs font-bold font-mono tabular-nums ${summary.waiting > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                    {summary.waiting}
                  </div>
                </div>
              </div>

              {/* Quiet Footer */}
              <div className="mt-2 pt-1 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                <span>{isSelected ? 'Filtered' : 'Filter queue'}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
