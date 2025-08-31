
'use client';

import { cn } from "@/lib/utils";

export function GraphLegend({ className }: { className?: string }) {
  return (
    <div className={cn("p-3 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm text-sm text-card-foreground shadow-lg space-y-3 font-code", className)}>
      <h4 className="font-semibold text-center border-b border-white/10 pb-2 mb-2">Legend</h4>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent-2))' }} />
          <span>IP Node</span>
        </li>
        <li className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent-1))' }} />
          <span>Phone Node</span>
        </li>
        <li className="flex items-center gap-2">
          <div className="w-0.5 h-4" style={{ backgroundColor: '#4b5563' }} />
          <span>Normal Session</span>
        </li>
        <li className="flex items-center gap-2">
          <div className="w-0.5 h-4" style={{ backgroundColor: 'hsl(var(--danger))' }} />
          <span>Anomalous Session</span>
        </li>
        <li className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--accent-3))' }} />
          <span>Searched / Highlighted</span>
        </li>
      </ul>
    </div>
  );
}
