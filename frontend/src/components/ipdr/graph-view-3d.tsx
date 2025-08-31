
'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { GraphData, IpdrNode, IpdrEdge } from '@/types/ipdr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, LocateFixed, SlidersHorizontal, CalendarIcon } from 'lucide-react';
import { NodeDetails } from './node-details';
import { EdgeDetails } from './edge-details';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { GraphLegend } from './graph-legend';
import SpriteText from 'three-spritetext';


interface GraphView3DProps {
  reportId: string;
  graphData: GraphData;
  title: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const GraphView3D: React.FC<GraphView3DProps> = ({ reportId, graphData, title, searchQuery: initialSearchQuery = '', onSearch }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedNode, setSelectedNode] = useState<IpdrNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<IpdrEdge | null>(null);
  const [hoveredObject, setHoveredObject] = useState<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number>();
  
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const targetPositionRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean, content: {id: string, type: 'ip' | 'phone'}, x: number, y: number } | null>(null);
  
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

  const { highlightedNode, highlightedEdges } = useMemo(() => {
    if (!searchQuery) return { highlightedNode: null, highlightedEdges: new Set() };

    const node = filteredGraphData.nodes.find(n => String(n.id).includes(searchQuery));
    if (!node) return { highlightedNode: null, highlightedEdges: new Set() };

    const edges = new Set(
      filteredGraphData.edges.filter(e => e.source === node.id || e.target === node.id).map(e => e.id)
    );

    return { highlightedNode: node, highlightedEdges: edges };
  }, [searchQuery, filteredGraphData]);


  useEffect(() => {
    if (!mountRef.current) return;
    
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    const { nodes: renderNodes, edges: renderEdges } = filteredGraphData;

    if (renderNodes.length === 0) return;

    const currentMount = mountRef.current;
    const { clientWidth: width, clientHeight: height } = currentMount;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07070B);
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    cameraRef.current = camera;
    const initialZoom = renderNodes.length > 100 ? renderNodes.length * 1.5 : 250;
    camera.position.z = initialZoom;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    const nodeGeometry = new THREE.SphereGeometry(1, 16, 16);
    const ipMaterial = new THREE.MeshStandardMaterial({ color: 0x55E6FF });
    const phoneMaterial = new THREE.MeshStandardMaterial({ color: 0x00FFA3 });
    const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0x7C4DFF, emissive: 0x7C4DFF, emissiveIntensity: 0.8 });
    
    const edgeHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0x7C4DFF, transparent: true, opacity: 1 });

    const nodeMap = new Map<string | number, THREE.Mesh>();
    const nodePositions = new Map<string | number, THREE.Vector3>();

    renderNodes.forEach(node => {
      const isHighlighted = highlightedNode?.id === node.id;
      let material = isHighlighted ? highlightMaterial.clone() : (node.type === 'phone' ? phoneMaterial.clone() : ipMaterial.clone());
      
      const sphere = new THREE.Mesh(nodeGeometry, material);
      sphere.scale.set(7, 7, 7); 
      if (isHighlighted) {
        sphere.scale.set(10, 10, 10);
      }
      
      const positionSpread = Math.max(renderNodes.length * 5, 200);
      sphere.position.set(
        (Math.random() - 0.5) * positionSpread,
        (Math.random() - 0.5) * positionSpread,
        (Math.random() - 0.5) * positionSpread
      );
      
      (sphere as any).userData = { 
          type: 'node', 
          data: node
      };
      
      scene.add(sphere);
      nodeMap.set(node.id, sphere);
      nodePositions.set(node.id, sphere.position);
    });
    
    const zoomToNode = (nodeId: string | number | null) => {
        if (!nodeId) return;
        const targetNode = renderNodes.find(n => n.id == nodeId);
        if (targetNode && nodePositions.has(targetNode.id)) {
            const targetPosition = nodePositions.get(targetNode.id)!;
            const lookAt = new THREE.Vector3().copy(targetPosition);
            
            const offset = new THREE.Vector3(0, 0, 150);
            const cameraEndPosition = new THREE.Vector3().copy(lookAt).add(offset);
            
            targetPositionRef.current = cameraEndPosition;
            targetLookAtRef.current = lookAt;
        }
    };

    if (highlightedNode) {
        zoomToNode(highlightedNode.id);
    }

    const lines = new THREE.Group();
    renderEdges.forEach(edge => {
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);

        if (sourcePos && targetPos) {
            const isAnomalous = edge.isAnomalous;
            const isHighlighted = highlightedEdges.has(edge.id);

            const color = isAnomalous ? 0xFF416C : 0x4b5563;
            const opacity = isAnomalous ? 0.9 : 0.5;

            const distance = sourcePos.distanceTo(targetPos);
            const cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, distance, 8, 1);
            
            const material = isHighlighted 
                ? edgeHighlightMaterial.clone() 
                : new THREE.MeshBasicMaterial({ color, transparent: true, opacity });

            const cylinder = new THREE.Mesh(cylinderGeometry, material);

            const orientation = new THREE.Matrix4();
            const offsetRotation = new THREE.Matrix4();
            orientation.lookAt(sourcePos, targetPos, new THREE.Object3D().up);
            offsetRotation.makeRotationX(Math.PI / 2);
            orientation.multiply(offsetRotation);
            cylinder.applyMatrix4(orientation);
            
            cylinder.position.copy(sourcePos).add(targetPos).divideScalar(2);

            (cylinder as any).userData = { type: 'edge', data: edge };
            lines.add(cylinder);
        }
    });
    scene.add(lines);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 3;
    const mouse = new THREE.Vector2();

    const onDoubleClick = (event: MouseEvent) => {
        if (!currentMount) return;
        const bounds = currentMount.getBoundingClientRect();
        mouse.x = ((event.clientX - bounds.left) / width) * 2 - 1;
        mouse.y = -((event.clientY - bounds.top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            const firstIntersect = intersects[0].object;
            const userData = (firstIntersect as any).userData;
            if (userData.type === 'node') {
                setSelectedNode(userData.data);
            } else if (userData.type === 'edge') {
                 const edgeObject = lines.children.find(c => c.uuid === firstIntersect.uuid);
                 if (edgeObject) {
                    setSelectedEdge((edgeObject as any).userData.data);
                 }
            }
        }
    };
    currentMount.addEventListener('dblclick', onDoubleClick);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const onMouseDown = (e: MouseEvent) => { isDragging = true; previousMousePosition = { x: e.offsetX, y: e.offsetY }; };
    const onMouseUp = () => { isDragging = false; };
    
    const onMouseMove = (e: MouseEvent) => {
        if (!currentMount) return;
        const bounds = currentMount.getBoundingClientRect();
        
        if (isDragging) {
            setTooltip(null);
            targetPositionRef.current = null;
            targetLookAtRef.current = null;

            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            
            const rotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                deltaMove.y * 0.005,
                deltaMove.x * 0.005,
                0,
                'XYZ'
            ));
            
            if (highlightedNode && nodePositions.has(highlightedNode.id)) {
                const targetPosition = nodePositions.get(highlightedNode.id)!;
                camera.position.sub(targetPosition);
                camera.position.applyQuaternion(rotationQuaternion);
                camera.position.add(targetPosition);
            } else {
                 scene.rotation.y += deltaMove.x * 0.005;
                 scene.rotation.x += deltaMove.y * 0.005;
            }

            previousMousePosition = { x: e.offsetX, y: e.offsetY };
            return;
        }

        mouse.x = ((e.clientX - bounds.left) / width) * 2 - 1;
        mouse.y = -((e.clientY - bounds.top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        const newHoveredObject = intersects.length > 0 ? intersects[0].object : null;
        setHoveredObject(newHoveredObject);

        if (newHoveredObject) {
            const userData = (newHoveredObject as any).userData;
            if (userData && userData.type === 'node') {
                const worldPos = new THREE.Vector3();
                newHoveredObject.getWorldPosition(worldPos);
                const screenPos = worldPos.clone().project(camera);
                
                setTooltip({
                    visible: true,
                    content: { id: String(userData.data.id), type: userData.data.type },
                    x: (screenPos.x + 1) / 2 * width,
                    y: -(screenPos.y - 1) / 2 * height,
                });

            } else {
                setTooltip(null);
            }
        } else {
            setTooltip(null);
        }
    };
    
    const onWheel = (e: WheelEvent) => {
        targetPositionRef.current = null;
        targetLookAtRef.current = null;
        camera.position.z += e.deltaY * 0.1;
    };
    
    const onMouseOut = () => {
         setTooltip(null);
         setHoveredObject(null);
    }

    currentMount.addEventListener('mousedown', onMouseDown);
    currentMount.addEventListener('mouseup', onMouseUp);
    currentMount.addEventListener('mousemove', onMouseMove);
    currentMount.addEventListener('wheel', onWheel);
    currentMount.addEventListener('mouseout', onMouseOut);


    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (targetPositionRef.current && targetLookAtRef.current) {
          camera.position.lerp(targetPositionRef.current, delta * 2);
          const currentLookAt = new THREE.Vector3();
          camera.getWorldDirection(currentLookAt);
          currentLookAt.add(camera.position);
          const targetDir = new THREE.Vector3().subVectors(targetLookAtRef.current, camera.position).normalize();
          const newDir = new THREE.Vector3().lerpVectors(camera.getWorldDirection(new THREE.Vector3()), targetDir, delta * 2).normalize();
          camera.lookAt(camera.position.clone().add(newDir));
          
          if(camera.position.distanceTo(targetPositionRef.current) < 0.1) {
              targetPositionRef.current = null;
              targetLookAtRef.current = null;
          }
      } else {
        if(highlightedNode && nodePositions.has(highlightedNode.id)){
            camera.lookAt(nodePositions.get(highlightedNode.id)!);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const { clientWidth: newWidth, clientHeight: newHeight } = mountRef.current;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeEventListener('dblclick', onDoubleClick);
        currentMount.removeEventListener('mousedown', onMouseDown);
        currentMount.removeEventListener('mouseup', onMouseUp);
        currentMount.removeEventListener('mousemove', onMouseMove);
        currentMount.removeEventListener('wheel', onWheel);
        currentMount.removeEventListener('mouseout', onMouseOut);
        if(renderer.domElement.parentNode === currentMount) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      scene.traverse(object => {
          if (object instanceof THREE.Mesh) {
              if (object.geometry) object.geometry.dispose();
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else if (object.material) {
                object.material.dispose();
              }
          } else if (object instanceof THREE.Line) {
              if (object.geometry) object.geometry.dispose();
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else if (object.material) {
                object.material.dispose();
              }
          }
      });
    };
  }, [filteredGraphData, highlightedNode, highlightedEdges]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(onSearch){
        onSearch(searchQuery);
    } else {
        const url = new URL(window.location.href);
        url.searchParams.set('q', searchQuery);
        router.replace(url.toString(), { scroll: false });
    }
  };

  const zoomToNodeAction = () => {
      if (highlightedNode) {
        const url = new URL(window.location.href);
        url.searchParams.set('q', String(highlightedNode.id));
        router.replace(url.toString(), { scroll: false });
      }
  };


  return (
    <div className="relative h-full w-full flex flex-col bg-background">
      <div className="flex items-center gap-4 p-2 border-b flex-wrap">
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
        {highlightedNode && (
            <Button variant="outline" size="icon" onClick={zoomToNodeAction}>
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
                    <Checkbox id="anomalous" checked={showAnomalousOnly} onCheckedChange={(checked) => setShowAnomalousOnly(Boolean(checked))} />
                    <Label htmlFor="anomalous">Show Anomalous Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="late-night-3d" checked={showLateNightOnly} onCheckedChange={(checked) => setShowLateNightOnly(Boolean(checked))} />
                    <Label htmlFor="late-night-3d">Late Night Calls Only (10pm-6am)</Label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex-grow relative">
        {tooltip?.visible && (
             <div
                className="absolute p-2 text-xs text-white bg-black/80 rounded-md pointer-events-none font-code"
                style={{
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: 'translate(-50%, -130%)',
                }}
            >
                <div className="flex flex-col gap-1 items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tooltip.content.type === 'phone' ? 'hsl(var(--accent-1))' : 'hsl(var(--accent-2))' }} />
                        <span className="font-semibold">{tooltip.content.type === 'phone' ? 'Phone Node' : 'IP Node'}</span>
                    </div>
                    <code className="text-white/80">{tooltip.content.id}</code>
                </div>
            </div>
        )}
        {filteredGraphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-lg text-muted-foreground">No data to display for the selected filters.</p>
            </div>
        ) : (
            <div className="w-full h-full" ref={mountRef} />
        )}
        <GraphLegend className="absolute bottom-4 left-4" />
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
