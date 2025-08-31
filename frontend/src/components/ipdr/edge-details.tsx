
'use client';

import { IpdrEdge } from '@/types/ipdr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface EdgeDetailsProps {
  edge: IpdrEdge | null;
  onOpenChange: (open: boolean) => void;
}

export function EdgeDetails({ edge, onOpenChange }: EdgeDetailsProps) {
  if (!edge) return null;

  const details = Object.entries(edge.data);

  return (
    <Dialog open={!!edge} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
          <DialogDescription className="flex items-center gap-2 font-mono text-sm">
            <span>{edge.source}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{edge.target}</span>
          </DialogDescription>
        </DialogHeader>
        
        {edge.isAnomalous && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive-foreground border border-destructive/20">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-destructive">Anomaly Detected</h4>
                        <p className="text-sm text-destructive/80">{edge.anomalyReason}</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
            {details.map(([key, value]) => (
                <div key={key}>
                    <p className="text-muted-foreground">{key}</p>
                    <p className="font-medium">{value}</p>
                </div>
            ))}
        </div>

      </DialogContent>
    </Dialog>
  );
}
