import { Check } from 'lucide-react';
import type { DeliveryStatus } from '../../types';
import { TIMELINE_STAGES, getStatusIndex } from '../../types';

export default function DeliveryTimeline({ status }: { status: DeliveryStatus }) {
  const currentIndex = getStatusIndex(status);
  const cancelled = status === 'cancelled';

  if (cancelled) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        This delivery has been cancelled.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {TIMELINE_STAGES.map((stage, idx) => {
        const done = idx <= currentIndex;
        const active = idx === currentIndex;
        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? active
                      ? 'rainbow-gradient border-transparent text-white rainbow-glow'
                      : 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {done && !active ? <Check size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              {idx < TIMELINE_STAGES.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[32px] ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p className={`text-sm font-medium ${done ? 'text-navy' : 'text-slate-400'}`}>{stage.label}</p>
              {active && <p className="text-xs text-violet-600 mt-0.5">Current stage</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
