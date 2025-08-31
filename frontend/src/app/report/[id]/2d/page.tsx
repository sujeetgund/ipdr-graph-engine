
'use client';

import { useParams } from 'next/navigation';
import { useReports } from '@/hooks/use-reports';
import { GraphView2D } from '@/components/ipdr/graph-view-2d';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Report } from '@/types/ipdr';
import { GraphData } from '@/types/ipdr';

export default function Report2DPage() {
  const params = useParams();
  const { getReportById } = useReports();
  const [report, setReport] = useState<Report | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      const loadReport = async () => {
        setIsLoading(true);
        const foundReport = await getReportById(id);
        setReport(foundReport ?? undefined);
        setIsLoading(false);
      }
      loadReport();
    }
  }, [id, getReportById]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Report Not Found</h1>
        <p className="mt-2 text-muted-foreground">The report with ID "{id}" could not be found.</p>
      </div>
    );
  }

  const graphData: GraphData = { nodes: report.nodes, edges: report.edges };

  return (
    <div className="h-full w-full flex flex-col">
       <GraphView2D 
          reportId={report.id}
          graphData={graphData} 
          title={`Full Graph: ${report.fileName}`} 
        />
    </div>
  );
}
