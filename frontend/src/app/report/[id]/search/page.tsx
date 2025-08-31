
'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useReports } from '@/hooks/use-reports';
import { GraphView3D } from '@/components/ipdr/graph-view-3d';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Network, Users, Search, FileDown, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { Report, GraphData, IpdrNode, IpdrEdge, MapLocation } from '@/types/ipdr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraphView2D } from '@/components/ipdr/graph-view-2d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MapView } from '@/components/ipdr/map-view';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// Extend jsPDF with autotable typings
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}


export default function ReportSearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getReportById } = useReports();
  const [isLoading, setIsLoading] = useState(true);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const query = searchParams.get('q') || '';
  
  const [localQuery, setLocalQuery] = useState(query);
  const [report, setReport] = useState<Report | undefined>(undefined);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [activeTab, setActiveTab] = useState('2d');
  const [isMapConfirmationOpen, setIsMapConfirmationOpen] = useState(false);


  useEffect(() => {
    if (id) {
      const loadReport = async () => {
        setIsLoading(true);
        const r = await getReportById(id);
        setReport(r ?? undefined);
        setIsLoading(false);
      }
      loadReport();
    }
  }, [id, getReportById]);

  useEffect(() => {
    if (report && query) {
      // Find all nodes that match the query
      const mainNodes = report.nodes.filter(n => String(n.id).includes(query));
      const mainNodeIds = new Set(mainNodes.map(n => n.id));

      if (mainNodes.length > 0) {
        // Get all edges connected to the main nodes
        const connectedEdges = report.edges.filter(e => 
          mainNodeIds.has(e.source) || mainNodeIds.has(e.target)
        );

        // Get all unique node IDs from those edges
        const connectedNodeIds = new Set<string | number>(mainNodeIds);
        connectedEdges.forEach(edge => {
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        });
        
        // Filter the full node list to get the sub-graph nodes
        const subNodes = report.nodes.filter(n => connectedNodeIds.has(n.id));

        const locations = connectedEdges
          .map((edge, index) => {
              const lat = parseFloat(edge.data.cell_tower_lat);
              const lng = parseFloat(edge.data.cell_tower_lon);
              if (isNaN(lat) || isNaN(lng)) return null;

              return {
                  id: edge.id || `loc-${index}`,
                  lat,
                  lng,
                  title: `Session: ${edge.data.session_id}`,
                  details: {
                      Timestamp: edge.data.timestamp ? new Date(edge.data.timestamp).toLocaleString() : 'N/A',
                      Protocol: edge.data.protocol || 'N/A',
                      ConnectedTo: String(edge.source) === query ? edge.target : edge.source,
                      Duration: `${edge.data.duration_sec}s`
                  }
              };
          })
          .filter((loc): loc is MapLocation => loc !== null);


        setMapLocations(locations);
        setFilteredData({ nodes: subNodes, edges: connectedEdges });
      } else {
        setFilteredData({ nodes: [], edges: [] }); // Node not found
        setMapLocations([]);
      }
    } else {
       setFilteredData(null); // No query, so no graph to show yet
       setMapLocations([]);
    }
  }, [report, query]);
  
  const handleDownloadPdf = async () => {
    if (!report || !filteredData || !query) return;

    setIsGeneratingPdf(true);
    try {
        const doc = new jsPDF();
        const mainNode = report.nodes.find(n => n.id == query);
        if (!mainNode) {
            console.error("Main node for report not found");
            return;
        }

        const anomalousConnections = filteredData.edges.filter(edge => edge.isAnomalous).length;
        
        // Find associated identifiers
        let associatedId: string | undefined;
        for (const edge of filteredData.edges) {
            if (mainNode.type === 'phone') {
                if (edge.source == mainNode.id && edge.data.src_ip) { associatedId = `IP: ${edge.data.src_ip}`; break; }
                if (edge.target == mainNode.id && edge.data.dst_ip) { associatedId = `IP: ${edge.data.dst_ip}`; break; }
            } else { // type is 'ip'
                if (edge.source == mainNode.id && edge.data.src_phone) { associatedId = `Phone: ${edge.data.src_phone}`; break; }
                if (edge.target == mainNode.id && edge.data.dst_phone) { associatedId = `Phone: ${edge.data.dst_phone}`; break; }
            }
        }


        // Title
        doc.setFontSize(22);
        doc.text(`Isolated Node In-Depth Report`, 105, 20, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Original File: ${report.fileName}`, 105, 28, { align: 'center' });

        // Node Summary Section
        doc.setFontSize(16);
        doc.text('Node Under Investigation', 14, 45);
        doc.setFontSize(11);
        doc.text(`Node ID: ${mainNode.id}`, 14, 52);
        doc.text(`Node Type: ${mainNode.type.charAt(0).toUpperCase() + mainNode.type.slice(1)}`, 14, 59);
        if (associatedId) {
            doc.text(`Associated: ${associatedId}`, 14, 66);
        }
        doc.text(`Total Connections in Report: ${filteredData.edges.length}`, 110, 52);
        doc.text(`Anomalous Connections: ${anomalousConnections}`, 110, 59);
        
        let startY = 80;

        // Cell Tower Activity Table
        const cellTowerSessions = filteredData.edges.filter(edge => edge.data.cell_tower_lat && edge.data.cell_tower_lon);
        if (cellTowerSessions.length > 0) {
            doc.setFontSize(16);
            doc.text('Cell Tower Activity', 14, startY);
            
            const towerTableBody = cellTowerSessions.map(edge => {
                const otherParty = edge.source == mainNode.id ? edge.target : edge.source;
                const timestamp = edge.data.timestamp ? new Date(edge.data.timestamp).toLocaleString() : 'N/A';
                return [
                    timestamp,
                    `${edge.data.cell_tower_lat}, ${edge.data.cell_tower_lon}`,
                    otherParty
                ];
            });

            doc.autoTable({
                startY: startY + 5,
                head: [['Timestamp', 'Cell Tower Geolocation (Lat, Lon)', 'Connected To']],
                body: towerTableBody,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8 },
            });
            startY = (doc as any).lastAutoTable.finalY + 15;
        }


        // Full Session Details Table
        doc.setFontSize(16);
        doc.text('All Session Details', 14, startY);
        
        const tableBody = filteredData.edges.map(edge => [
            edge.data.session_id || 'N/A',
            edge.source,
            edge.target,
            edge.data.protocol || 'N/A',
            edge.data.duration_sec || 'N/A',
            edge.data.bytes || 'N/A',
            edge.isAnomalous ? 'Yes' : 'No',
        ]);

        doc.autoTable({
            startY: startY + 5,
            head: [['Session ID', 'Source', 'Destination', 'Protocol', 'Duration (s)', 'Bytes', 'Anomalous?']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 },
        });
        
        doc.save(`in-depth-report-${query}-${report.fileName.replace('.csv', '')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };


  const handleNewSearch = (newQuery: string) => {
    if (newQuery.trim()) {
        router.push(`/report/${id}/search?q=${encodeURIComponent(newQuery.trim())}`);
    } else {
        router.push(`/report/${id}/search`);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleNewSearch(localQuery);
  };

  const handleTabChange = (value: string) => {
    if (value === 'map') {
      setIsMapConfirmationOpen(true);
    } else {
      setActiveTab(value);
    }
  };


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

  // Initial state or after a search with no query
  if (!query) {
    return (
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
           <div className="flex items-center justify-between">
                <h1 className="font-semibold text-lg md:text-2xl">Isolate Node</h1>
                <Button variant="outline" onClick={() => router.push(`/report/${id}`)}>Back to Report</Button>
           </div>
           <Card>
                <CardHeader>
                    <CardTitle>Search for a Node</CardTitle>
                    <CardDescription>
                        Enter an IP address or Phone number to view its direct connections in an isolated graph.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="Enter IP or Phone..."
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                        />
                        <Button type="submit">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardContent>
           </Card>
       </main>
    )
  }
  
  if (filteredData && filteredData.nodes.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Node not found</h1>
        <p className="mt-2 text-muted-foreground">The node "{query}" could not be found in this report.</p>
         <Button onClick={() => router.push(`/report/${id}/search`)} className="mt-6">New Search</Button>
      </div>
    );
  }

  if (!filteredData) {
      return (
         <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-[70vh] w-full" />
        </div>
      )
  }


  return (
    <div className="h-screen w-full flex flex-col">
       <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full w-full flex flex-col">
        <div className="flex items-center p-2 border-b gap-2">
            <TabsList>
                <TabsTrigger value="2d">2D View</TabsTrigger>
                <TabsTrigger value="3d">3D View</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
             <div className="ml-auto flex items-center gap-2">
                <Button onClick={handleDownloadPdf} size="sm" variant="outline" disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Download PDF
                </Button>
                <Button onClick={() => router.push(`/report/${id}/search`)} size="sm">
                   New Search
                </Button>
            </div>
        </div>
        <TabsContent value="2d" className="flex-grow m-0">
            <GraphView2D 
                reportId={id}
                graphData={filteredData!}
                title={`Isolated: ${query}`}
                searchQuery={query}
            />
        </TabsContent>
        <TabsContent value="3d" className="flex-grow m-0">
             <GraphView3D 
                reportId={id}
                graphData={filteredData!}
                title={`Isolated: ${query}`}
                searchQuery={query}
            />
        </TabsContent>
        <TabsContent value="map" className="flex-grow m-0">
             <MapView locations={mapLocations} />
        </TabsContent>
      </Tabs>
      <AlertDialog open={isMapConfirmationOpen} onOpenChange={setIsMapConfirmationOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Map View</AlertDialogTitle>
                <AlertDialogDescription>
                    Loading the map uses the Google Maps API and may incur costs associated with your API key. Do you want to proceed?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => setActiveTab('map')}>
                    Proceed
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
