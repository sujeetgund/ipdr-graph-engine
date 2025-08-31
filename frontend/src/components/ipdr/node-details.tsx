
'use client';

import { IpdrNode, IpdrEdge } from '@/types/ipdr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ArrowRight, ExternalLink, Search } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface NodeDetailsProps {
  node: IpdrNode | null;
  edges: IpdrEdge[];
  reportId: string;
  onOpenChange: (open: boolean) => void;
}

export function NodeDetails({ node, edges, reportId, onOpenChange }: NodeDetailsProps) {
  if (!node) return null;

  return (
    <Dialog open={!!node} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            Node Details
            <Badge variant={node.type === 'ip' ? 'secondary' : 'default'} className="font-sans">{node.type}</Badge>
          </DialogTitle>
          <DialogDescription className="font-code">{String(node.id)}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Connected Sessions ({edges.length})</h3>
          <ScrollArea className="h-[40vh] rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                        <TableHead>Connection</TableHead>
                        <TableHead>Protocol</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {edges.map((edge) => (
                        <TableRow key={edge.id}>
                            <TableCell>
                                <div className="flex items-center gap-2 font-code text-xs">
                                    <span>{edge.source === node.id ? <b>{String(edge.source)}</b> : String(edge.source)}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span>{edge.target === node.id ? <b>{String(edge.target)}</b> : String(edge.target)}</span>
                                </div>
                            </TableCell>
                            <TableCell>{edge.data['protocol'] || 'N/A'}</TableCell>
                            <TableCell>
                                {edge.isAnomalous ? (
                                    <Badge variant="destructive">Anomalous</Badge>
                                ) : (
                                    <Badge variant="outline">Normal</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4">
            <Button asChild style={{ boxShadow: '0 0 20px hsl(var(--primary)/0.5)' }}>
                <Link href={`/report/${reportId}/search?q=${node.id}`} target="_blank">
                    <Search className="mr-2 h-4 w-4" />
                    Isolate Node
                </Link>
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
