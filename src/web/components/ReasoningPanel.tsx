import { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

export default function ReasoningPanel({ disruption }: { disruption: any }) {
  const [expanded, setExpanded] = useState(false);

  if (!disruption || !disruption.resolution) return null;

  let resolutionData;
  try {
    resolutionData = JSON.parse(disruption.resolution);
  } catch {
    return null;
  }

  const reasoning = resolutionData.reasoning;
  if (!reasoning) return null;

  const excluded = disruption.alternatives?.filter((a: any) => a.excluded) || [];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mt-4">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-brand/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <ShieldAlert size={16} className="text-brand" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text">AI Reasoning</h4>
            <p className="text-[11px] text-text-muted line-clamp-1">{reasoning.summary}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-border/50 bg-brand/5">
          <div className="grid grid-cols-3 gap-2 mb-4 mt-4">
            <div className="bg-surface rounded-lg p-3 text-center border border-border">
              <p className="text-xl font-bold font-display text-text">{reasoning.detail.totalSearched}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Flights Found</p>
            </div>
            <div className="bg-surface rounded-lg p-3 text-center border border-border">
              <p className="text-xl font-bold font-display text-text">{reasoning.detail.validOptions}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Valid Options</p>
            </div>
            <div className="bg-surface rounded-lg p-3 text-center border border-border">
              <p className="text-xl font-bold font-display text-error">{reasoning.detail.excludedOptions}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Excluded</p>
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-4 p-3 bg-surface rounded-lg border border-border">
            <span className="font-bold text-brand mr-2">Top Pick Rationale:</span>
            {reasoning.detail.topPickReason || 'Best overall balance of price and time.'}
          </p>

          {excluded.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Excluded by Policy</h5>
              <div className="space-y-2">
                {excluded.map((alt: any) => (
                  <div key={alt.id} className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border">
                    <XCircle size={14} className="text-error mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-text">{alt.airline} {alt.flightNumber} - ₹{alt.price}</p>
                      <p className="text-[10px] text-error">{alt.exclusionReason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
