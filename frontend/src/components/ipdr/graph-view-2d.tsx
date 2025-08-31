
'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { GraphData, IpdrNode, IpdrEdge } from '@/types/ipdr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Loader2, ZoomIn, ZoomOut, Move, LocateFixed, SlidersHorizontal, CalendarIcon } from 'lucide-react';
import { NodeDetails } from './node-details';
import { EdgeDetails } from './edge-details';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { GraphLegend } from './graph-legend';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';

interface GraphView2DProps {
  reportId: string;
  graphData: GraphData;
  title: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const GraphView2D: React.FC<GraphView2DProps> = ({ reportId, graphData, title, searchQuery: initialSearchQuery = '', onSearch }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedNode, setSelectedNode] = useState<IpdrNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<IpdrEdge | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [isLaidOut, setIsLaidOut] = useState(false);

  // Filter states
  const [protocol, setProtocol] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [duration, setDuration] = useState<[number]>([1000]);
  const [showAnomalousOnly, setShowAnomalousOnly] = useState<boolean>(false);
  const [showLateNightOnly, setShowLateNightOnly] = useState<boolean>(false);
  const [maxDuration, setMaxDuration] = useState(1000);
  
  useEffect(() => {
    if (graphData.edges.length > 0) {
      const max = graphData.edges.reduce((max, edge) => {
        const dur = parseInt(edge.data.duration_sec, 10);
        return isNaN(dur) ? max : Math.max(max, dur);
      }, 0);
      setMaxDuration(max > 0 ? max : 1000);
      setDuration([max > 0 ? max : 1000]);
    }
  }, [graphData]);

  const filteredGraphData = useMemo(() => {
    const { nodes, edges } = graphData;
    let filteredEdges = edges;

    if (protocol !== 'all') {
      filteredEdges = filteredEdges.filter(e => e.data.protocol?.toLowerCase() === protocol.toLowerCase());
    }

    if (dateRange?.from) {
       const toDate = dateRange.to || dateRange.from;
       filteredEdges = filteredEdges.filter(e => {
         try {
            const edgeDate = new Date(e.data.timestamp);
            return edgeDate >= dateRange.from! && edgeDate <= toDate;
         } catch {
            return false;
         }
       });
    }

    filteredEdges = filteredEdges.filter(e => {
        const dur = parseInt(e.data.duration_sec, 10);
        return isNaN(dur) ? true : dur <= duration[0];
    });

    if (showAnomalousOnly) {
        filteredEdges = filteredEdges.filter(e => e.isAnomalous);
    }

    if (showLateNightOnly) {
        filteredEdges = filteredEdges.filter(e => {
            try {
                const edgeDate = new Date(e.data.timestamp);
                const hour = edgeDate.getHours();
                return hour >= 22 || hour < 6; // 10 PM to 6 AM
            } catch {
                return false;
            }
        });
    }
    
    const visibleNodeIds = new Set<string | number>();
    filteredEdges.forEach(edge => {
        visibleNodeIds.add(edge.source);
        visibleNodeIds.add(edge.target);
    });
    
    const filteredNodes = nodes.filter(n => visibleNodeIds.has(n.id));

    return { nodes: filteredNodes, edges: filteredEdges };

  }, [graphData, protocol, dateRange, duration, showAnomalousOnly, showLateNightOnly]);

  const [nodePositions2D, setNodePositions2D] = useState<Map<string | number, { x: number, y: number }>>(new Map());
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, k: 1 });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const { highlightedNodeId, highlightedEdgeIds } = useMemo(() => {
    if (!searchQuery) return { highlightedNodeId: null, highlightedEdgeIds: new Set() };
  
    const node = filteredGraphData.nodes.find(n => String(n.id).includes(searchQuery));
    if (!node) return { highlightedNodeId: null, highlightedEdgeIds: new Set() };
  
    const edgeIds = new Set(
      filteredGraphData.edges.filter(e => e.source === node.id || e.target === node.id).map(e => e.id)
    );
  
    return { highlightedNodeId: node.id, highlightedEdgeIds: edgeIds };
  }, [searchQuery, filteredGraphData]);
  
  const zoomToNode = (nodeId: string | number | null) => {
    if (!nodeId || !mountRef.current) return;

    const targetNode = filteredGraphData.nodes.find(n => n.id == nodeId);
    if (!targetNode || !nodePositions2D.has(targetNode.id)) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const nodePos = nodePositions2D.get(targetNode.id)!;
    const newK = 2; // Zoom level
    const newX = width / 2 - nodePos.x * newK;
    const newY = height / 2 - nodePos.y * newK;
    
    setViewTransform({ x: newX, y: newY, k: newK });
  };
  
  useEffect(() => {
    if (highlightedNodeId && isLaidOut) {
      zoomToNode(highlightedNodeId);
    }
  }, [highlightedNodeId, isLaidOut, nodePositions2D]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || filteredGraphData.nodes.length === 0) {
      if (filteredGraphData.nodes.length === 0) setIsLaidOut(true);
      return;
    }
    
    setIsLaidOut(false);
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    setViewTransform({ x: width / 2, y: height / 2, k: 1 });

    const k = Math.sqrt(width * height / (filteredGraphData.nodes.length || 1));
    const charge = -k * 120;
    const linkDistance = 80;
    const gravity = 0.05;
    
    let nodes = filteredGraphData.nodes.map(node => ({
        ...node,
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        vx: 0,
        vy: 0
    }));

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    const applyForces = () => {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) dist = 0.1;
                const force = charge / (dist * dist);
                
                if (isFinite(force)) {
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    if(isFinite(fx) && isFinite(fy)){
                        a.vx -= fx;
                        a.vy -= fy;
                        b.vx += fx;
                        b.vy += fy;
                    }
                }
            }
        }

        filteredGraphData.edges.forEach(edge => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const force = (dist - linkDistance) * 0.05;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if(isFinite(fx) && isFinite(fy)){
                  source.vx += fx;
                  source.vy += fy;
                  target.vx -= fx;
                  target.vy -= fy;
              }
            }
        });
        
        nodes.forEach(node => {
            node.vx += (0 - node.x) * gravity;
            node.vy += (0 - node.y) * gravity;
            node.vx *= 0.9; // damping
            node.vy *= 0.9;

            if (isFinite(node.vx) && isFinite(node.vy)) {
                node.x += node.vx;
                node.y += node.vy;
            }
        });
    };

    for (let i = 0; i < 300; i++) {
        applyForces();
    }
    
    setNodePositions2D(new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }])));
    setIsLaidOut(true);

  }, [filteredGraphData]);

  const handleNodeClick = (node: IpdrNode) => setSelectedNode(node);
  const handleEdgeClick = (edge: IpdrEdge) => setSelectedEdge(edge);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
        onSearch(searchQuery);
    } else {
      zoomToNode(searchQuery);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isPanning.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = 1.1;
    const { deltaY, clientX, clientY } = e;
    const { x, y, k } = viewTransform;

    if (!mountRef.current) return;
    const mountRect = mountRef.current.getBoundingClientRect();
    const mouseX = clientX - mountRect.left;
    const mouseY = clientY - mountRect.top;

    const newK = deltaY < 0 ? k * scaleFactor : k / scaleFactor;
    
    const newX = mouseX - (mouseX - x) * (newK / k);
    const newY = mouseY - (mouseY - y) * (newK / k);

    setViewTransform({ x: newX, y: newY, k: newK });
  };


  return (
    <div className="relative h-full w-full flex flex-col bg-background">
      <div className="flex items-center gap-4 p-4 border-b flex-wrap">
        <Button asChild variant="outline" size="icon">
            <Link href={`/report/${reportId}`}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Report</span>
            </Link>
        </Button>
        <h1 className="text-xl font-bold flex-grow truncate">{title}</h1>
        {!onSearch && (
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
            <Input 
              placeholder="Search & Highlight..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>
          </form>
        )}
         {highlightedNodeId && (
          <Button variant="outline" size="icon" onClick={() => zoomToNode(highlightedNodeId)}>
            <LocateFixed className="h-5 w-5" />
             <span className="sr-only">Focus on searched node</span>
          </Button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust the filters to refine the graph.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="space-y-2">
                    <Label>Protocol</Label>
                    <Select value={protocol} onValueChange={setProtocol}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="sip">SIP</SelectItem>
                            <SelectItem value="rtp">RTP</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="tcp">TCP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                
                <div className="space-y-2">
                    <Label>Max Duration (sec): {duration[0]}</Label>
                    <Slider 
                        value={duration} 
                        onValueChange={(value) => setDuration(value as [number])}
                        max={maxDuration} 
                        min={0}
                        step={1} 
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="anomalous-2d" checked={showAnomalousOnly} onCheckedChange={(checked) => setShowAnomalousOnly(Boolean(checked))} />
                    <Label htmlFor="anomalous-2d">Show Anomalous Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="late-night-2d" checked={showLateNightOnly} onCheckedChange={(checked) => setShowLateNightOnly(Boolean(checked))} />
                    <Label htmlFor="late-night-2d">Late Night Calls Only (10pm-6am)</Label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-grow relative overflow-hidden" ref={mountRef}>
          {!isLaidOut && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-lg font-medium">Building graph layout...</p>
                <p className="text-muted-foreground">This may take a moment.</p>
            </div>
          )}
           {isLaidOut && filteredGraphData.nodes.length === 0 && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <p className="text-lg text-muted-foreground">No data to display for the selected filters.</p>
                </div>
            )}
          <svg 
            className={cn("w-full h-full transition-opacity duration-500", isLaidOut ? 'opacity-100 cursor-grab' : 'opacity-0', isPanning.current && 'cursor-grabbing')}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <g 
                transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.k})`}
                style={{ transition: 'transform 0.5s ease' }}
            >
            {filteredGraphData.edges.map((edge) => {
              const sourcePos = nodePositions2D.get(edge.source);
              const targetPos = nodePositions2D.get(edge.target);
              if (!sourcePos || !targetPos) return null;

              const isHighlighted = highlightedEdgeIds.has(edge.id);
              const isAnomalous = edge.isAnomalous;
              let strokeColor = isAnomalous ? '#ef4444' : '#4b5563';
              let strokeWidth = isAnomalous ? (3.5 / viewTransform.k) : (2 / viewTransform.k);
              
              if (isHighlighted) {
                strokeColor = '#a855f7';
                strokeWidth = (4 / viewTransform.k);
              }

              return (
                <line
                  key={edge.id}
                  x1={sourcePos.x} y1={sourcePos.y}
                  x2={targetPos.x} y2={targetPos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  onClick={() => handleEdgeClick(edge)}
                  className="cursor-pointer hover:stroke-accent transition-all"
                  onMouseEnter={() => setHoveredObjectId(edge.id)}
                  onMouseLeave={() => setHoveredObjectId(null)}
                />
              );
            })}
            {filteredGraphData.nodes.map((node) => {
              const pos = nodePositions2D.get(node.id);
              if (!pos) return null;
              const isHighlighted = node.id === highlightedNodeId;
              const isHovered = node.id === hoveredObjectId;
              const isPhone = node.type === 'phone';
              
              let fill = isPhone ? '#34d399' : '#6366f1';
              let radius = 8;
              let stroke = '#1A1A1D';
              let strokeWidth = 2;

              if (isHighlighted) {
                fill = '#a855f7';
                radius = 12;
                stroke = '#e9d5ff';
                strokeWidth = 3;
              } else if (isHovered) {
                fill = '#d8b4fe';
                radius = 10;
              }

              return (
                <g key={String(node.id)} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => handleNodeClick(node)} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredObjectId(node.id)}
                  onMouseLeave={() => setHoveredObjectId(null)}
                >
                  <circle r={radius / viewTransform.k} fill={fill} stroke={stroke} strokeWidth={strokeWidth / viewTransform.k} className="transition-all" />
                  {viewTransform.k > 0.5 && (
                    <text x={(radius + 2) / viewTransform.k} y={4 / viewTransform.k} fill="#e5e7eb" fontSize={12 / viewTransform.k} className="pointer-events-none select-none">{node.label}</text>
                  )}
                </g>
              );
            })}
            </g>
          </svg>
            <GraphLegend className="absolute bottom-4 left-4" />
           <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card/80 p-2 rounded-md border">
                    <ZoomIn className="h-4 w-4" />/
                    <ZoomOut className="h-4 w-4" />
                    <span>Scroll to zoom</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card/80 p-2 rounded-md border">
                    <Move className="h-4 w-4" />
                    <span>Drag to pan</span>
                </div>
           </div>
      </div>
      {selectedNode && (
          <NodeDetails 
              node={selectedNode} 
              edges={graphData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)}
              reportId={reportId}
              onOpenChange={() => setSelectedNode(null)} 
          />
      )}
      {selectedEdge && (
          <EdgeDetails 
              edge={selectedEdge}
              onOpenChange={() => setSelectedEdge(null)}
          />
      )}
    </div>
  );
};
